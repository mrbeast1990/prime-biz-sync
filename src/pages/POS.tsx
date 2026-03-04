import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import {
  Barcode, Search, Plus, Minus, Trash2, CreditCard, Banknote, User, ShoppingCart, X,
  RotateCcw, AlertTriangle, UserPlus, Loader2, ChevronDown, Zap, FileText, FileDown,
  Eye, Edit, Save, ChevronRight, ChevronLeft, Star, ChevronUp,
} from 'lucide-react';
import { Product, CartItem, SaleMode } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useProducts, useContacts, useCreateInvoice, useUpdateProductStock, useInvoices, useInvoiceItems, useUpdateInvoiceItem, useProfiles } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV, exportToPrintPDF } from '@/utils/exportUtils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const saleModes: { mode: SaleMode; label: string; icon: React.ElementType; variant: 'default' | 'secondary' | 'outline' | 'destructive' }[] = [
  { mode: 'cash', label: 'نقداً', icon: Banknote, variant: 'default' },
  { mode: 'card', label: 'بطاقة', icon: CreditCard, variant: 'secondary' },
  { mode: 'credit', label: 'مبيعات آجل', icon: UserPlus, variant: 'outline' },
  { mode: 'return', label: 'استرجاع', icon: RotateCcw, variant: 'outline' },
  { mode: 'damage', label: 'إتلاف', icon: AlertTriangle, variant: 'destructive' },
];

async function generateInvoiceNumber() {
  const { count } = await supabase
    .from('invoices')
    .select('*', { count: 'exact', head: true });
  const seq = String((count || 0) + 1).padStart(4, '0');
  return `T-${seq}`;
}

async function deductFromBatches(productId: string, quantity: number) {
  const { data: batches } = await supabase
    .from('product_batches')
    .select('*')
    .eq('product_id', productId)
    .gt('quantity', 0)
    .order('expiry_date', { ascending: true, nullsFirst: false });
  if (!batches) return;
  let remaining = quantity;
  for (const batch of batches) {
    if (remaining <= 0) break;
    const deduct = Math.min(remaining, batch.quantity);
    await supabase.from('product_batches').update({ quantity: batch.quantity - deduct }).eq('id', batch.id);
    remaining -= deduct;
  }
}

async function addToBatches(productId: string, quantity: number) {
  const { data: batches } = await supabase
    .from('product_batches')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })
    .limit(1);
  if (batches && batches.length > 0) {
    await supabase.from('product_batches').update({ quantity: batches[0].quantity + quantity }).eq('id', batches[0].id);
  }
}

const SHORTCUTS_KEY = 'pos_product_shortcuts';

function getShortcuts(): string[] {
  try { return JSON.parse(localStorage.getItem(SHORTCUTS_KEY) || '[]'); } catch { return []; }
}

const paymentLabels: Record<string, string> = {
  cash: 'نقدي', card: 'بطاقة', credit: 'آجل', damage: 'إتلاف',
};
const typeLabels: Record<string, string> = {
  sale: 'بيع', return: 'استرجاع', damage: 'إتلاف',
};

