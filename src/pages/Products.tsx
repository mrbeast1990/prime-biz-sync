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
      product.tradeName.includes(searchQuery) ||
      product.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery) ||
      product.category.includes(searchQuery)
  );

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = (product: Product) => {
    if (window.confirm(`هل أنت متأكد من حذف "${product.tradeName}"؟`)) {
      setProducts(products.filter((p) => p.id !== product.id));
      toast({
        title: 'تم الحذف',
        description: `تم حذف المنتج "${product.tradeName}" بنجاح`,
      });
    }
  };

  const handleSave = (productData: Partial<Product>) => {
    if (selectedProduct) {
      // Edit existing
      setProducts(
        products.map((p) =>
          p.id === selectedProduct.id
            ? { ...p, ...productData, updatedAt: new Date().toISOString() }
            : p
        )
      );
      toast({
        title: 'تم التحديث',
        description: 'تم تحديث بيانات المنتج بنجاح',
      });
    } else {
      // Add new
      const newProduct: Product = {
        id: String(Date.now()),
        barcode: productData.barcode || '',
        tradeName: productData.tradeName || '',
        scientificName: productData.scientificName || '',
        stockQuantity: productData.stockQuantity || 0,
        costPrice: productData.costPrice || 0,
        salePrice: productData.salePrice || 0,
        expiryDate: productData.expiryDate || '',
        minStock: productData.minStock || 10,
        category: productData.category || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setProducts([...products, newProduct]);
      toast({
        title: 'تمت الإضافة',
        description: 'تم إضافة المنتج الجديد بنجاح',
      });
    }
    setIsModalOpen(false);
    setSelectedProduct(null);
  };

  const handleAddNew = () => {
    setSelectedProduct(null);
    setIsModalOpen(true);
  };

  return (
    <MainLayout title="إدارة المنتجات">
      {/* Actions Bar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div className="flex flex-1 gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="بحث بالاسم أو الباركود أو التصنيف..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pr-9 input-focus"
            />
          </div>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" className="gap-2">
            <Download className="h-4 w-4" />
            تصدير
          </Button>
          <Button variant="outline" className="gap-2">
            <Upload className="h-4 w-4" />
            استيراد
          </Button>
          <Button onClick={handleAddNew} className="gap-2">
            <Plus className="h-4 w-4" />
            إضافة منتج
          </Button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="rounded-lg bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">إجمالي المنتجات</p>
          <p className="text-2xl font-bold text-card-foreground">{products.length}</p>
        </div>
        <div className="rounded-lg bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">مخزون منخفض</p>
          <p className="text-2xl font-bold text-destructive">
            {products.filter((p) => p.stockQuantity <= p.minStock).length}
          </p>
        </div>
        <div className="rounded-lg bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">قريبة الانتهاء</p>
          <p className="text-2xl font-bold text-warning">
            {products.filter((p) => {
              const expiryDate = new Date(p.expiryDate);
              const threeMonthsFromNow = new Date();
              threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
              return expiryDate <= threeMonthsFromNow;
            }).length}
          </p>
        </div>
        <div className="rounded-lg bg-card p-4 shadow-card">
          <p className="text-sm text-muted-foreground">قيمة المخزون</p>
          <p className="text-2xl font-bold text-success tabular-nums">
            {products.reduce((sum, p) => sum + p.costPrice * p.stockQuantity, 0).toFixed(2)} ر.س
          </p>
        </div>
      </div>

      {/* Products Table */}
      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <ProductTable
          products={filteredProducts}
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      </div>

      {/* Empty State */}
      {filteredProducts.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-muted-foreground">لا توجد منتجات مطابقة للبحث</p>
        </div>
      )}

      {/* Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedProduct(null);
        }}
        onSave={handleSave}
        product={selectedProduct}
      />
    </MainLayout>
  );
}
