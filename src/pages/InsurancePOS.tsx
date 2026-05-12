import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Barcode, Search, Plus, Minus, Trash2, Banknote, ShoppingCart, X, Shield, Loader2, Zap, Users,
} from 'lucide-react';
import { Product, CartItem, InsuranceCustomer } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { InsuranceCustomerDialog } from '@/components/insurance/InsuranceCustomerDialog';
import { QuickPurchaseModal } from '@/components/insurance/QuickPurchaseModal';
import { useProducts, useCreateInsuranceSale, useUpdateProductStock, useInsuranceCustomers, useCustomerDefaultMedications } from '@/hooks/useSupabaseData';
import { formatStockDisplay } from '@/utils/stockDisplay';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DRAFT_KEY = 'insurance_pos_draft';

export default function InsurancePOS() {
  const { data: products = [], isLoading } = useProducts();
  const { data: insuranceCustomers = [] } = useInsuranceCustomers();
  const createSale = useCreateInsuranceSale();
  const updateStock = useUpdateProductStock();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const [quickPurchaseProduct, setQuickPurchaseProduct] = useState<Product | null>(null);
  const [showZeroStockAlert, setShowZeroStockAlert] = useState(false);
  const [pendingZeroProduct, setPendingZeroProduct] = useState<Product | null>(null);
  const [showCustomerList, setShowCustomerList] = useState(false);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [selectedCustomerForMeds, setSelectedCustomerForMeds] = useState<string | null>(null);
  const barcodeRef = useRef<HTMLInputElement>(null);

  // Fetch default medications for selected customer
  const { data: defaultMeds = [], isFetching: isFetchingMeds } = useCustomerDefaultMedications(selectedCustomerForMeds || undefined);

  // Auto-fill cart when customer meds are loaded
  useEffect(() => {
    if (!selectedCustomerForMeds || isFetchingMeds) return;
    const meds = defaultMeds as any[];
    if (meds.length === 0) {
      toast({ title: 'لا توجد وصفة افتراضية', description: 'هذا العميل ليس لديه علاج افتراضي محفوظ', variant: 'destructive' });
      setSelectedCustomerForMeds(null);
      setShowCustomerList(false);
      return;
    }
    const newItems: CartItem[] = [];
    let skipped = 0;
    for (const med of meds) {
      const product = products.find(p => p.id === med.product_id);
      if (!product) { skipped++; continue; }
      const existingInCart = cart.find(item => item.product.id === product.id);
      if (existingInCart) { skipped++; continue; }
      newItems.push({ product, quantity: med.quantity, total: med.quantity * product.sale_price });
    }
    if (newItems.length > 0) {
      setCart(prev => [...prev, ...newItems]);
      toast({ title: 'تم تحميل العلاج', description: `تمت إضافة ${newItems.length} صنف${skipped ? ` (تم تخطي ${skipped})` : ''}` });
    } else {
      toast({ title: 'تنبيه', description: 'جميع أصناف الوصفة موجودة بالسلة بالفعل' });
    }
    setSelectedCustomerForMeds(null);
    setShowCustomerList(false);
  }, [defaultMeds, selectedCustomerForMeds, isFetchingMeds]);

  useEffect(() => {
    try {
      const draft = sessionStorage.getItem(DRAFT_KEY);
      if (draft) { const parsed = JSON.parse(draft); if (Array.isArray(parsed) && parsed.length > 0) setCart(parsed); sessionStorage.removeItem(DRAFT_KEY); }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    return () => { if (cart.length > 0) { sessionStorage.setItem(DRAFT_KEY, JSON.stringify(cart)); } };
  }, [cart]);

  const shortcutProducts = products.filter(p => p.is_insurance_shortcut && p.stock_quantity > 0);

  const showProducts = searchQuery.length > 0;
  const filteredProducts = showProducts ? products.filter(
    (product) =>
      (product.trade_name.includes(searchQuery) ||
      (product.scientific_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode || '').includes(searchQuery))
  ) : [];

  const filteredCustomersList = customerSearchQuery.length > 0
    ? insuranceCustomers.filter(c => c.name.includes(customerSearchQuery) || (c.card_number || '').includes(customerSearchQuery))
    : insuranceCustomers;

  useEffect(() => { barcodeRef.current?.focus(); }, []);

  const addToCart = (product: Product) => {
    if (product.stock_quantity <= 0) {
      setPendingZeroProduct(product);
      setShowZeroStockAlert(true);
      return;
    }
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stock_quantity) { toast({ title: 'خطأ', description: 'الكمية المطلوبة غير متوفرة في المخزون', variant: 'destructive' }); return; }
      setCart(cart.map((item) => item.product.id === product.id ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.product.sale_price } : item));
    } else {
      setCart([...cart, { product, quantity: 1, total: product.sale_price }]);
    }
  };

  const handleQuickPurchaseSuccess = (updatedProduct: Product, qty: number) => {
    const existingItem = cart.find((item) => item.product.id === updatedProduct.id);
    if (existingItem) {
      setCart(cart.map((item) => item.product.id === updatedProduct.id
        ? { ...item, product: updatedProduct, quantity: item.quantity + qty, total: (item.quantity + qty) * updatedProduct.sale_price }
        : item));
    } else {
      setCart([...cart, { product: updatedProduct, quantity: qty, total: qty * updatedProduct.sale_price }]);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find((p) => p.barcode === barcodeInput);
    if (product) { addToCart(product); setBarcodeInput(''); }
    else { toast({ title: 'غير موجود', description: 'لم يتم العثور على منتج بهذا الباركود', variant: 'destructive' }); }
    barcodeRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(cart.map((item) => {
      if (item.product.id === productId) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) return null;
        if (newQuantity > item.product.stock_quantity) { toast({ title: 'خطأ', description: 'الكمية المطلوبة غير متوفرة في المخزون', variant: 'destructive' }); return item; }
        return { ...item, quantity: newQuantity, total: newQuantity * item.product.sale_price };
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  const removeFromCart = (productId: string) => setCart(cart.filter((item) => item.product.id !== productId));
  const clearCart = () => { setCart([]); sessionStorage.removeItem(DRAFT_KEY); };
  const total = cart.reduce((sum, item) => sum + item.total, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSell = () => {
    if (cart.length === 0) { toast({ title: 'السلة فارغة', description: 'أضف منتجات إلى السلة أولاً', variant: 'destructive' }); return; }
    setShowCustomerDialog(true);
  };

  const handleConfirmSale = async (customer: InsuranceCustomer, saleDate: string) => {
    try {
      const saleItems = cart.map(item => ({ product_id: item.product.id, product_name: item.product.trade_name, quantity: item.quantity, unit_price: item.product.sale_price, total: item.total }));
      await createSale.mutateAsync({ customer_id: customer.id, customer_name: customer.name, total, sale_date: saleDate, items: saleItems });
      for (const item of cart) { await updateStock.mutateAsync({ id: item.product.id, delta: -item.quantity }); }
      toast({ title: 'تم البيع بنجاح', description: `تم تسجيل بيع تأمين بقيمة ${total.toFixed(2)} د.ل للعميل ${customer.name}` });
      clearCart(); setShowCustomerDialog(false);
    } catch { toast({ title: 'خطأ', description: 'فشل تسجيل البيع', variant: 'destructive' }); }
  };

  if (isLoading) {
    return <MainLayout title="البيع لمستخدمين التأمين"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="البيع لمستخدمين التأمين">
      {/* Shortcuts Section */}
      {shortcutProducts.length > 0 && (
        <div className="mb-3 md:mb-4">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-muted-foreground">اختصارات سريعة</span>
          </div>
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex gap-2 pb-2">
              {shortcutProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  className="inline-flex flex-col items-center gap-1 rounded-lg border border-border bg-card px-3 py-2 min-w-[100px] md:min-w-[120px] hover:bg-accent hover:border-primary/50 transition-all active:scale-95 shrink-0"
                >
                  <span className="text-xs md:text-sm font-medium text-card-foreground truncate max-w-[90px] md:max-w-[110px]">{product.trade_name}</span>
                  <span className="text-xs font-bold text-primary tabular-nums">{product.sale_price.toFixed(2)} د.ل</span>
                </button>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )}

      <div className="grid h-[calc(100vh-12rem)] grid-cols-1 gap-4 md:gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col">
          <div className="flex gap-2 mb-3 md:mb-4">
            <form onSubmit={handleBarcodeSubmit} className="flex-1">
              <div className="relative">
                <Barcode className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                <Input ref={barcodeRef} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} placeholder="امسح الباركود هنا..." className="pr-10 h-11 md:h-12 text-base md:text-lg font-mono input-focus" />
              </div>
            </form>
            <Button variant="outline" className="h-11 md:h-12 gap-2 shrink-0" onClick={() => setShowCustomerList(true)}>
              <Users className="h-4 w-4" />
              <span className="hidden sm:inline">اختر عميل</span>
            </Button>
          </div>
          <div className="relative mb-3 md:mb-4">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث عن منتج..." className="pr-9 input-focus" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {showProducts ? (
              <div className="grid grid-cols-2 gap-2 md:gap-3 sm:grid-cols-3 md:grid-cols-4">
                {filteredProducts.map((product) => (
                  <button key={product.id} onClick={() => addToCart(product)}
                    className={cn('rounded-lg bg-card p-3 md:p-4 text-right shadow-card transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]', product.stock_quantity === 0 && 'opacity-60 border border-warning/30')}>
                    <p className="font-medium text-card-foreground text-sm leading-tight">{product.trade_name}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-tight">{product.scientific_name}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-base md:text-lg font-bold text-primary tabular-nums">{product.sale_price.toFixed(2)}</span>
                      <span className={cn('text-xs font-medium rounded-full px-2 py-0.5', product.stock_quantity <= product.min_stock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
                        {formatStockDisplay(product.stock_quantity, product.units_per_package)}
                      </span>
                    </div>
                  </button>
                ))}
                {filteredProducts.length === 0 && <div className="col-span-full text-center py-8 text-muted-foreground text-sm">لا توجد نتائج</div>}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                <Search className="h-10 w-10 mb-2 opacity-30" />
                <p className="text-sm">ابحث عن صنف بالاسم أو الباركود</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border p-3 md:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Shield className="h-5 w-5 text-primary" /></div>
              <div><h2 className="font-semibold text-card-foreground">إصدار فاتورة</h2><p className="text-sm text-muted-foreground">{itemCount} منتج</p></div>
            </div>
            {cart.length > 0 && <Button variant="ghost" size="icon" onClick={clearCart}><X className="h-4 w-4" /></Button>}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-3 md:p-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">لا توجد أصناف</p>
                <p className="text-sm text-muted-foreground">امسح الباركود أو اختر منتجاً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1"><p className="font-medium text-card-foreground">{item.product.trade_name}</p><p className="text-sm text-muted-foreground">{item.product.sale_price.toFixed(2)} د.ل</p></div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.product.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-8 w-8 md:h-7 md:w-7" onClick={() => updateQuantity(item.product.id, -1)}><Minus className="h-3 w-3" /></Button>
                        <span className="w-8 text-center font-medium tabular-nums">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8 md:h-7 md:w-7" onClick={() => updateQuantity(item.product.id, 1)}><Plus className="h-3 w-3" /></Button>
                      </div>
                      <p className="font-bold text-card-foreground tabular-nums">{item.total.toFixed(2)} د.ل</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="border-t border-border p-3 md:p-4 space-y-3">
            <div className="flex gap-3">
              <div className="rounded-lg border border-border px-3 md:px-4 py-3 flex flex-col items-center justify-center min-w-[4rem] md:min-w-[5rem]">
                <Banknote className="h-5 w-5 text-primary" />
                <span className="text-xs font-medium text-card-foreground mt-1">نقدي</span>
              </div>
              <div className="flex-1 rounded-lg bg-primary/10 p-3 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">الإجمالي</span>
                <span className="text-2xl md:text-4xl font-bold text-primary tabular-nums">{total.toFixed(2)} د.ل</span>
              </div>
            </div>
            <Button size="lg" className="w-full gap-2" onClick={handleSell} disabled={createSale.isPending}>
              {createSale.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Banknote className="h-5 w-5" />بيع للتأمين</>}
            </Button>
          </div>
        </div>
      </div>

      <InsuranceCustomerDialog isOpen={showCustomerDialog} onClose={() => setShowCustomerDialog(false)} onConfirm={handleConfirmSale} />
      
      <QuickPurchaseModal
        isOpen={!!quickPurchaseProduct}
        onClose={() => setQuickPurchaseProduct(null)}
        product={quickPurchaseProduct}
        onSuccess={handleQuickPurchaseSuccess}
      />

      <AlertDialog open={showZeroStockAlert} onOpenChange={setShowZeroStockAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>الكمية صفر</AlertDialogTitle>
            <AlertDialogDescription>
              كمية "{pendingZeroProduct?.trade_name}" صفر في المخزون. هل تريد إضافة مشتريات سريعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setShowZeroStockAlert(false); setPendingZeroProduct(null); }}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={() => { setShowZeroStockAlert(false); setQuickPurchaseProduct(pendingZeroProduct); setPendingZeroProduct(null); }}>
              شراء سريع
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Customer list dialog for auto-filling default medications */}
      <Dialog open={showCustomerList} onOpenChange={setShowCustomerList}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> اختر عميل من القائمة</DialogTitle></DialogHeader>
          <div className="relative mb-3">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={customerSearchQuery} onChange={e => setCustomerSearchQuery(e.target.value)} placeholder="بحث بالاسم أو رقم البطاقة..." className="pr-9" />
          </div>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {filteredCustomersList.map(customer => (
              <button
                key={customer.id}
                onClick={() => setSelectedCustomerForMeds(customer.id)}
                className="w-full rounded-lg border border-border p-3 text-right transition-colors hover:bg-muted/50 hover:border-primary/50"
              >
                <p className="font-medium text-card-foreground">{customer.name}</p>
                <p className="text-xs text-muted-foreground">{customer.card_number || ''} • {customer.phone || ''}</p>
              </button>
            ))}
            {filteredCustomersList.length === 0 && <p className="text-center py-4 text-sm text-muted-foreground">لا يوجد عملاء</p>}
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
