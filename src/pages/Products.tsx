import { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProductTable } from '@/components/products/ProductTable';
import { ProductModal } from '@/components/products/ProductModal';
import { ImportPreviewDialog } from '@/components/products/ImportPreviewDialog';
import { PrintSelectDialog } from '@/components/products/PrintSelectDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Plus, Search, Upload, Filter, Loader2, Printer, FileText, FileDown } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Product } from '@/types';
import { toast } from '@/hooks/use-toast';
import { useProducts, useCreateProduct, useUpdateProduct, useDeleteProduct } from '@/hooks/useSupabaseData';
import { useSettings } from '@/hooks/useSettings';
import { exportProductsToCSV, parseCSV, mapCSVToProducts } from '@/utils/exportUtils';

export default function Products() {
  const { data: products = [], isLoading } = useProducts();
  const { data: settings } = useSettings();
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [importProducts, setImportProducts] = useState<Partial<Product>[]>([]);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isPrintOpen, setIsPrintOpen] = useState(false);
  const [insuranceFilter, setInsuranceFilter] = useState<'all' | 'insurance' | 'non-insurance'>('all');
  const [showArchived, setShowArchived] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const defaultSettings = settings || { name: 'صيدلية النور', phone: '', address: '', receiptSize: '80mm' as const };

  useEffect(() => {
    if (searchParams.get('newProduct') === 'true') { setSelectedProduct(null); setIsModalOpen(true); }
  }, [searchParams]);

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.trade_name.includes(searchQuery) || (product.scientific_name || '').toLowerCase().includes(searchQuery.toLowerCase()) || (product.barcode || '').includes(searchQuery) || (product.category || '').includes(searchQuery);
    // Hide zero-stock unless showArchived is on
    if (!showArchived && !searchQuery && product.stock_quantity === 0) return false;
    // Insurance filter
    if (insuranceFilter === 'insurance' && !product.is_insurance) return false;
    if (insuranceFilter === 'non-insurance' && product.is_insurance) return false;
    return matchesSearch;
  });

  const handleEdit = (product: Product) => { setSelectedProduct(product); setIsModalOpen(true); };
  const handleDelete = async (product: Product) => {
    if (window.confirm(`هل أنت متأكد من حذف "${product.trade_name}"؟`)) {
      try { await deleteProduct.mutateAsync(product.id); toast({ title: 'تم الحذف', description: `تم حذف الصنف "${product.trade_name}" بنجاح` }); }
      catch { toast({ title: 'خطأ', description: 'فشل حذف الصنف', variant: 'destructive' }); }
    }
  };

  const handleSave = async (productData: Partial<Product>): Promise<boolean | void> => {
    try {
      if (selectedProduct) {
        await updateProduct.mutateAsync({ id: selectedProduct.id, ...productData });
        toast({ title: 'تم التحديث', description: 'تم تحديث بيانات الصنف بنجاح' });
        setIsModalOpen(false); setSelectedProduct(null);
      } else {
        await createProduct.mutateAsync(productData);
        toast({ title: 'تمت الإضافة ✓', description: 'تم إضافة الصنف — أدخل الصنف التالي' });
      }
      if (searchParams.get('returnTo') === 'purchases') { setIsModalOpen(false); navigate('/purchases?restore=true'); }
      return true;
    } catch {
      toast({ title: 'خطأ', description: 'فشل حفظ الصنف', variant: 'destructive' });
      return false;
    }
  };

  const handleAddNew = () => { setSelectedProduct(null); setIsModalOpen(true); };

  const handlePrintPDF = () => {
    if (products.length === 0) { toast({ title: 'لا توجد بيانات', description: 'لا توجد منتجات للطباعة', variant: 'destructive' }); return; }
    setIsPrintOpen(true);
  };

  const handleExportExcel = () => {
    if (products.length === 0) { toast({ title: 'لا توجد بيانات', description: 'لا توجد منتجات لتصديرها', variant: 'destructive' }); return; }
    exportProductsToCSV(products);
    toast({ title: 'تم التصدير', description: `تم تصدير ${products.length} صنف بنجاح` });
  };

  const handleImportClick = () => { fileInputRef.current?.click(); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) { toast({ title: 'ملف فارغ', description: 'لم يتم العثور على بيانات في الملف', variant: 'destructive' }); return; }
      const mapped = mapCSVToProducts(rows);
      setImportProducts(mapped);
      setIsImportOpen(true);
    };
    reader.readAsText(file, 'UTF-8');
    e.target.value = '';
  };

  const handleImportConfirm = async (items: Partial<Product>[]) => {
    let success = 0; let failed = 0;
    for (const item of items) { try { await createProduct.mutateAsync(item); success++; } catch { failed++; } }
    setIsImportOpen(false);
    toast({ title: 'تم الاستيراد', description: `تمت إضافة ${success} صنف بنجاح${failed > 0 ? ` | فشل ${failed}` : ''}`, variant: failed > 0 ? 'destructive' : 'default' });
  };

  const archivedCount = products.filter(p => p.stock_quantity === 0).length;

  if (isLoading) {
    return <MainLayout title="بطاقة صنف"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="بطاقة صنف">
      <input type="file" ref={fileInputRef} accept=".csv" className="hidden" onChange={handleFileChange} />

      <div className="mb-4 md:mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between animate-fade-in">
        <div className="flex flex-1 gap-2 md:gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="بحث بالاسم أو الكود أو التصنيف..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pr-9 input-focus" />
          </div>
          <Select value={insuranceFilter} onValueChange={(v) => setInsuranceFilter(v as typeof insuranceFilter)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">الكل</SelectItem>
              <SelectItem value="insurance">تأمين فقط</SelectItem>
              <SelectItem value="non-insurance">خارج التأمين</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 md:gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2">
            <Switch id="showArchived" checked={showArchived} onCheckedChange={setShowArchived} />
            <Label htmlFor="showArchived" className="text-xs whitespace-nowrap">المؤرشفة ({archivedCount})</Label>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" size="sm"><Printer className="h-4 w-4" /><span className="hidden sm:inline">طباعة</span></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handlePrintPDF} className="gap-2"><FileText className="h-4 w-4" /> PDF</DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportExcel} className="gap-2"><FileDown className="h-4 w-4" /> Excel</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" className="gap-2" size="sm" onClick={handleImportClick}><Upload className="h-4 w-4" /><span className="hidden sm:inline">استيراد</span></Button>
          <Button onClick={handleAddNew} className="gap-2" size="sm"><Plus className="h-4 w-4" /><span className="hidden sm:inline">إضافة صنف</span></Button>
        </div>
      </div>

      <div className="mb-4 md:mb-6 grid grid-cols-2 gap-3 md:gap-4 sm:grid-cols-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <div className="rounded-lg bg-card p-3 md:p-4 shadow-card">
          <p className="text-xs md:text-sm text-muted-foreground">إجمالي الأصناف</p>
          <p className="text-xl md:text-2xl font-bold text-card-foreground">{products.length}</p>
        </div>
        <div className="rounded-lg bg-card p-3 md:p-4 shadow-card">
          <p className="text-xs md:text-sm text-muted-foreground">مخزون منخفض</p>
          <p className="text-xl md:text-2xl font-bold text-destructive">{products.filter((p) => p.stock_quantity <= p.min_stock).length}</p>
        </div>
        <div className="rounded-lg bg-card p-3 md:p-4 shadow-card">
          <p className="text-xs md:text-sm text-muted-foreground">قريبة الانتهاء</p>
          <p className="text-xl md:text-2xl font-bold text-warning">
            {products.filter((p) => { if (!p.has_expiry) return false; const expiryDate = new Date(p.expiry_date); const d = new Date(); d.setMonth(d.getMonth() + 3); return expiryDate <= d; }).length}
          </p>
        </div>
        <div className="rounded-lg bg-card p-3 md:p-4 shadow-card">
          <p className="text-xs md:text-sm text-muted-foreground">قيمة المخزون</p>
          <p className="text-xl md:text-2xl font-bold text-success tabular-nums">{products.reduce((sum, p) => sum + p.cost_price * p.stock_quantity, 0).toFixed(2)} د.ل</p>
        </div>
      </div>

      <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <ProductTable products={filteredProducts} onEdit={handleEdit} onDelete={handleDelete} />
      </div>

      {filteredProducts.length === 0 && !isLoading && (
        <div className="mt-8 text-center"><p className="text-muted-foreground">لا توجد أصناف مطابقة للبحث</p></div>
      )}

      <ProductModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedProduct(null); }} onSave={handleSave} product={selectedProduct} />
      <ImportPreviewDialog isOpen={isImportOpen} onClose={() => setIsImportOpen(false)} onConfirm={handleImportConfirm} initialProducts={importProducts} />
      <PrintSelectDialog isOpen={isPrintOpen} onClose={() => setIsPrintOpen(false)} products={products} settings={defaultSettings} />
    </MainLayout>
  );
}
