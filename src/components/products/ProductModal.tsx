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
    tradeName: '',
    scientificName: '',
    category: '',
    stockQuantity: 0,
    minStock: 10,
    costPrice: 0,
    salePrice: 0,
    expiryDate: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        barcode: product.barcode,
        tradeName: product.tradeName,
        scientificName: product.scientificName,
        category: product.category,
        stockQuantity: product.stockQuantity,
        minStock: product.minStock,
        costPrice: product.costPrice,
        salePrice: product.salePrice,
        expiryDate: product.expiryDate,
      });
    } else {
      setFormData({
        barcode: '',
        tradeName: '',
        scientificName: '',
        category: '',
        stockQuantity: 0,
        minStock: 10,
        costPrice: 0,
        salePrice: 0,
        expiryDate: '',
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
              <Label htmlFor="tradeName">الاسم التجاري</Label>
              <Input
                id="tradeName"
                value={formData.tradeName}
                onChange={(e) => setFormData({ ...formData, tradeName: e.target.value })}
                placeholder="الاسم التجاري للمنتج"
                className="input-focus"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="scientificName">الاسم العلمي</Label>
              <Input
                id="scientificName"
                value={formData.scientificName}
                onChange={(e) => setFormData({ ...formData, scientificName: e.target.value })}
                placeholder="الاسم العلمي"
                className="input-focus"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="stockQuantity">الكمية المتوفرة</Label>
              <Input
                id="stockQuantity"
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={(e) => setFormData({ ...formData, stockQuantity: Number(e.target.value) })}
                className="input-focus"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="minStock">الحد الأدنى للمخزون</Label>
              <Input
                id="minStock"
                type="number"
                min="0"
                value={formData.minStock}
                onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                className="input-focus"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="costPrice">سعر التكلفة</Label>
              <Input
                id="costPrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.costPrice}
                onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                className="input-focus"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice">سعر البيع</Label>
              <Input
                id="salePrice"
                type="number"
                min="0"
                step="0.01"
                value={formData.salePrice}
                onChange={(e) => setFormData({ ...formData, salePrice: Number(e.target.value) })}
                className="input-focus"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expiryDate">تاريخ الانتهاء</Label>
              <Input
                id="expiryDate"
                type="date"
                value={formData.expiryDate}
                onChange={(e) => setFormData({ ...formData, expiryDate: e.target.value })}
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
