import { useMemo, useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, Link as LinkIcon, Plus, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useProducts, useInsuranceCustomers } from '@/hooks/useSupabaseData';
import { useQueryClient } from '@tanstack/react-query';
import type { Product, InsuranceCustomer } from '@/types';

// --- Helpers ---
function normalize(s: string) {
  return (s || '').toString().trim().toLowerCase().replace(/\s+/g, ' ');
}

function levenshtein(a: string, b: string) {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (!m) return n; if (!n) return m;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + cost);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string) {
  const A = normalize(a), B = normalize(b);
  if (!A || !B) return 0;
  const d = levenshtein(A, B);
  return 1 - d / Math.max(A.length, B.length);
}

function generateInvoiceNumber(seq: number) {
  return `T-${String(seq).padStart(4, '0')}`;
}

// --- Row state ---
interface ParsedRow {
  idx: number;
  customer_name: string;
  card_number: string;
  product_name: string;
  price: number;
  sale_date?: string; // YYYY-MM-DD
  // resolution
  matchedProductId?: string; // exact match auto
  linkedProductId?: string;  // user-linked
  newProductCost?: number;   // user input → create new
  createNew?: boolean;
  status: 'ready' | 'needs_link' | 'needs_price' | 'needs_decision';
  candidates: { product: Product; score: number }[];
}

const FUZZY_THRESHOLD = 0.55;

function findColumn(headers: string[], keys: string[]): number {
  for (let i = 0; i < headers.length; i++) {
    const h = normalize(headers[i] || '');
    if (keys.some(k => h.includes(k))) return i;
  }
  return -1;
}

