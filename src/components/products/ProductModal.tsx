import { useState, useEffect, useRef, KeyboardEvent } from 'react';
import { Product } from '@/types';
import { Shuffle, Plus, X, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
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
  'مسكنات', 'مضادات حيوية', 'مسكنات موضعية', 'مضادات الحساسية',
  'أدوية الجهاز الهضمي', 'فيتامينات', 'أدوية القلب', 'أدوية السكري',
];

const CATEGORIES_STORAGE_KEY = 'product_categories';
const SHORTCUTS_KEY = 'pos_product_shortcuts';

const packagingTypes = ['علبة', 'شريط', 'قطعة', 'أنبوب', 'زجاجة'];
const generateCode = () => Math.floor(1000 + Math.random() * 9000).toString();

function getShortcuts(): string[] {
  try { return JSON.parse(localStorage.getItem(SHORTCUTS_KEY) || '[]'); } catch { return []; }
}

export function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [categories, setCategories] = useState<string[]>(() => {
    const saved = localStorage.getItem(CATEGORIES_STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultCategories;
  });
  const [newCategory, setNewCategory] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [isShortcut, setIsShortcut] = useState(false);

  // Refs for Enter navigation
  const fieldRefs = useRef<(HTMLInputElement | HTMLSelectElement | null)[]>([]);
  const setRef = (index: number) => (el: HTMLInputElement | HTMLSelectElement | null) => { fieldRefs.current[index] = el; };

  const handleEnterNav = (e: KeyboardEvent, currentIndex: number) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const next = fieldRefs.current[currentIndex + 1];
      if (next) next.focus();
    }
  };

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
    if (formData.category === cat) setFormData({ ...formData, category: '' });
  };

  const [formData, setFormData] = useState({
    barcode: '', trade_name: '', scientific_name: '', category: '',
    packaging_type: 'علبة', units_per_package: 1, has_expiry: true,
    image_url: '', stock_quantity: 0, min_stock: 0, cost_price: 0, sale_price: 0,
    batch_number: '',
  });
  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode, trade_name: product.trade_name,
        scientific_name: product.scientific_name, category: product.category,
        packaging_type: product.packaging_type || 'علبة', units_per_package: product.units_per_package || 1,
        has_expiry: product.has_expiry ?? true, image_url: product.image_url || '',
        stock_quantity: product.stock_quantity, min_stock: product.min_stock,
        cost_price: product.cost_price, sale_price: product.sale_price,
        batch_number: product.batch_number || '',
      });
      setIsShortcut(getShortcuts().includes(product.id));
    } else {
      setFormData({
        barcode: generateCode(), trade_name: '', scientific_name: '', category: '',
        packaging_type: 'علبة', units_per_package: 1, has_expiry: true,
        image_url: '', stock_quantity: 0, min_stock: 0, cost_price: 0, sale_price: 0,
        batch_number: '',
      });
      setIsShortcut(false);
    }
  }, [product, isOpen]);

  const toggleShortcut = () => {
    if (!product) return;
    const current = getShortcuts();
    let updated: string[];
    if (current.includes(product.id)) {
      updated = current.filter(id => id !== product.id);
      setIsShortcut(false);
      toast({ title: 'تم إزالة الاختصار' });
    } else {
      updated = [...current, product.id];
      setIsShortcut(true);
      toast({ title: 'تم إضافة اختصار', description: 'سيظهر الصنف في شاشة البيع السريع' });
    }
    localStorage.setItem(SHORTCUTS_KEY, JSON.stringify(updated));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-bold">
              {product ? 'تعديل الصنف' : 'إضافة صنف جديد'}
            </DialogTitle>
            {product && (
              <Button type="button" variant={isShortcut ? 'default' : 'outline'} size="sm" onClick={toggleShortcut} className="gap-1">
                <Star className={`h-4 w-4 ${isShortcut ? 'fill-current' : ''}`} />
                {isShortcut ? 'اختصار مفعّل' : 'إنشاء اختصار'}
              </Button>
            )}
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-5">
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">الكود</Label>
              <div className="flex gap-2">
                <Input id="barcode" ref={setRef(0)} value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  onKeyDown={(e) => handleEnterNav(e, 0)}
                  placeholder="كود الصنف" className="input-focus font-mono" required />
                <Button type="button" variant="outline" size="icon"
                  onClick={() => setFormData({ ...formData, barcode: generateCode() })} title="توليد كود عشوائي">
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trade_name">اسم الصنف</Label>
              <Input id="trade_name" ref={setRef(1)} value={formData.trade_name}
                onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                onKeyDown={(e) => handleEnterNav(e, 1)}
                placeholder="اسم الصنف" className="input-focus" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scientific_name">الاسم العلمي</Label>
              <Input id="scientific_name" ref={setRef(2)} value={formData.scientific_name}
                onChange={(e) => setFormData({ ...formData, scientific_name: e.target.value })}
                onKeyDown={(e) => handleEnterNav(e, 2)}
                placeholder="الاسم العلمي" className="input-focus" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">التصنيف</Label>
              <div className="flex gap-2">
                <select id="category" ref={setRef(3)} value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fieldRefs.current[4]?.focus(); } }}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm input-focus" required>
                  <option value="">اختر التصنيف</option>
                  {categories.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
                </select>
                <Button type="button" variant="outline" size="icon" onClick={() => setShowAddCategory(!showAddCategory)} title="إضافة تصنيف">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {showAddCategory && (
                <div className="flex gap-2 mt-2">
                  <Input value={newCategory} onChange={(e) => setNewCategory(e.target.value)} placeholder="اسم التصنيف الجديد" className="input-focus"
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())} />
                  <Button type="button" size="sm" onClick={handleAddCategory}>إضافة</Button>
                </div>
              )}
              {showAddCategory && categories.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {categories.map((cat) => (
                    <span key={cat} className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs">
                      {cat}
                      <button type="button" onClick={() => handleDeleteCategory(cat)} className="text-muted-foreground hover:text-destructive"><X className="h-3 w-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="packaging_type">نوع التعبئة</Label>
              <select id="packaging_type" ref={setRef(4)} value={formData.packaging_type}
                onChange={(e) => setFormData({ ...formData, packaging_type: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); fieldRefs.current[5]?.focus(); } }}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm input-focus">
                {packagingTypes.map((type) => <option key={type} value={type}>{type}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="units_per_package">عدد الوحدات في العبوة</Label>
              <Input id="units_per_package" ref={setRef(5)} type="number" min="1"
                value={formData.units_per_package}
                onChange={(e) => setFormData({ ...formData, units_per_package: Number(e.target.value) })}
                onKeyDown={(e) => handleEnterNav(e, 5)}
                className="input-focus" required />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Switch id="has_expiry" checked={formData.has_expiry}
              onCheckedChange={(checked) => setFormData({ ...formData, has_expiry: checked })} />
            <Label htmlFor="has_expiry">خاضع لصلاحية</Label>
            <span className="text-xs text-muted-foreground">(يتم تحديد تاريخ الصلاحية عند الشراء)</span>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">رابط صورة الصنف (اختياري)</Label>
            <Input id="image_url" value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="رابط الصورة" className="input-focus" />
          </div>

          <div className="grid grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="cost_price">سعر التكلفة</Label>
              <Input id="cost_price" ref={setRef(6)} type="number" min="0" step="0.01"
                value={formData.cost_price}
                onChange={(e) => setFormData({ ...formData, cost_price: Number(e.target.value) })}
                onKeyDown={(e) => handleEnterNav(e, 6)}
                className="input-focus" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sale_price">سعر البيع</Label>
              <Input id="sale_price" ref={setRef(7)} type="number" min="0" step="0.01"
                value={formData.sale_price}
                onChange={(e) => setFormData({ ...formData, sale_price: Number(e.target.value) })}
                onKeyDown={(e) => handleEnterNav(e, 7)}
                className="input-focus" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">الكمية</Label>
              <Input id="stock_quantity" ref={setRef(8)} type="number" min="0"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                onKeyDown={(e) => handleEnterNav(e, 8)}
                className="input-focus" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_stock">الحد الأدنى</Label>
              <Input id="min_stock" ref={setRef(9)} type="number" min="0"
                value={formData.min_stock}
                onChange={(e) => setFormData({ ...formData, min_stock: Number(e.target.value) })}
                onKeyDown={(e) => handleEnterNav(e, 9)}
                className="input-focus" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="batch_number">رقم التشغيلة</Label>
              <Input id="batch_number" ref={setRef(10)} value={formData.batch_number}
                onChange={(e) => setFormData({ ...formData, batch_number: e.target.value })}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); } }}
                placeholder="اختياري" className="input-focus" />
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
