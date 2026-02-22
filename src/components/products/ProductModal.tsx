import { useState, useEffect } from 'react';
import { Product } from '@/types';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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

const categories = [
  'مسكنات',
  'مضادات حيوية',
  'مسكنات موضعية',
  'مضادات الحساسية',
  'أدوية الجهاز الهضمي',
  'فيتامينات',
  'أدوية القلب',
  'أدوية السكري',
];

export function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [formData, setFormData] = useState({
    barcode: '',
    trade_name: '',
    scientific_name: '',
    category: '',
    stock_quantity: 0,
    min_stock: 10,
    cost_price: 0,
    sale_price: 0,
    expiry_date: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode,
        trade_name: product.trade_name,
        scientific_name: product.scientific_name,
        category: product.category,
        stock_quantity: product.stock_quantity,
        min_stock: product.min_stock,
        cost_price: product.cost_price,
        sale_price: product.sale_price,
        expiry_date: product.expiry_date,
      });
    } else {
      setFormData({
        barcode: '',
        trade_name: '',
        scientific_name: '',
        category: '',
        stock_quantity: 0,
        min_stock: 10,
        cost_price: 0,
        sale_price: 0,
        expiry_date: '',
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
            {product ? 'تعديل المنتج' : 'إضافة منتج جديد'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="barcode">الباركود</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                placeholder="أدخل الباركود أو امسحه"
                className="input-focus font-mono"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">التصنيف</Label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm input-focus"
                required
              >
                <option value="">اختر التصنيف</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="trade_name">الاسم التجاري</Label>
              <Input
                id="trade_name"
                value={formData.trade_name}
                onChange={(e) => setFormData({ ...formData, trade_name: e.target.value })}
                placeholder="الاسم التجاري للمنتج"
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stock_quantity">الكمية المتوفرة</Label>
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
              <Label htmlFor="min_stock">الحد الأدنى للمخزون</Label>
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

          <div className="grid grid-cols-3 gap-4">
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
              <Label htmlFor="expiry_date">تاريخ الانتهاء</Label>
              <Input
                id="expiry_date"
                type="date"
                value={formData.expiry_date}
                onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                className="input-focus"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              إلغاء
            </Button>
            <Button type="submit">
              {product ? 'حفظ التغييرات' : 'إضافة المنتج'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