export default function ImportHistorical() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { data: products = [] } = useProducts();
  const { data: insuranceCustomers = [] } = useInsuranceCustomers();

  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [fileName, setFileName] = useState('');
  const [importing, setImporting] = useState(false);
  const [summary, setSummary] = useState<{ imported: number; newProducts: number; newCustomers: number } | null>(null);

  // --- Parse file ---
  const handleFile = async (file: File) => {
    setSummary(null);
    setFileName(file.name);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: 'array', cellDates: true });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const aoa: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
      if (aoa.length < 2) {
        toast({ title: 'الملف فارغ', variant: 'destructive' });
        return;
      }
      // find header row (first row with at least 3 non-empty)
      let headerIdx = 0;
      for (let i = 0; i < Math.min(5, aoa.length); i++) {
        if (aoa[i].filter((c: any) => String(c).trim()).length >= 3) { headerIdx = i; break; }
      }
      const headers = (aoa[headerIdx] || []).map((h: any) => String(h));
      const colName = findColumn(headers, ['اسم العميل', 'اسم المشترك', 'العميل', 'name']);
      const colCard = findColumn(headers, ['بطاقة', 'تأمين', 'card']);
      const colProduct = findColumn(headers, ['علاج', 'دواء', 'صنف', 'item', 'product', 'drug']);
      const colPrice = findColumn(headers, ['سعر', 'price', 'البيع', 'مبلغ']);
      const colDate = findColumn(headers, ['تاريخ', 'date']);

      if (colName < 0 || colProduct < 0 || colPrice < 0) {
        toast({ title: 'الأعمدة غير مكتملة', description: 'يجب أن يحتوي الملف على: اسم العميل، اسم العلاج، السعر', variant: 'destructive' });
        return;
      }

      const parsed: ParsedRow[] = [];
      for (let i = headerIdx + 1; i < aoa.length; i++) {
        const r = aoa[i];
        const customer_name = String(r[colName] || '').trim();
        const product_name = String(r[colProduct] || '').trim();
        const card_number = colCard >= 0 ? String(r[colCard] || '').trim() : '';
        const priceRaw = r[colPrice];
        const price = Number(priceRaw) || 0;
        let sale_date: string | undefined;
        if (colDate >= 0 && r[colDate]) {
          const v = r[colDate];
          if (v instanceof Date) sale_date = v.toISOString().slice(0, 10);
          else {
            const d = new Date(v);
            if (!isNaN(d.getTime())) sale_date = d.toISOString().slice(0, 10);
          }
        }
        if (!customer_name && !product_name) continue;
        parsed.push({
          idx: parsed.length,
          customer_name, card_number, product_name, price, sale_date,
          status: 'ready', candidates: [],
        });
      }

      // resolve each row
      const resolved = parsed.map(r => resolveRow(r, products));
      setRows(resolved);
      toast({ title: 'تم تحليل الملف', description: `تم العثور على ${resolved.length} صف` });
    } catch (e) {
      console.error(e);
      toast({ title: 'فشل قراءة الملف', variant: 'destructive' });
    }
  };

  const resolveRow = (r: ParsedRow, productList: Product[]): ParsedRow => {
    const target = normalize(r.product_name);
    if (!target) return { ...r, status: 'needs_price', candidates: [] };
    // exact match by trade_name OR scientific_name
    const exact = productList.find(p => normalize(p.trade_name) === target || normalize(p.scientific_name) === target);
    if (exact) {
      return { ...r, matchedProductId: exact.id, status: 'ready', candidates: [] };
    }
    // fuzzy candidates
    const scored = productList
      .map(p => ({ product: p, score: Math.max(similarity(p.trade_name, r.product_name), similarity(p.scientific_name, r.product_name)) }))
      .filter(c => c.score >= FUZZY_THRESHOLD)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    if (scored.length > 0) {
      return { ...r, status: 'needs_decision', candidates: scored };
    }
    return { ...r, status: 'needs_price', candidates: [] };
  };

  // --- Inline actions ---
  const updateRow = (idx: number, patch: Partial<ParsedRow>) => {
    setRows(prev => prev.map(r => r.idx === idx ? { ...r, ...patch } : r));
  };

  const linkToProduct = (idx: number, productId: string) => {
    updateRow(idx, { linkedProductId: productId, createNew: false, status: 'ready' });
  };

  const setNewProduct = (idx: number, cost: number) => {
    if (cost <= 0) return;
    updateRow(idx, { newProductCost: cost, createNew: true, linkedProductId: undefined, status: 'ready' });
  };

  // --- Categories ---
  const ready = useMemo(() => rows.filter(r => r.status === 'ready'), [rows]);
  const needsPrice = useMemo(() => rows.filter(r => r.status === 'needs_price'), [rows]);
  const needsDecision = useMemo(() => rows.filter(r => r.status === 'needs_decision'), [rows]);

  // --- Import ---
  const importReady = async () => {
    if (ready.length === 0) {
      toast({ title: 'لا يوجد صفوف جاهزة', variant: 'destructive' });
      return;
    }
    setImporting(true);
    let imported = 0, newProductsCount = 0, newCustomersCount = 0;
    try {
      // count starting invoice number
      const { count: invCount } = await supabase.from('invoices').select('*', { count: 'exact', head: true });
      let invSeq = (invCount || 0) + 1;

      // Get/create "مشتريات تاريخية" supplier for new products
      let histSupplierId: string | null = null;
      const ensureHistSupplier = async () => {
        if (histSupplierId) return histSupplierId;
        const { data } = await supabase.from('contacts').select('id').eq('name', 'مشتريات تاريخية').eq('contact_type', 'supplier').limit(1);
        if (data && data.length > 0) { histSupplierId = data[0].id; return histSupplierId; }
        const { data: created, error } = await supabase.from('contacts').insert({ name: 'مشتريات تاريخية', contact_type: 'supplier' }).select('id').single();
        if (error) throw error;
        histSupplierId = created.id;
        return histSupplierId;
      };

      // Cache: customers by card_number or name
      const customerCache = new Map<string, InsuranceCustomer>();
      insuranceCustomers.forEach(c => {
        if (c.card_number) customerCache.set('card:' + c.card_number, c);
        customerCache.set('name:' + normalize(c.name), c);
      });

      // Cache: products
      const productCache = new Map<string, Product>();
      products.forEach(p => productCache.set(p.id, p));

      const getOrCreateCustomer = async (r: ParsedRow): Promise<InsuranceCustomer> => {
        const keyCard = r.card_number ? 'card:' + r.card_number : null;
        const keyName = 'name:' + normalize(r.customer_name);
        if (keyCard && customerCache.has(keyCard)) return customerCache.get(keyCard)!;
        if (customerCache.has(keyName)) return customerCache.get(keyName)!;
        const { data, error } = await supabase.from('insurance_customers').insert({
          name: r.customer_name || 'بدون اسم',
          card_number: r.card_number || null,
        }).select().single();
        if (error) throw error;
        const cust = data as InsuranceCustomer;
        if (keyCard) customerCache.set(keyCard, cust);
        customerCache.set(keyName, cust);
        newCustomersCount++;
        return cust;
      };

      const getOrCreateProductForRow = async (r: ParsedRow): Promise<Product> => {
        if (r.matchedProductId) return productCache.get(r.matchedProductId)!;
        if (r.linkedProductId) return productCache.get(r.linkedProductId)!;
        if (r.createNew && r.newProductCost) {
          const supplierId = await ensureHistSupplier();
          // create product
          const { data: prod, error: prodErr } = await supabase.from('products').insert({
            trade_name: r.product_name,
            cost_price: r.newProductCost,
            sale_price: r.price,
            stock_quantity: 0,
            min_stock: 0,
            packaging_type: 'علبة',
            units_per_package: 1,
            has_expiry: false,
            is_insurance: true,
          }).select().single();
          if (prodErr) throw prodErr;

          // create purchase invoice for 1 unit
          const invNumber = generateInvoiceNumber(invSeq++);
          const { data: inv, error: invErr } = await supabase.from('invoices').insert({
            invoice_type: 'purchase',
            contact_id: supplierId,
            contact_name: 'مشتريات تاريخية',
            invoice_number: invNumber,
            total: r.newProductCost,
            paid: 0,
            status: 'pending',
            invoice_date: r.sale_date || undefined,
          } as any).select().single();
          if (invErr) throw invErr;

          await supabase.from('invoice_items').insert({
            invoice_id: inv.id,
            product_id: prod.id,
            product_name: prod.trade_name,
            quantity: 1,
            unit_price: r.newProductCost,
            total: r.newProductCost,
          });

          await supabase.from('product_batches').insert({
            product_id: prod.id,
            invoice_id: inv.id,
            quantity: 1,
            original_quantity: 1,
          });

          newProductsCount++;
          const product = prod as Product;
          productCache.set(product.id, product);
          return product;
        }
        throw new Error('Row not resolved');
      };

      // Group ready rows by customer to make one sale per customer per date
      type SaleKey = string;
      const groups = new Map<SaleKey, { customer: InsuranceCustomer; date: string; items: { product_id: string; product_name: string; quantity: number; unit_price: number; total: number }[] }>();

      for (const r of ready) {
        const cust = await getOrCreateCustomer(r);
        const product = await getOrCreateProductForRow(r);
        const date = r.sale_date || new Date().toISOString().slice(0, 10);
        const key = `${cust.id}|${date}`;
        if (!groups.has(key)) groups.set(key, { customer: cust, date, items: [] });
        groups.get(key)!.items.push({
          product_id: product.id,
          product_name: product.trade_name,
          quantity: 1,
          unit_price: r.price,
          total: r.price,
        });
      }

      for (const g of groups.values()) {
        const total = g.items.reduce((s, i) => s + i.total, 0);
        const { data: sale, error: saleErr } = await supabase.from('insurance_sales').insert({
          customer_id: g.customer.id,
          customer_name: g.customer.name,
          total,
          sale_date: g.date,
        }).select().single();
        if (saleErr) throw saleErr;
        const items = g.items.map(it => ({ ...it, sale_id: sale.id }));
        const { error: itemsErr } = await supabase.from('insurance_sale_items' as any).insert(items);
        if (itemsErr) throw itemsErr;
        imported += g.items.length;
      }

      // Remove imported rows
      setRows(prev => prev.filter(r => r.status !== 'ready'));
      setSummary({ imported, newProducts: newProductsCount, newCustomers: newCustomersCount });

      queryClient.invalidateQueries({ queryKey: ['insurance_sales'] });
      queryClient.invalidateQueries({ queryKey: ['insurance_customers'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });

      toast({ title: 'تم الاستيراد', description: `${imported} عملية، ${newProductsCount} صنف جديد، ${newCustomersCount} عميل جديد` });
    } catch (e: any) {
      console.error(e);
      toast({ title: 'فشل الاستيراد', description: e.message || 'خطأ غير معروف', variant: 'destructive' });
    } finally {
      setImporting(false);
    }
  };

  const onPickFile = () => fileInputRef.current?.click();

  // --- Render ---
  const RowCard = ({ r }: { r: ParsedRow }) => (
    <div className={cn(
      'rounded-xl border p-4 space-y-3',
      r.status === 'ready' && 'border-success/40 bg-success/5',
      r.status === 'needs_price' && 'border-warning/40 bg-warning/5',
      r.status === 'needs_decision' && 'border-orange-400/40 bg-orange-50 dark:bg-orange-950/20',
    )}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate">{r.product_name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            {r.customer_name}
            {r.card_number && <span className="mr-2 font-mono">[{r.card_number}]</span>}
          </p>
        </div>
        <div className="text-left">
          <p className="font-bold text-primary tabular-nums">{r.price.toFixed(2)} د.ل</p>
          {r.sale_date && <p className="text-[10px] text-muted-foreground">{r.sale_date}</p>}
        </div>
      </div>

      {r.status === 'ready' && (
        <p className="text-xs text-success flex items-center gap-1">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {r.matchedProductId ? 'مطابقة دقيقة' : r.linkedProductId ? 'مرتبط يدوياً' : `سيتم إنشاء صنف جديد بسعر شراء ${r.newProductCost} د.ل`}
        </p>
      )}

      {r.status === 'needs_price' && (
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Label className="text-xs">سعر الشراء (سيتم إنشاء صنف جديد)</Label>
            <Input type="number" step="0.01" min={0} placeholder="0.00"
              onChange={e => updateRow(r.idx, { newProductCost: Number(e.target.value) })}
              defaultValue={r.newProductCost || ''} />
          </div>
          <Button size="sm" onClick={() => setNewProduct(r.idx, r.newProductCost || 0)} disabled={!r.newProductCost || r.newProductCost <= 0}>
            <Plus className="h-4 w-4 ml-1" /> تأكيد
          </Button>
        </div>
      )}

      {r.status === 'needs_decision' && (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">أصناف مشابهة:</p>
          {r.candidates.map(c => (
            <div key={c.product.id} className="flex items-center justify-between gap-2 rounded-lg bg-card p-2 border border-border">
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">{c.product.trade_name}</p>
                <p className="text-[11px] text-muted-foreground">تشابه {Math.round(c.score * 100)}%</p>
              </div>
              <Button size="sm" variant="outline" onClick={() => linkToProduct(r.idx, c.product.id)}>
                <LinkIcon className="h-3.5 w-3.5 ml-1" /> ربط
              </Button>
            </div>
          ))}
          <div className="flex items-end gap-2 pt-1 border-t border-border">
            <div className="flex-1">
              <Label className="text-xs">أو إنشاء صنف جديد - سعر الشراء</Label>
              <Input type="number" step="0.01" min={0} placeholder="0.00"
                onChange={e => updateRow(r.idx, { newProductCost: Number(e.target.value) })}
                defaultValue={r.newProductCost || ''} />
            </div>
            <Button size="sm" variant="secondary" onClick={() => setNewProduct(r.idx, r.newProductCost || 0)} disabled={!r.newProductCost || r.newProductCost <= 0}>
              <Plus className="h-4 w-4 ml-1" /> صنف جديد
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <MainLayout title="استيراد العمليات التاريخية">
      <div className="space-y-6">
        {/* Stage 1: Upload */}
        <div className="rounded-xl bg-card p-6 shadow-card border border-border">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold">رفع الملف</h2>
              <p className="text-xs text-muted-foreground">.xlsx أو .csv — أعمدة: اسم العميل، رقم البطاقة، اسم العلاج، السعر، (تاريخ اختياري)</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={onPickFile} variant="outline">
              <Upload className="h-4 w-4 ml-2" /> اختر ملف
            </Button>
            {fileName && <span className="text-sm text-muted-foreground truncate">{fileName}</span>}
            <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
          </div>
        </div>

        {/* Summary after import */}
        {summary && (
          <div className="rounded-xl border border-success/40 bg-success/5 p-4 flex items-start gap-3">
            <Sparkles className="h-5 w-5 text-success mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-medium">تم الاستيراد بنجاح</p>
              <p className="text-sm text-muted-foreground">
                <span className="text-success font-bold">{summary.imported}</span> عملية،
                <span className="text-primary font-bold mx-1">{summary.newProducts}</span> صنف جديد،
                <span className="text-primary font-bold mx-1">{summary.newCustomers}</span> عميل جديد
              </p>
            </div>
          </div>
        )}

        {/* Stage 3: Review */}
        {rows.length > 0 && (
          <>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-xl border border-success/40 bg-success/5 p-4 text-center">
                <p className="text-2xl font-bold text-success">{ready.length}</p>
                <p className="text-xs text-muted-foreground mt-1">جاهز للاستيراد</p>
              </div>
              <div className="rounded-xl border border-warning/40 bg-warning/5 p-4 text-center">
                <p className="text-2xl font-bold text-warning">{needsPrice.length}</p>
                <p className="text-xs text-muted-foreground mt-1">ينتظر سعر الشراء</p>
              </div>
              <div className="rounded-xl border border-orange-400/40 bg-orange-50 dark:bg-orange-950/20 p-4 text-center">
                <p className="text-2xl font-bold text-orange-600">{needsDecision.length}</p>
                <p className="text-xs text-muted-foreground mt-1">ينتظر قرار يدوي</p>
              </div>
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button onClick={importReady} disabled={importing || ready.length === 0} size="lg">
                {importing ? <Loader2 className="h-4 w-4 ml-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 ml-2" />}
                استيراد الجاهز الآن ({ready.length})
              </Button>
              <Button variant="ghost" onClick={() => { setRows([]); setFileName(''); setSummary(null); }}>
                مسح
              </Button>
            </div>

            <Tabs defaultValue="all" dir="rtl">
              <TabsList>
                <TabsTrigger value="all">الكل ({rows.length})</TabsTrigger>
                <TabsTrigger value="ready" className="gap-1"><CheckCircle2 className="h-3.5 w-3.5" /> جاهز ({ready.length})</TabsTrigger>
                <TabsTrigger value="price" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" /> سعر ({needsPrice.length})</TabsTrigger>
                <TabsTrigger value="decision" className="gap-1"><LinkIcon className="h-3.5 w-3.5" /> ربط ({needsDecision.length})</TabsTrigger>
              </TabsList>
              <TabsContent value="all"><RowList rows={rows} /></TabsContent>
              <TabsContent value="ready"><RowList rows={ready} /></TabsContent>
              <TabsContent value="price"><RowList rows={needsPrice} /></TabsContent>
              <TabsContent value="decision"><RowList rows={needsDecision} /></TabsContent>
            </Tabs>
          </>
        )}

        {rows.length === 0 && !summary && (
          <div className="rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground">
            <FileSpreadsheet className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>اختر ملفاً للبدء</p>
          </div>
        )}
      </div>
    </MainLayout>
  );

  function RowList({ rows }: { rows: ParsedRow[] }) {
    if (rows.length === 0) return <p className="text-center py-8 text-muted-foreground text-sm">لا يوجد صفوف</p>;
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
        {rows.map(r => <RowCard key={r.idx} r={r} />)}
      </div>
    );
  }
}
