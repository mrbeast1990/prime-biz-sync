import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductModal } from '@/components/products/ProductModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Search, Download, Upload, Filter } from 'lucide-react';
import { mockProducts } from '@/data/mockData';
import { Product } from '@/types';
import { toast } from '@/hooks/use-toast';

export default function Products() {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = products.filter(
    (product) =>
      product.trade_name.includes(searchQuery) ||
      product.scientific_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery) ||
      product.category.includes(searchQuery)
  );

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`هل أنت متأكد من حذف "${product.trade_name}"؟`)) {
      setProducts(products.filter((p) => p.id !== product.id));
      toast({ title: 'تم الحذف', description: `تم حذف الصنف "${product.trade_name}" بنجاح` });
    }
  };

  const handleSave = (productData: Partial<Product>) => {
    if (selectedProduct) {
      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, ...productData, updated_at: new Date().toISOString() }
            : p
        )
      );
      toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الصنف بنجاح' });
    } else {
      const newProduct: Product = {
        id: String(Date.now()),
        barcode: productData.barcode || '',
        trade_name: productData.trade_name || '',
        scientific_name: productData.scientific_name || '',
        stock_quantity: productData.stock_quantity || 0,
        cost_price: productData.cost_price || 0,
        sale_price: productData.sale_price || 0,
        expiry_date: productData.expiry_date || '',
        min_stock: productData.min_stock || 10,
        category: productData.category || '',
        packaging_type: productData.packaging_type || 'علبة',
        units_per_package: productData.units_per_package || 1,
        has_expiry: productData.has_expiry ?? true,
        image_url: productData.image_url,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      setProducts([...products, newProduct]);
      toast({ title: 'تمت الإضافة', description: 'تم إضافة الصنف الجديد بنجاح' });
    }
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  return (
    <MainLayout title="بطاقة صنف">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الكود أو التصنيف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 input-focus" />
          </div>
          <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="gap-2"><Download className="h-4 w-4" />تصدير</Button>
          <Button variant="outline" className="gap-2"><Upload className="h-4 w-4" />استيراد</Button>
          <Button onClick={handleAddNew} className="gap-2"><Plus className="h-4 w-4" />إضافة صنف</Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="rounded-lg bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">إجمالي الأصناف</p>
          <p className="text-2xl font-bold text-card-foreground">{products.length}</p>
        </div>
        <div className="rounded-lg bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">مخزون منخفض</p>
          <p className="text-2xl font-bold text-destructive">{products.filter((p) => p.stock_quantity <= p.min_stock).length}</p>
        </div>
        <div className="rounded-lg bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">قريبة الانتهاء</p>
          <p className="text-2xl font-bold text-warning">
            {products.filter((p) => {
              if (!p.has_expiry) return false;
              const expiryDate = new Date(p.expiry_date);
              const threeMonthsFromNow = new Date();
              threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
              return expiryDate <= threeMonthsFromNow;
            }).length}
          </p>
        </div>
        <div className="rounded-lg bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">قيمة المخزون</p>
          <p className="text-2xl font-bold text-success tabular-nums">{products.reduce((sum, p) => sum + p.cost_price * p.stock_quantity, 0).toFixed(2)} ر.س</p>
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <ProductTable products={filteredProducts} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      {filteredProducts.length === 0 && (
        <div className="mt-8 text-center"><p className="text-muted-foreground">لا توجد أصناف مطابقة للبحث</p></div>
      )}

      <ProductModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }} onSave={handleSave} product={selectedProduct} />
    </MainLayout>
  );
}