export default function POS() {
  const { data: products = [], isLoading } = useProducts();
  const { data: contacts = [] } = useContacts('customer');
  const createInvoice = useCreateInvoice();
  const updateStock = useUpdateProductStock();

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const draft = sessionStorage.getItem('pos_draft');
      if (draft) { sessionStorage.removeItem('pos_draft'); return JSON.parse(draft); }
    } catch { /* ignore */ }
    return [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [saleMode, setSaleMode] = useState<SaleMode>('cash');
  const [customerName, setCustomerName] = useState('');
  const [shortcuts, setShortcuts] = useState<string[]>(getShortcuts);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Save draft to sessionStorage on unmount if cart has items
  useEffect(() => {
    return () => {
      if (cart.length > 0) {
        sessionStorage.setItem('pos_draft', JSON.stringify(cart));
      }
    };
  }, [cart]);

  // Only show products when searching
  const showProducts = searchQuery.length > 0;
  const filteredProducts = showProducts ? products.filter(
    (product) =>
      product.trade_name.includes(searchQuery) ||
      (product.scientific_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode || '').includes(searchQuery)
  ) : [];

  const shortcutProducts = products.filter(p => shortcuts.includes(p.id));

  useEffect(() => { barcodeRef.current?.focus(); }, []);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) {
        toast({ title: 'خطأ', description: 'الكمية المطلوبة غير متوفرة في المخزون', variant: 'destructive' });
        return;
      }
      setCart(cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.product.sale_price }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, total: product.sale_price }]);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.barcode === barcodeInput);
    if (product) { addToCart(product); setBarcodeInput(''); }
    else { toast({ title: 'غير موجود', description: 'لم يتم العثور على صنف بهذا الكود', variant: 'destructive' }); }
    barcodeRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return null;
          if (newQuantity > item.product.stock_quantity) {
            toast({ title: 'خطأ', description: 'الكمية المطلوبة غير متوفرة في المخزون', variant: 'destructive' });
            return item;
          }
          return { ...item, quantity: newQuantity, total: newQuantity * item.product.sale_price };
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => setCart(cart.filter((item) => item.product.id !== productId));
  const clearCart = () => setCart([]);
  const total = cart.reduce((sum, item) => sum + item.total, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast({ title: 'السلة فارغة', description: 'أضف أصناف إلى السلة أولاً', variant: 'destructive' });
      return;
    }
    if (saleMode === 'credit' && !customerName.trim()) {
      toast({ title: 'مطلوب', description: 'يرجى إدخال اسم الزبون للمبيعات الآجلة', variant: 'destructive' });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      const invoiceType = saleMode === 'return' ? 'return' : saleMode === 'damage' ? 'damage' : 'sale';
      const stockDelta = saleMode === 'return' ? 1 : -1;
      const invoiceNumber = await generateInvoiceNumber();

      await createInvoice.mutateAsync({
        invoice_type: invoiceType,
        contact_name: saleMode === 'credit' ? customerName : undefined,
        invoice_number: invoiceNumber,
        created_by: user?.id,
        total,
        paid: saleMode === 'credit' ? 0 : total,
        status: saleMode === 'credit' ? 'pending' : 'completed',
        payment_method: saleMode === 'damage' ? 'damage' : saleMode,
        items: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.trade_name,
          quantity: item.quantity,
          unit_price: item.product.sale_price,
          total: item.total,
        })),
      });

      for (const item of cart) {
        await updateStock.mutateAsync({ id: item.product.id, delta: stockDelta * item.quantity });
        if (saleMode === 'return') {
          await addToBatches(item.product.id, item.quantity);
        } else {
          await deductFromBatches(item.product.id, item.quantity);
        }
      }

      const modeLabels: Record<SaleMode, string> = {
        cash: 'بيع نقدي', card: 'بيع ببطاقة', credit: `بيع آجل - ${customerName}`, return: 'استرجاع', damage: 'إتلاف',
      };
      toast({
        title: saleMode === 'return' ? 'تم الاسترجاع' : saleMode === 'damage' ? 'تم تسجيل الإتلاف' : 'تم البيع بنجاح',
        description: `${modeLabels[saleMode]} - فاتورة ${invoiceNumber} بقيمة ${total.toFixed(2)} د.ل`,
      });
      clearCart();
      setCustomerName('');
    } catch {
      toast({ title: 'خطأ', description: 'فشل تسجيل العملية', variant: 'destructive' });
    }
  };

  if (isLoading) {
    return <MainLayout title="البيع السريع"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="البيع السريع">
      <Tabs defaultValue="pos" dir="rtl">
        <TabsList className="mb-4">
          <TabsTrigger value="pos" className="gap-2"><Zap className="h-4 w-4" /> البيع السريع</TabsTrigger>
          <TabsTrigger value="invoices" className="gap-2"><FileText className="h-4 w-4" /> فواتير صادرة</TabsTrigger>
        </TabsList>

        <TabsContent value="pos">
          <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-4 lg:grid-cols-12">
            {/* LEFT: Search & Products */}
            <div className="lg:col-span-4 flex flex-col">
              <form onSubmit={handleBarcodeSubmit} className="mb-3">
                <div className="relative">
                  <Barcode className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input ref={barcodeRef} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} placeholder="امسح الباركود..." className="pr-10 h-11 font-mono input-focus" />
                </div>
              </form>
              <div className="relative mb-3">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث عن صنف..." className="pr-9 input-focus" />
              </div>

              {/* Shortcut products */}
              {shortcutProducts.length > 0 && !showProducts && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Star className="h-3 w-3" /> اختصارات</p>
                  <div className="grid grid-cols-2 gap-2">
                    {shortcutProducts.map((product) => (
                      <button key={product.id} onClick={() => addToCart(product)} disabled={product.stock_quantity === 0}
                        className={cn('rounded-lg bg-accent p-3 text-right transition-all hover:bg-accent/80 active:scale-[0.98] border border-primary/20', product.stock_quantity === 0 && 'opacity-50 cursor-not-allowed')}>
                        <p className="font-medium text-card-foreground text-sm leading-tight truncate">{product.trade_name}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm font-bold text-primary tabular-nums">{product.sale_price.toFixed(2)}</span>
                          <span className={cn('text-xs rounded-full px-1.5 py-0.5', product.stock_quantity <= product.min_stock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>{product.stock_quantity}</span>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Product search results */}
              <div className="flex-1 overflow-y-auto custom-scrollbar">
                {showProducts ? (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredProducts.map((product) => (
                      <button key={product.id} onClick={() => addToCart(product)} disabled={product.stock_quantity === 0}
                        className={cn('rounded-lg bg-card p-3 text-right shadow-card transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]', product.stock_quantity === 0 && 'opacity-50 cursor-not-allowed')}>
                        <p className="font-medium text-card-foreground text-sm leading-tight truncate">{product.trade_name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground leading-tight truncate">{product.scientific_name}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-sm font-bold text-primary tabular-nums">{product.sale_price.toFixed(2)}</span>
                          <span className={cn('text-xs rounded-full px-1.5 py-0.5', product.stock_quantity <= product.min_stock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>{product.stock_quantity}</span>
                        </div>
                      </button>
                    ))}
                    {filteredProducts.length === 0 && (
                      <div className="col-span-2 text-center py-8 text-muted-foreground text-sm">لا توجد نتائج</div>
                    )}
                  </div>
                ) : !shortcutProducts.length && (
                  <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                    <Search className="h-10 w-10 mb-2 opacity-30" />
                    <p className="text-sm">ابحث عن صنف بالاسم أو الباركود</p>
                  </div>
                )}
              </div>
            </div>

            {/* CENTER: Cart */}
            <div className="lg:col-span-8 flex flex-col rounded-xl bg-card shadow-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><ShoppingCart className="h-5 w-5 text-primary" /></div>
                  <div><h2 className="font-semibold text-card-foreground">إصدار فاتورة</h2><p className="text-sm text-muted-foreground">{itemCount} صنف</p></div>
                </div>
                {cart.length > 0 && <Button variant="ghost" size="icon" onClick={clearCart}><X className="h-4 w-4" /></Button>}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {cart.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">لا توجد أصناف</p>
                    <p className="text-sm text-muted-foreground">امسح الكود أو اختر صنفاً</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {cart.map((item) => (
                      <div key={item.product.id} className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-card-foreground truncate">{item.product.trade_name}</p>
                            <p className="text-sm text-muted-foreground">{item.product.sale_price.toFixed(2)} د.ل</p>
                          </div>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive flex-shrink-0" onClick={() => removeFromCart(item.product.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                            <span className="w-8 text-center font-medium tabular-nums">{item.quantity}</span>
                            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                          </div>
                          <p className="font-bold text-card-foreground tabular-nums">{item.total.toFixed(2)} د.ل</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-border p-4 space-y-3">
                {saleMode === 'credit' && (
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="اسم الزبون..." className="pr-9 input-focus" list="customers-list" />
                    <datalist id="customers-list">{contacts.map(c => <option key={c.id} value={c.name} />)}</datalist>
                  </div>
                )}
                <div className="flex gap-3">
                  <div className={cn('rounded-lg border border-border flex items-center gap-1 px-3 py-2', saleMode === 'damage' && 'border-destructive bg-destructive/10')}>
                    <div className="flex flex-col items-center justify-center">
                      {(() => { const current = saleModes.find(m => m.mode === saleMode); const Icon = current!.icon; return (
                        <div className="flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <span className="text-sm font-semibold text-card-foreground">{current!.label}</span>
                        </div>
                      ); })()}
                    </div>
                    <div className="flex flex-col gap-0.5 mr-1">
                      <button onClick={() => { const idx = saleModes.findIndex(m => m.mode === saleMode); setSaleMode(saleModes[(idx - 1 + saleModes.length) % saleModes.length].mode); }} className="rounded p-0.5 hover:bg-muted transition-colors"><ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /></button>
                      <button onClick={() => { const idx = saleModes.findIndex(m => m.mode === saleMode); setSaleMode(saleModes[(idx + 1) % saleModes.length].mode); }} className="rounded p-0.5 hover:bg-muted transition-colors"><ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /></button>
                    </div>
                  </div>
                  <div className="flex-1 rounded-lg bg-primary/10 p-3 flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">الإجمالي</span>
                    <span className="text-4xl font-bold text-primary tabular-nums">{total.toFixed(2)} د.ل</span>
                  </div>
                </div>
                <Button size="lg" className={cn('w-full gap-2', saleMode === 'damage' && 'bg-destructive hover:bg-destructive/90')} onClick={handleCheckout} disabled={createInvoice.isPending}>
                  {createInvoice.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      {saleMode === 'cash' && <><Banknote className="h-5 w-5" />تأكيد البيع نقداً</>}
                      {saleMode === 'card' && <><CreditCard className="h-5 w-5" />تأكيد البيع بالبطاقة</>}
                      {saleMode === 'credit' && <><UserPlus className="h-5 w-5" />تسجيل بيع آجل</>}
                      {saleMode === 'return' && <><RotateCcw className="h-5 w-5" />تأكيد الاسترجاع</>}
                      {saleMode === 'damage' && <><AlertTriangle className="h-5 w-5" />تسجيل الإتلاف</>}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="invoices">
          <IssuedInvoicesTab />
        </TabsContent>
      </Tabs>
    </MainLayout>
  );
}

// ===== Issued Invoices Tab =====

function IssuedInvoicesTab() {
  const { data: allInvoices = [], isLoading } = useInvoices();
  const { data: profiles = [] } = useProfiles();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const salesInvoices = allInvoices.filter(i => ['sale', 'return', 'damage'].includes(i.invoice_type));
  const dateFiltered = salesInvoices.filter(inv => inv.invoice_date === selectedDate);
  const filtered = dateFiltered.filter(inv =>
    (inv.invoice_number || '').includes(searchQuery) ||
    (inv.contact_name || '').includes(searchQuery) ||
    (inv.payment_method || '').includes(searchQuery)
  );

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  const getSellerName = (userId: string | null) => {
    if (!userId) return '—';
    const profile = profiles.find((p: any) => p.user_id === userId);
    return profile?.display_name || '—';
  };

  const handleExportCSV = () => {
    exportToCSV(filtered.map(inv => ({
      'رقم الفاتورة': inv.invoice_number || '—',
      'التاريخ': new Date(inv.invoice_date).toLocaleDateString('en-GB'),
      'نوع العملية': typeLabels[inv.invoice_type] || inv.invoice_type,
      'طريقة الدفع': paymentLabels[inv.payment_method || ''] || inv.payment_method,
      'الإجمالي': Number(inv.total).toFixed(2),
      'البائع': getSellerName(inv.created_by),
    })), 'فواتير_صادرة');
    toast({ title: 'تم التصدير' });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateDate(-1)}><ChevronRight className="h-4 w-4" /></Button>
          <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-[160px] text-center" />
          <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateDate(1)} disabled={isToday}><ChevronLeft className="h-4 w-4" /></Button>
          {!isToday && <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}>اليوم</Button>}
        </div>
        <div className="relative max-w-sm flex-1">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث برقم الفاتورة أو الاسم..." className="pr-9" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportCSV}><FileDown className="h-4 w-4 ml-1" /> Excel</Button>
          <Button variant="outline" size="sm" onClick={() => exportToPrintPDF('فواتير صادرة', 'sales-table')}><FileText className="h-4 w-4 ml-1" /> PDF</Button>
        </div>
      </div>

      <div className="rounded-xl bg-card shadow-card overflow-hidden">
        <Table id="sales-table">
          <TableHeader>
            <TableRow>
              <TableHead className="text-right">رقم الفاتورة</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">نوع العملية</TableHead>
              <TableHead className="text-right">طريقة الدفع</TableHead>
              <TableHead className="text-right">الزبون</TableHead>
              <TableHead className="text-right">الإجمالي</TableHead>
              <TableHead className="text-right">البائع</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(inv => (
              <TableRow key={inv.id}>
                <TableCell className="font-mono text-sm">{inv.invoice_number || '—'}</TableCell>
                <TableCell>{new Date(inv.invoice_date).toLocaleDateString('en-GB')}</TableCell>
                <TableCell>
                  <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                    inv.invoice_type === 'sale' ? 'bg-success/10 text-success' :
                    inv.invoice_type === 'return' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
                  )}>
                    {typeLabels[inv.invoice_type] || inv.invoice_type}
                  </span>
                </TableCell>
                <TableCell>{paymentLabels[inv.payment_method || ''] || inv.payment_method}</TableCell>
                <TableCell>{inv.contact_name || '—'}</TableCell>
                <TableCell className="tabular-nums font-medium">{Number(inv.total).toFixed(2)} د.ل</TableCell>
                <TableCell>{getSellerName(inv.created_by)}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewInvoiceId(inv.id)}><Eye className="h-3.5 w-3.5" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditInvoiceId(inv.id)}><Edit className="h-3.5 w-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد فواتير صادرة</TableCell></TableRow>}
          </TableBody>
        </Table>
      </div>

      <InvoiceViewDialog invoiceId={viewInvoiceId} onClose={() => setViewInvoiceId(null)} />
      <InvoiceEditDialog invoiceId={editInvoiceId} onClose={() => setEditInvoiceId(null)} />
    </div>
  );
}

function InvoiceViewDialog({ invoiceId, onClose }: { invoiceId: string | null; onClose: () => void }) {
  const { data: items = [] } = useInvoiceItems(invoiceId || undefined);
  return (
    <Dialog open={!!invoiceId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>تفاصيل الفاتورة</DialogTitle></DialogHeader>
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-right">الصنف</TableHead>
            <TableHead className="text-right">الكمية</TableHead>
            <TableHead className="text-right">السعر</TableHead>
            <TableHead className="text-right">الإجمالي</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>{item.product_name}</TableCell>
                <TableCell className="tabular-nums">{item.quantity}</TableCell>
                <TableCell className="tabular-nums">{Number(item.unit_price).toFixed(2)}</TableCell>
                <TableCell className="tabular-nums font-medium">{Number(item.total).toFixed(2)} د.ل</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">لا توجد أصناف</TableCell></TableRow>}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceEditDialog({ invoiceId, onClose }: { invoiceId: string | null; onClose: () => void }) {
  const { data: items = [] } = useInvoiceItems(invoiceId || undefined);
  const updateItem = useUpdateInvoiceItem();
  const [editedItems, setEditedItems] = useState<Record<string, { quantity: number; unit_price: number }>>({});

  const getItemValue = (item: any, field: 'quantity' | 'unit_price') => editedItems[item.id]?.[field] ?? item[field];

  const handleChange = (itemId: string, field: 'quantity' | 'unit_price', value: number) => {
    setEditedItems(prev => ({ ...prev, [itemId]: { quantity: prev[itemId]?.quantity ?? 0, unit_price: prev[itemId]?.unit_price ?? 0, [field]: value } }));
  };

  const handleSave = async () => {
    try {
      for (const [id, data] of Object.entries(editedItems)) {
        await updateItem.mutateAsync({ id, quantity: data.quantity, unit_price: data.unit_price, total: data.quantity * data.unit_price });
      }
      toast({ title: 'تم الحفظ', description: 'تم تعديل الفاتورة بنجاح' });
      setEditedItems({});
      onClose();
    } catch {
      toast({ title: 'خطأ', description: 'فشل تعديل الفاتورة', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={!!invoiceId} onOpenChange={() => { setEditedItems({}); onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>تعديل الفاتورة</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium text-sm mb-2">{item.product_name}</p>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">الكمية</Label><Input type="number" value={getItemValue(item, 'quantity')} onChange={e => handleChange(item.id, 'quantity', Math.max(1, +e.target.value))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">السعر</Label><Input type="number" value={getItemValue(item, 'unit_price')} onChange={e => handleChange(item.id, 'unit_price', Math.max(0, +e.target.value))} className="h-8 text-sm" /></div>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setEditedItems({}); onClose(); }}>إلغاء</Button>
          <Button onClick={handleSave} disabled={updateItem.isPending}><Save className="h-4 w-4 ml-1" /> حفظ التعديلات</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
