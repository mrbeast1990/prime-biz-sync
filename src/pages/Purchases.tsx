import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, Plus, Minus, Trash2, Barcode, PackagePlus, UserPlus, Truck, Save,
} from 'lucide-react';
import { mockProducts, mockContacts, mockPurchaseOrders } from '@/data/mockData';
import { Contact, Product, InvoiceItem } from '@/types';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { SupplierModal } from '@/components/purchases/SupplierModal';

export default function Purchases() {
  const navigate = useNavigate();
  const [selectedSupplier, setSelectedSupplier] = useState<Contact | null>(null);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [barcodeInput, setBarcodeInput] = useState('');

  const suppliers = mockContacts.filter((c) => c.type === 'supplier');

  const filteredProducts = mockProducts.filter(
    (p) =>
      p.tradeName.includes(searchQuery) ||
      p.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.barcode.includes(searchQuery)
  );

  const addProduct = (product: Product) => {
    const existing = items.find((i) => i.productId === product.id);
    if (existing) {
      setItems(items.map((i) =>
        i.productId === product.id
          ? { ...i, quantity: i.quantity + 1, total: (i.quantity + 1) * i.unitPrice }
          : i
      ));
    } else {
      setItems([...items, {
        id: Date.now().toString(),
        productId: product.id,
        productName: product.tradeName,
        quantity: 1,
        unitPrice: product.costPrice,
        total: product.costPrice,
      }]);
    }
  };

  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = mockProducts.find((p) => p.barcode === barcodeInput);
    if (product) {
      addProduct(product);
      setBarcodeInput('');
    } else {
      toast({ title: 'غير موجود', description: 'لم يتم العثور على صنف بهذا الباركود', variant: 'destructive' });
    }
  };

  const updateItem = (itemId: string, field: 'quantity' | 'unitPrice', value: number) => {
    setItems(items.map((i) => {
      if (i.id === itemId) {
        const updated = { ...i, [field]: value };
        updated.total = updated.quantity * updated.unitPrice;
        return updated;
      }
      return i;
    }));
  };

  const removeItem = (itemId: string) => setItems(items.filter((i) => i.id !== itemId));

  const total = items.reduce((sum, i) => sum + i.total, 0);

  const handleSave = () => {
    if (!selectedSupplier) {
      toast({ title: 'خطأ', description: 'اختر المورد أولاً', variant: 'destructive' });
      return;
    }
    if (items.length === 0) {
      toast({ title: 'خطأ', description: 'أضف أصنافاً أولاً', variant: 'destructive' });
      return;
    }
    const po = {
      id: `PO-${Date.now()}`,
      supplierId: selectedSupplier.id,
      supplierName: selectedSupplier.name,
      items: [...items],
      total,
      date: new Date().toISOString().split('T')[0],
      status: 'completed' as const,
    };
    mockPurchaseOrders.push(po);
    // Update stock
    items.forEach((item) => {
      const product = mockProducts.find((p) => p.id === item.productId);
      if (product) product.stockQuantity += item.quantity;
    });
    toast({ title: 'تم حفظ فاتورة المشتريات', description: `إجمالي ${total.toFixed(2)} ر.س من ${selectedSupplier.name}` });
    setItems([]);
    setSelectedSupplier(null);
  };

  const handleSupplierSave = (supplier: Contact) => {
    setSelectedSupplier(supplier);
    setShowSupplierModal(false);
  };

  return (
    <MainLayout title="المشتريات">
      <div className="grid h-[calc(100vh-8rem)] grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left: Product search & add */}
        <div className="lg:col-span-2 flex flex-col space-y-4">
          {/* Supplier Selection */}
          <div className="rounded-xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-3 mb-3">
              <Truck className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">المورد</Label>
            </div>
            <div className="flex items-center gap-3">
              <Select
                value={selectedSupplier?.id || ''}
                onValueChange={(v) => setSelectedSupplier(suppliers.find((s) => s.id === v) || null)}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="اختر المورد..." />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => setShowSupplierModal(true)}>
                <UserPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Products */}
          <div className="rounded-xl bg-card p-4 shadow-card flex-1 flex flex-col">
            <div className="flex items-center gap-3 mb-3">
              <PackagePlus className="h-5 w-5 text-primary" />
              <Label className="text-base font-semibold">إضافة أصناف</Label>
            </div>

            <form onSubmit={handleBarcodeSubmit} className="mb-3">
              <div className="relative">
                <Barcode className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value)} placeholder="امسح الباركود..." className="pr-9" />
              </div>
            </form>

            <div className="relative mb-3">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بالاسم..." className="pr-9" />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {filteredProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="rounded-lg bg-muted/50 p-3 text-right transition-all hover:bg-muted active:scale-[0.98]"
                  >
                    <p className="text-sm font-medium text-card-foreground line-clamp-1">{product.tradeName}</p>
                    <p className="text-xs text-muted-foreground tabular-nums">{product.costPrice.toFixed(2)} ر.س</p>
                  </button>
                ))}
              </div>
              {filteredProducts.length === 0 && searchQuery && (
                <div className="text-center py-8">
                  <p className="text-sm text-muted-foreground mb-3">الصنف غير موجود</p>
                  <Button variant="outline" className="gap-2" onClick={() => navigate('/products')}>
                    <Plus className="h-4 w-4" />
                    إضافة صنف جديد
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Invoice summary */}
        <div className="flex flex-col rounded-xl bg-card shadow-card">
          <div className="flex items-center gap-3 border-b border-border p-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Truck className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="font-semibold text-card-foreground">فاتورة المشتريات</h2>
              <p className="text-sm text-muted-foreground">{items.length} صنف</p>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center">
                <PackagePlus className="h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-muted-foreground">لا توجد أصناف</p>
                <p className="text-sm text-muted-foreground">ابحث عن صنف وأضفه</p>
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="rounded-lg bg-muted/50 p-3">
                    <div className="flex items-start justify-between">
                      <p className="font-medium text-card-foreground text-sm">{item.productName}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-xs">الكمية</Label>
                        <div className="flex items-center gap-1">
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItem(item.id, 'quantity', Math.max(1, item.quantity - 1))}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(item.id, 'quantity', Math.max(1, +e.target.value))}
                            className="h-6 w-12 text-center text-xs p-0"
                          />
                          <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => updateItem(item.id, 'quantity', item.quantity + 1)}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label className="text-xs">سعر الشراء</Label>
                        <Input
                          type="number"
                          value={item.unitPrice}
                          onChange={(e) => updateItem(item.id, 'unitPrice', Math.max(0, +e.target.value))}
                          className="h-6 text-xs"
                        />
                      </div>
                    </div>
                    <p className="mt-1 text-left text-sm font-bold text-card-foreground tabular-nums">{item.total.toFixed(2)} ر.س</p>
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
            <Button size="lg" className="w-full gap-2" onClick={handleSave}>
              <Save className="h-5 w-5" />
              حفظ فاتورة المشتريات
            </Button>
          </div>
        </div>
      </div>

      <SupplierModal isOpen={showSupplierModal} onClose={() => setShowSupplierModal(false)} onSave={handleSupplierSave} />
    </MainLayout>
  );
}
