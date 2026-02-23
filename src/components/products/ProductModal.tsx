import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { Shuffle, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => void;
  product?: Product | null;
}

const defaultCategories = [
  'مسكنات',
  'مضادات حيوية',
  'مسكنات موضعية',
  'مضادات الحساسية',
  'أدوية الجهاز الهضمي',
  'فيتامينات',
  'أدوية القلب',
  'أدوية السكري',
];

const CATEGORIES_STORAGE_KEY = 'product_categories';

const packagingTypes = ['علبة', 'شريط', 'قطعة', 'أنبوب', 'زجاجة'];

const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

export function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultCategories;
  });
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (trimmed && !categories.includes(trimmed)) {
      const updated = [...categories, trimmed];
      setCategories(updated);
      localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
      setFormData({ ...formData, category: trimmed });
      setNewCategory('');
      setShowAddCategory(false);
    }
  };

  const handleDeleteCategory = (cat: string) => {
    const updated = categories.filter((c) => c !== cat);
    setCategories(updated);
    localStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(updated));
    if (formData.category === cat) {
      setFormData({ ...formData, category: '' });
    }
  };

  const [formData, setFormData] = useState({
    barcode: '',
    trade_name: '',
    scientific_name: '',
    category: '',
    packaging_type: 'علبة',
    units_per_package: 1,
    has_expiry: true,
    image_url: '',
    stock_quantity: 0,
    min_stock: 10,
    cost_price: 0,
    sale_price: 0,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode,
        trade_name: product.trade_name,
        scientific_name: product.scientific_name,
        category: product.category,
        packaging_type: product.packaging_type || 'علبة',
        units_per_package: product.units_per_package || 1,
        has_expiry: product.has_expiry ?? true,
        image_url: product.image_url || '',
        stock_quantity: product.stock_quantity,
        min_stock: product.min_stock,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
      });
    } else {
      setFormData({
        barcode: generateCode(),
        trade_name: '',
        scientific_name: '',
        category: '',
        packaging_type: 'علبة',
        units_per_package: 1,
        has_expiry: true,
        image_url: '',
        stock_quantity: 0,
        min_stock: 10,
        cost_price: 0,
        sale_price: 0,
      });
    }
  }, [product, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {product ? 'تعديل الصنف' : 'إضافة صنف جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          {/* الكود واسم الصنف */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">الكود</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  placeholder="كود الصنف"
                  className="input-focus font-mono"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setFormData({ ...formData, barcode: generateCode() })}
                  title="توليد كود عشوائي"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade_name">اسم الصنف</Label>
              <Input
                id="trade_name"
                value={formData.trade_name}
                onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                placeholder="اسم الصنف"
                className="input-focus"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scientific_name">الاسم العلمي</Label>
              <Input
                id="scientific_name"
                value={formData.scientific_name}
                onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                placeholder="الاسم العلمي"
                className="input-focus"
              />
            </div>
          </div>

          {/* التصنيف والتعبئة */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">التصنيف</Label>
              <div className="flex gap-2">
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm input-focus"
                  required
                >
                  <option value="">اختر التصنيف</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setShowAddCategory(!showAddCategory)}
                  title="إضافة تصنيف"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {showAddCategory && (
                <div className="flex gap-2 mt-2">
                  <Input
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="اسم التصنيف الجديد"
                    className="input-focus"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                  />
                  <Button type="button" size="sm" onClick={handleAddCategory}>إضافة</Button>
                </div>
              )}
              {showAddCategory && categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {categories.map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                      {cat}
                      <button type="button" onClick={() => handleDeleteCategory(cat)} className="text-muted-foreground hover:text-destructive">
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="packaging_type">نوع التعبئة</Label>
              <select
                id="packaging_type"
                value={formData.packaging_type}
                onChange={(e) => setFormData({ ...formData, packaging_type: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm input-focus"
              >
                {packagingTypes.map((type) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="units_per_package">عدد الوحدات في العبوة</Label>
              <Input
                id="units_per_package"
                type="number"
                min="1"
                value={formData.units_per_package}
                onChange={(e) => setFormData({ ...formData, units_per_package: Number(e.target.value) })}
                className="input-focus"
                required
              />
            </div>
          </div>

          {/* الصلاحية */}
          <div className="flex items-center gap-3">
            <Switch
              id="has_expiry"
              checked={formData.has_expiry}
              onCheckedChange={(checked) => setFormData({ ...formData, has_expiry: checked })}
            />
            <Label htmlFor="has_expiry">خاضع لصلاحية</Label>
            <span className="text-xs text-muted-foreground">(يتم تحديد تاريخ الصلاحية عند الشراء)</span>
          </div>

          {/* صورة الصنف */}
          <div className="space-y-2">
            <Label htmlFor="image_url">رابط صورة الصنف (اختياري)</Label>
            <Input
              id="image_url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="رابط الصورة"
              className="input-focus"
            />
          </div>

          {/* الحقول المالية */}
          <div className="grid grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_price">سعر التكلفة</Label>
              <Input
                id="cost_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                className="input-focus"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price">سعر البيع</Label>
              <Input
                id="sale_price"
                type="number"
                min="0"
                step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                className="input-focus"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">الكمية</Label>
              <Input
                id="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                className="input-focus"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">الحد الأدنى</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                className="input-focus"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>إلغاء</Button>
            <Button type="submit">{product ? 'حفظ التغييرات' : 'إضافة الصنف'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
