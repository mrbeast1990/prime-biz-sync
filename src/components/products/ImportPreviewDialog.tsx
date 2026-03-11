import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Loader2, SkipForward, Save, CheckCircle2 } from 'lucide-react';
import { Product } from '@/types';

interface ImportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (products: Partial<Product>[]) => Promise<void>;
  initialProducts: Partial<Product>[];
}

const FIELDS: { key: keyof Product; label: string; type: 'text' | 'number' | 'boolean' }[] = [
  { key: 'barcode', label: 'الكود', type: 'text' },
  { key: 'trade_name', label: 'الاسم التجاري', type: 'text' },
  { key: 'scientific_name', label: 'الاسم العلمي', type: 'text' },
  { key: 'category', label: 'التصنيف', type: 'text' },
  { key: 'packaging_type', label: 'التعبئة', type: 'text' },
  { key: 'units_per_package', label: 'الوحدات', type: 'number' },
  { key: 'cost_price', label: 'سعر التكلفة', type: 'number' },
  { key: 'sale_price', label: 'سعر البيع', type: 'number' },
  { key: 'stock_quantity', label: 'المخزون', type: 'number' },
  { key: 'min_stock', label: 'الحد الأدنى', type: 'number' },
  { key: 'has_expiry', label: 'صلاحية', type: 'boolean' },
];

export function ImportPreviewDialog({ isOpen, onClose, onConfirm, initialProducts }: ImportPreviewDialogProps) {
  const [products, setProducts] = useState<Partial<Product>[]>(initialProducts);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);

  const current = products[currentIndex];
  const totalCount = products.length;

  const updateField = (key: string, value: any) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[currentIndex] = { ...updated[currentIndex], [key]: value };
      return updated;
    });
  };

  const hasError = (product: Partial<Product>) => !product.trade_name?.trim();

  const handleSaveAndNext = () => {
    if (hasError(current)) return;
    setSavedIndices(prev => new Set(prev).add(currentIndex));
    if (currentIndex < totalCount - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleSkip = () => {
    if (currentIndex < totalCount - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleConfirmAll = async () => {
    setIsSubmitting(true);
    try {
      // Save current if valid and not yet saved
      const finalSaved = new Set(savedIndices);
      if (!hasError(current)) finalSaved.add(currentIndex);
      
      const toSave = products.filter((p, i) => finalSaved.has(i) && !hasError(p));
      await onConfirm(toSave);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!current) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>مراجعة الأصناف المستوردة</span>
            <span className="text-sm font-normal text-muted-foreground tabular-nums">{currentIndex + 1} / {totalCount}</span>
          </DialogTitle>
          <DialogDescription>
            عدّل بيانات كل صنف ثم اضغط "حفظ والتالي". تم حفظ {savedIndices.size} من {totalCount}.
          </DialogDescription>
        </DialogHeader>

        {/* Progress bar */}
        <div className="w-full bg-muted rounded-full h-2">
          <div className="bg-primary h-2 rounded-full transition-all" style={{ width: `${((currentIndex + 1) / totalCount) * 100}%` }} />
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 py-2">
          {FIELDS.map(field => (
            <div key={field.key}>
              <Label className="text-sm">{field.label}</Label>
              {field.type === 'boolean' ? (
                <div className="flex items-center gap-2 mt-1">
                  <Switch checked={!!current[field.key]} onCheckedChange={(v) => updateField(field.key, v)} />
                  <span className="text-sm text-muted-foreground">{current[field.key] ? 'نعم' : 'لا'}</span>
                </div>
              ) : (
                <Input
                  className={`mt-1 ${field.key === 'trade_name' && hasError(current) ? 'border-destructive' : ''}`}
                  type={field.type === 'number' ? 'number' : 'text'}
                  value={String(current[field.key] ?? '')}
                  onChange={e => {
                    const val = field.type === 'number' ? (e.target.value === '' ? 0 : parseFloat(e.target.value)) : e.target.value;
                    updateField(field.key, val);
                  }}
                />
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between pt-3 border-t gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))} disabled={currentIndex === 0}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => setCurrentIndex(Math.min(totalCount - 1, currentIndex + 1))} disabled={currentIndex === totalCount - 1}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={handleSkip} disabled={currentIndex === totalCount - 1}>
              <SkipForward className="h-4 w-4 ml-1" />تخطي
            </Button>
            {currentIndex < totalCount - 1 ? (
              <Button onClick={handleSaveAndNext} disabled={hasError(current)}>
                <Save className="h-4 w-4 ml-1" />حفظ والتالي
              </Button>
            ) : (
              <Button onClick={handleConfirmAll} disabled={isSubmitting || savedIndices.size === 0}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin ml-1" /> : <CheckCircle2 className="h-4 w-4 ml-1" />}
                تأكيد حفظ {savedIndices.size + (hasError(current) ? 0 : 1)} صنف
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
