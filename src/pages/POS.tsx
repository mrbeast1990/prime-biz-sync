import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Barcode, Search, Plus, Minus, Trash2, CreditCard, Banknote, User, ShoppingCart, X,
  RotateCcw, AlertTriangle, UserPlus, Loader2, ChevronDown,
} from 'lucide-react';
import { Product, CartItem, SaleMode } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useProducts, useContacts, useCreateInvoice, useUpdateProductStock } from '@/hooks/useSupabaseData';
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

export default function POS() {
  const { data: products = [], isLoading } = useProducts();
  const { data: contacts = [] } = useContacts('customer');
  const createInvoice = useCreateInvoice();
  const updateStock = useUpdateProductStock();

  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [saleMode, setSaleMode] = useState<SaleMode>('cash');
  const [customerName, setCustomerName] = useState('');
  const barcodeRef = useRef<HTMLInputElement>(null);

  const filteredProducts = products.filter(
    (product) =>
      product.trade_name.includes(searchQuery) ||
      (product.scientific_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.barcode || '').includes(searchQuery)
  );

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
      const invoiceType = saleMode === 'return' ? 'return' : saleMode === 'damage' ? 'damage' : 'sale';
      const stockDelta = saleMode === 'return' ? 1 : -1;

      await createInvoice.mutateAsync({
        invoice_type: invoiceType,
        contact_name: saleMode === 'credit' ? customerName : undefined,
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

      // Update stock for each item
      for (const item of cart) {
        await updateStock.mutateAsync({ id: item.product.id, delta: stockDelta * item.quantity });
      }

      const modeLabels: Record<SaleMode, string> = {
        cash: 'بيع نقدي', card: 'بيع ببطاقة', credit: `بيع آجل - ${customerName}`, return: 'استرجاع', damage: 'إتلاف',
      };
      toast({
        title: saleMode === 'return' ? 'تم الاسترجاع' : saleMode === 'damage' ? 'تم تسجيل الإتلاف' : 'تم البيع بنجاح',
        description: `${modeLabels[saleMode]} بقيمة ${total.toFixed(2)} د.ل`,
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
      <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 flex flex-col">
          <form onSubmit={handleBarcodeSubmit} className="mb-4">
            <div className="relative">
              <Barcode className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input ref={barcodeRef} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} placeholder="امسح الباركود أو أدخل الكود..." className="pr-10 h-12 text-lg font-mono input-focus" />
            </div>
          </form>
          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث عن صنف..." className="pr-9 input-focus" />
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filteredProducts.map((product) => (
                <button key={product.id} onClick={() => addToCart(product)} disabled={product.stock_quantity === 0}
                  className={cn('rounded-lg bg-card p-4 text-right shadow-card transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]', product.stock_quantity === 0 && 'opacity-50 cursor-not-allowed')}>
                  <p className="font-medium text-card-foreground text-sm leading-tight">{product.trade_name}</p>
                  <p className="mt-1 text-xs text-muted-foreground leading-tight">{product.scientific_name}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary tabular-nums">{product.sale_price.toFixed(2)}</span>
                    <span className={cn('text-xs font-medium rounded-full px-2 py-0.5', product.stock_quantity <= product.min_stock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>{product.stock_quantity}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-col rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><ShoppingCart className="h-5 w-5 text-primary" /></div>
              <div><h2 className="font-semibold text-card-foreground">السلة</h2><p className="text-sm text-muted-foreground">{itemCount} صنف</p></div>
            </div>
            {cart.length > 0 && <Button variant="ghost" size="icon" onClick={clearCart}><X className="h-4 w-4" /></Button>}
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">السلة فارغة</p>
                <p className="text-sm text-muted-foreground">امسح الكود أو اختر صنفاً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">{item.product.trade_name}</p>
                        <p className="text-sm text-muted-foreground">{item.product.sale_price.toFixed(2)} د.ل</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.product.id)}><Trash2 className="h-3 w-3" /></Button>
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant={saleMode === 'damage' ? 'destructive' : 'default'} className="w-full gap-2 justify-between">
                  <span className="flex items-center gap-2">
                    {(() => { const current = saleModes.find(m => m.mode === saleMode); const Icon = current!.icon; return <><Icon className="h-4 w-4" />{current!.label}</>; })()}
                  </span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] bg-popover" align="start">
                {saleModes.map(({ mode, label, icon: Icon }) => (
                  <DropdownMenuItem key={mode} onClick={() => setSaleMode(mode)} className={cn('gap-2 cursor-pointer', saleMode === mode && 'bg-accent')}>
                    <Icon className="h-4 w-4" />{label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
            {saleMode === 'credit' && (
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="اسم الزبون..." className="pr-9 input-focus" list="customers-list" />
                <datalist id="customers-list">{contacts.map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>
            )}
            <div className="rounded-lg bg-primary/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="text-3xl font-bold text-primary tabular-nums">{total.toFixed(2)} د.ل</span>
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
    </MainLayout>
  );
}
