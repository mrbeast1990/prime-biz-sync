import { useState, useRef, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Barcode, Search, Plus, Minus, Trash2, Banknote, ShoppingCart, X, Shield,
} from 'lucide-react';
import { mockProducts, mockInsuranceSales } from '@/data/mockData';
import { Product, CartItem, InsuranceCustomer } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { InsuranceCustomerDialog } from '@/components/insurance/InsuranceCustomerDialog';

export default function InsurancePOS() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');
  const [showCustomerDialog, setShowCustomerDialog] = useState(false);
  const barcodeRef = useRef<HTMLInputElement>(null);

  const filteredProducts = mockProducts.filter(
    (product) =>
      product.tradeName.includes(searchQuery) ||
      product.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery)
  );

  useEffect(() => {
    barcodeRef.current?.focus();
  }, []);

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);
    if (existingItem) {
      if (existingItem.quantity >= product.stockQuantity) {
        toast({ title: 'خطأ', description: 'الكمية المطلوبة غير متوفرة في المخزون', variant: 'destructive' });
        return;
      }
      setCart(cart.map((item) =>
        item.product.id === product.id
          ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.product.salePrice }
          : item
      ));
    } else {
      setCart([...cart, { product, quantity: 1, total: product.salePrice }]);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = mockProducts.find((p) => p.barcode === barcodeInput);
    if (product) {
      addToCart(product);
      setBarcodeInput('');
    } else {
      toast({ title: 'غير موجود', description: 'لم يتم العثور على منتج بهذا الباركود', variant: 'destructive' });
    }
    barcodeRef.current?.focus();
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(
      cart.map((item) => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          if (newQuantity <= 0) return null;
          if (newQuantity > item.product.stockQuantity) {
            toast({ title: 'خطأ', description: 'الكمية المطلوبة غير متوفرة في المخزون', variant: 'destructive' });
            return item;
          }
          return { ...item, quantity: newQuantity, total: newQuantity * item.product.salePrice };
        }
        return item;
      }).filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (productId: string) => setCart(cart.filter((item) => item.product.id !== productId));
  const clearCart = () => setCart([]);
  const total = cart.reduce((sum, item) => sum + item.total, 0);
  const itemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handleSell = () => {
    if (cart.length === 0) {
      toast({ title: 'السلة فارغة', description: 'أضف منتجات إلى السلة أولاً', variant: 'destructive' });
      return;
    }
    setShowCustomerDialog(true);
  };

  const handleConfirmSale = (customer: InsuranceCustomer) => {
    const sale = {
      id: `IS-${Date.now()}`,
      customerId: customer.id,
      customerName: customer.name,
      items: [...cart],
      total,
      date: new Date().toISOString().split('T')[0],
    };
    mockInsuranceSales.push(sale);
    toast({ title: 'تم البيع بنجاح', description: `تم تسجيل بيع تأمين بقيمة ${total.toFixed(2)} ر.س للعميل ${customer.name}` });
    clearCart();
    setShowCustomerDialog(false);
  };

  return (
    <MainLayout title="البيع لمستخدمين التأمين">
      <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Products Grid */}
        <div className="lg:col-span-2 flex flex-col">
          <form onSubmit={handleBarcodeSubmit} className="mb-4">
            <div className="relative">
              <Barcode className="absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input ref={barcodeRef} value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} placeholder="امسح الباركود هنا..." className="pr-10 h-12 text-lg font-mono input-focus" />
            </div>
          </form>

          <div className="relative mb-4">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث عن منتج..." className="pr-9 input-focus" />
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {filteredProducts.map((product) => (
                <button
                  key={product.id}
                  onClick={() => addToCart(product)}
                  disabled={product.stockQuantity === 0}
                  className={cn(
                    'rounded-lg bg-card p-4 text-right shadow-card transition-all hover:shadow-md hover:scale-[1.02] active:scale-[0.98]',
                    product.stockQuantity === 0 && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <p className="font-medium text-card-foreground line-clamp-1">{product.tradeName}</p>
                  <p className="mt-1 text-xs text-muted-foreground line-clamp-1">{product.scientificName}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-lg font-bold text-primary tabular-nums">{product.salePrice.toFixed(2)}</span>
                    <span className={cn('text-xs font-medium rounded-full px-2 py-0.5', product.stockQuantity <= product.minStock ? 'bg-destructive/10 text-destructive' : 'bg-success/10 text-success')}>
                      {product.stockQuantity}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Panel */}
        <div className="flex flex-col rounded-xl bg-card shadow-card">
          <div className="flex items-center justify-between border-b border-border p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold text-card-foreground">سلة التأمين</h2>
                <p className="text-sm text-muted-foreground">{itemCount} منتج</p>
              </div>
            </div>
            {cart.length > 0 && (
              <Button variant="ghost" size="icon" onClick={clearCart}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {cart.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">السلة فارغة</p>
                <p className="text-sm text-muted-foreground">امسح الباركود أو اختر منتجاً</p>
              </div>
            ) : (
              <div className="space-y-3">
                {cart.map((item) => (
                  <div key={item.product.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-card-foreground">{item.product.tradeName}</p>
                        <p className="text-sm text-muted-foreground">{item.product.salePrice.toFixed(2)} ر.س</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive" onClick={() => removeFromCart(item.product.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, -1)}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium tabular-nums">{item.quantity}</span>
                        <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQuantity(item.product.id, 1)}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <p className="font-bold text-card-foreground tabular-nums">{item.total.toFixed(2)} ر.س</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="border-t border-border p-4">
            <div className="mb-4 rounded-lg bg-primary/10 p-4">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الإجمالي</span>
                <span className="text-3xl font-bold text-primary tabular-nums">{total.toFixed(2)} ر.س</span>
              </div>
            </div>
            <Button size="lg" className="w-full gap-2" onClick={handleSell}>
              <Banknote className="h-5 w-5" />
              بيع للتأمين
            </Button>
          </div>
        </div>
      </div>

      <InsuranceCustomerDialog
        isOpen={showCustomerDialog}
        onClose={() => setShowCustomerDialog(false)}
        onConfirm={handleConfirmSale}
      />
    </MainLayout>
  );
}
