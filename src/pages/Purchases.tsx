import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Plus, Minus, Trash2, Barcode, PackagePlus, UserPlus, Truck, Save, Loader2, Calendar, Eye, Edit, FileDown, FileText, ChevronDown } from 'lucide-react';
import { Contact, Product, InvoiceItem } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { SupplierModal } from '@/components/purchases/SupplierModal';
import { useProducts, useContacts, useCreateInvoice, useUpdateProductStock, useInvoices, useInvoiceItems, useUpdateInvoice, useUpdateInvoiceItem } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { exportToCSV, exportToPrintPDF } from '@/utils/exportUtils';

interface PurchaseItem extends InvoiceItem {
  has_expiry?: boolean;
  expiry_date?: string;
  sale_price?: number;
}

export default function Purchases() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: allContacts = [] } = useContacts('supplier');
  const { data: purchaseInvoices = [] } = useInvoices('purchase');
  const createInvoice = useCreateInvoice();
  const updateStock = useUpdateProductStock();
  const updateInvoice = useUpdateInvoice();
  const updateInvoiceItem = useUpdateInvoiceItem();

  const [selectedSupplier, setSelectedSupplier] = useState<Contact | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');

  // History states
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);

  // Restore draft from sessionStorage when returning from product creation
  useEffect(() => {
    if (searchParams.get('restore') === 'true') {
      try {
        const draft = JSON.parse(sessionStorage.getItem('purchase_draft') || '{}');
        if (draft.supplier) setSelectedSupplier(draft.supplier);
        if (draft.items) setItems(draft.items);
        if (draft.invoiceNumber) setInvoiceNumber(draft.invoiceNumber);
        sessionStorage.removeItem('purchase_draft');
      } catch { /* ignore */ }
    }
  }, []);

  // Save draft on unmount if items exist
  useEffect(() => {
    return () => {
      if (items.length > 0) {
        sessionStorage.setItem('purchase_draft', JSON.stringify({
          supplier: selectedSupplier,
          items,
          invoiceNumber,
        }));
      }
    };
  }, [items, selectedSupplier, invoiceNumber]);

  const filteredProducts = products.filter(
    (p) =>
      p.trade_name.includes(searchQuery) ||
      (p.scientific_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode || '').includes(searchQuery)
  );

  const addProduct = (product: Product) => {
    const existing = items.find((i) => i.product_id === product.id);
    if (existing) {
      setItems(items.map((i) =>
        i.product_id === product.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unit_price }
          : i
      ));
    } else {
      setItems([...items, {
        id: Date.now().toString(),
        product_id: product.id,
        product_name: product.trade_name,
        quantity: 1,
        unit_price: product.cost_price,
        total: product.cost_price,
        has_expiry: product.has_expiry || false,
        expiry_date: '',
        sale_price: product.sale_price || 0,
      }]);
    }
  };

  const [showNotFoundDialog, setShowNotFoundDialog] = useState(false);
  const [notFoundBarcode, setNotFoundBarcode] = useState('');

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.barcode === barcodeInput);
    if (product) { addProduct(product); setBarcodeInput(''); }
    else {
      setNotFoundBarcode(barcodeInput);
      setShowNotFoundDialog(true);
    }
  };

  const handleGoToAddProduct = () => {
    // Save current invoice state to sessionStorage
    sessionStorage.setItem('purchase_draft', JSON.stringify({
      supplier: selectedSupplier,
      items,
      invoiceNumber,
    }));
    setShowNotFoundDialog(false);
    navigate(`/products?newProduct=true&returnTo=purchases&barcode=${encodeURIComponent(notFoundBarcode)}`);
  };

  const updateItem = (itemId: string, field: 'quantity' | 'unit_price' | 'sale_price', value: number) => {
    setItems(items.map((i) => {
      if (i.id === itemId) {
        const updated = { ...i, [field]: value };
        updated.total = updated.quantity * updated.unit_price;
        return updated;
      }
      return i;
    }));
  };

  const removeItem = (itemId: string) => setItems(items.filter((i) => i.id !== itemId));
  const total = items.reduce((sum, i) => sum + i.total, 0);

  const handleSave = async () => {
    if (!selectedSupplier) { toast({ title: 'خطأ', description: 'اختر المورد أولاً', variant: 'destructive' }); return; }
    if (!invoiceNumber.trim()) { toast({ title: 'خطأ', description: 'أدخل رقم فاتورة المورد', variant: 'destructive' }); return; }
    if (items.length === 0) { toast({ title: 'خطأ', description: 'أضف أصنافاً أولاً', variant: 'destructive' }); return; }
    const missingExpiry = items.find(i => i.has_expiry && !i.expiry_date);
    if (missingExpiry) { toast({ title: 'خطأ', description: `أدخل تاريخ الصلاحية لـ ${missingExpiry.product_name}`, variant: 'destructive' }); return; }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      // Generate system sequential number
      const { count } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true });
      const sysNumber = `T-${String((count || 0) + 1).padStart(4, '0')}`;

      const inv = await createInvoice.mutateAsync({
        invoice_type: 'purchase',
        contact_id: selectedSupplier.id,
        contact_name: selectedSupplier.name,
        invoice_number: `${sysNumber} | ${invoiceNumber.trim()}`,
        created_by: user?.id,
        total,
        paid: 0,
        status: 'pending',
        payment_method: 'cash',
        items: items.map(item => ({
          product_id: item.product_id,
          product_name: item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
          total: item.total,
        })),
      });

      // Save batches, update stock, and update product prices
      for (const item of items) {
        await updateStock.mutateAsync({ id: item.product_id, delta: item.quantity });
        // Create batch record for FEFO tracking
        await supabase.from('product_batches').insert({
          product_id: item.product_id,
          invoice_id: inv.id,
          quantity: item.quantity,
          original_quantity: item.quantity,
          expiry_date: item.has_expiry && item.expiry_date ? item.expiry_date : null,
        });
        // Update product cost_price and sale_price
        await supabase.from('products').update({
          cost_price: item.unit_price,
          sale_price: item.sale_price || 0,
        }).eq('id', item.product_id);
      }

      // Register purchase in treasury
      await supabase.from('treasury').insert({
        entry_type: 'expense',
        description: `فاتورة مشتريات ${invoiceNumber} - ${selectedSupplier.name}`,
        amount: total,
        category: 'purchases',
        reference_id: inv.id,
      });

      // Update supplier balance
      await supabase.from('contacts').update({
        balance: (selectedSupplier.balance || 0) + total,
      }).eq('id', selectedSupplier.id);

      // Invalidate caches
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['treasury'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });

      toast({ title: 'تم حفظ فاتورة المشتريات', description: `فاتورة رقم ${invoiceNumber} - إجمالي ${total.toFixed(2)} د.ل من ${selectedSupplier.name}` });
      setItems([]);
      setSelectedSupplier(null);
      setInvoiceNumber('');
    } catch {
      toast({ title: 'خطأ', description: 'فشل حفظ الفاتورة', variant: 'destructive' });
    }
  };

  const handleSupplierSave = (supplier: Contact) => {
    setSelectedSupplier(supplier);
    setShowSupplierModal(false);
  };

  const handleExportCSV = () => {
    exportToCSV(purchaseInvoices.map(inv => ({
      'رقم الفاتورة': inv.invoice_number || '—',
      'المورد': inv.contact_name || '—',
      'التاريخ': new Date(inv.invoice_date).toLocaleDateString('en-GB'),
      'الإجمالي': Number(inv.total).toFixed(2),
      'الحالة': inv.status === 'completed' ? 'مكتملة' : 'معلقة',
    })), 'سجل_المشتريات');
    toast({ title: 'تم التصدير', description: 'تم تصدير الملف بنجاح' });
  };

  if (loadingProducts) {
    return <MainLayout title="المشتريات"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="المشتريات">
      <Tabs defaultValue="new" dir="rtl">
        <TabsList className="mb-4">
          <TabsTrigger value="new" className="gap-2"><Plus className="h-4 w-4" /> فاتورة جديدة</TabsTrigger>
          <TabsTrigger value="history" className="gap-2"><FileText className="h-4 w-4" /> سجل المشتريات</TabsTrigger>
        </TabsList>

        <TabsContent value="new">
          <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-6 lg:grid-cols-3">
            {/* LEFT: Invoice (large) */}
            <div className="lg:col-span-2 flex flex-col rounded-xl bg-card shadow-card">
              <div className="flex items-center gap-3 border-b border-border p-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Truck className="h-5 w-5 text-primary" /></div>
                <div><h2 className="font-semibold text-card-foreground">فاتورة المشتريات</h2><p className="text-sm text-muted-foreground">{items.length} صنف</p></div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {items.length === 0 ? (
                  <div className="flex h-full flex-col items-center justify-center text-center">
                    <PackagePlus className="h-12 w-12 text-muted-foreground/50" />
                    <p className="mt-4 text-muted-foreground">لا توجد أصناف</p><p className="text-sm text-muted-foreground">ابحث عن صنف وأضفه</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="rounded-lg bg-muted/50 p-3">
                        <div className="flex items-start justify-between">
                          <p className="font-medium text-card-foreground text-sm">{item.product_name}</p>
                          <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div>
                            <Label className="text-xs">الكمية</Label>
                            <div className="flex items-center gap-1">
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}><Minus className="h-3 w-3" /></Button>
                              <Input type="number" value={item.quantity} onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, +e.target.value))} className="h-6 w-12 text-center text-xs p-0" />
                              <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}><Plus className="h-3 w-3" /></Button>
                            </div>
                          </div>
                          <div>
                            <Label className="text-xs">سعر الشراء</Label>
                            <Input type="number" value={item.unit_price} onChange={(e) => updateItem(item.id, 'unit_price', Math.max(0, +e.target.value))} className="h-6 text-xs" />
                          </div>
                          <div>
                            <Label className="text-xs">سعر البيع</Label>
                            <Input type="number" value={item.sale_price || 0} onChange={(e) => updateItem(item.id, 'sale_price', Math.max(0, +e.target.value))} className="h-6 text-xs" />
                          </div>
                        </div>
                        {item.has_expiry && (
                          <div className="mt-2">
                            <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" />تاريخ الصلاحية <span className="text-destructive">*</span></Label>
                            <Input type="date" value={item.expiry_date || ''} onChange={(e) => {
                              setItems(items.map(i => i.id === item.id ? { ...i, expiry_date: e.target.value } : i));
                            }} className={cn("h-6 text-xs mt-1", !item.expiry_date && "border-destructive")} />
                          </div>
                        )}
                        <p className="mt-1 text-left text-sm font-bold text-card-foreground tabular-nums">{item.total.toFixed(2)} د.ل</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="border-t border-border p-4">
                <div className="mb-4 rounded-lg bg-primary/10 p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">الإجمالي</span>
                    <span className="text-3xl font-bold text-primary tabular-nums">{total.toFixed(2)} د.ل</span>
                  </div>
                </div>
                <Button size="lg" className="w-full gap-2" onClick={handleSave} disabled={createInvoice.isPending}>
                  {createInvoice.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Save className="h-5 w-5" />حفظ فاتورة المشتريات</>}
                </Button>
              </div>
            </div>

            {/* RIGHT: Supplier + Search (1/3) */}
            <div className="lg:col-span-1 flex flex-col space-y-4">
              <div className="rounded-xl bg-card p-4 shadow-card">
                <div className="flex items-center gap-3 mb-3"><Truck className="h-5 w-5 text-primary" /><Label className="text-base font-semibold">المورد</Label></div>
                <div className="flex items-center gap-3">
                  <Select value={selectedSupplier?.id || ''} onValueChange={(v) => setSelectedSupplier(allContacts.find((s) => s.id === v) || null)}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="اختر المورد..." /></SelectTrigger>
                    <SelectContent>{allContacts.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                  </Select>
                  <Button variant="outline" size="icon" onClick={() => setShowSupplierModal(true)}><UserPlus className="h-4 w-4" /></Button>
                </div>
                <div className="mt-3">
                  <Label className="text-sm font-medium">رقم فاتورة المورد <span className="text-destructive">*</span></Label>
                  <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} placeholder="أدخل رقم الفاتورة..." className="mt-1" />
                </div>
              </div>

              <div className="rounded-xl bg-card p-4 shadow-card flex-1 flex flex-col">
                <div className="flex items-center gap-3 mb-3"><PackagePlus className="h-5 w-5 text-primary" /><Label className="text-base font-semibold">إضافة أصناف</Label></div>
                <form onSubmit={handleBarcodeSubmit} className="mb-3">
                  <div className="relative"><Barcode className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} placeholder="امسح الباركود..." className="pr-9" /></div>
                </form>
                <div className="relative mb-3"><Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بالاسم..." className="pr-9" /></div>
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {filteredProducts.map((product) => (
                      <button key={product.id} onClick={() => addProduct(product)} className="rounded-lg bg-muted/50 p-3 text-right transition-all hover:bg-muted active:scale-[0.98]">
                        <p className="text-sm font-medium text-card-foreground leading-tight">{product.trade_name}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{product.cost_price.toFixed(2)} د.ل</p>
                      </button>
                    ))}
                  </div>
                  {filteredProducts.length === 0 && searchQuery && (
                    <div className="text-center py-8">
                      <p className="text-sm text-muted-foreground mb-3">الصنف غير موجود</p>
                      <Button variant="outline" className="gap-2" onClick={() => {
                        sessionStorage.setItem('purchase_draft', JSON.stringify({ supplier: selectedSupplier, items, invoiceNumber }));
                        navigate(`/products?newProduct=true&returnTo=purchases`);
                      }}><Plus className="h-4 w-4" />إضافة صنف جديد</Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-semibold">سجل فواتير المشتريات</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleExportCSV}><FileDown className="h-4 w-4 ml-1" /> Excel</Button>
                <Button variant="outline" size="sm" onClick={() => exportToPrintPDF('سجل المشتريات', 'purchases-table')}><FileText className="h-4 w-4 ml-1" /> PDF</Button>
              </div>
            </div>
            <div className="rounded-xl bg-card shadow-card overflow-hidden">
              <Table id="purchases-table">
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">رقم الفاتورة</TableHead>
                    <TableHead className="text-right">المورد</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الإجمالي</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseInvoices.map(inv => (
                    <TableRow key={inv.id}>
                      <TableCell className="font-mono text-sm">{inv.invoice_number || '—'}</TableCell>
                      <TableCell>{inv.contact_name || '—'}</TableCell>
                      <TableCell>{new Date(inv.invoice_date).toLocaleDateString('en-GB')}</TableCell>
                      <TableCell className="tabular-nums font-medium">{Number(inv.total).toFixed(2)} د.ل</TableCell>
                      <TableCell>
                        <span className={cn('inline-block rounded-full px-3 py-1 text-xs font-medium', inv.status === 'completed' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
                          {inv.status === 'completed' ? 'مكتملة' : 'معلقة'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewInvoiceId(inv.id)}><Eye className="h-3.5 w-3.5" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditInvoiceId(inv.id)}><Edit className="h-3.5 w-3.5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {purchaseInvoices.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا توجد فواتير مشتريات</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <SupplierModal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} onSave={handleSupplierSave} />
      <InvoiceViewDialog invoiceId={viewInvoiceId} onClose={() => setViewInvoiceId(null)} />
      <InvoiceEditDialog invoiceId={editInvoiceId} onClose={() => setEditInvoiceId(null)} />

      {/* Not Found Barcode Dialog */}
      <Dialog open={showNotFoundDialog} onOpenChange={setShowNotFoundDialog}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>صنف غير موجود</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">الكود <span className="font-mono font-bold">{notFoundBarcode}</span> غير موجود في قاعدة البيانات. هل تريد إضافة صنف جديد؟</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowNotFoundDialog(false); setBarcodeInput(''); }}>إلغاء</Button>
            <Button onClick={handleGoToAddProduct}>نعم، أضف صنف جديد</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
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

  const getItemValue = (item: any, field: 'quantity' | 'unit_price') => {
    return editedItems[item.id]?.[field] ?? item[field];
  };

  const handleChange = (itemId: string, field: 'quantity' | 'unit_price', value: number) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: { quantity: prev[itemId]?.quantity ?? 0, unit_price: prev[itemId]?.unit_price ?? 0, [field]: value },
    }));
  };

  const handleSave = async () => {
    try {
      for (const [id, data] of Object.entries(editedItems)) {
        const total = data.quantity * data.unit_price;
        await updateItem.mutateAsync({ id, quantity: data.quantity, unit_price: data.unit_price, total });
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
                <div>
                  <Label className="text-xs">الكمية</Label>
                  <Input type="number" value={getItemValue(item, 'quantity')} onChange={e => handleChange(item.id, 'quantity', Math.max(1, +e.target.value))} className="h-8 text-sm" />
                </div>
                <div>
                  <Label className="text-xs">السعر</Label>
                  <Input type="number" value={getItemValue(item, 'unit_price')} onChange={e => handleChange(item.id, 'unit_price', Math.max(0, +e.target.value))} className="h-8 text-sm" />
                </div>
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
