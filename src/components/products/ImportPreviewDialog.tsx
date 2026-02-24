import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trash2, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { Product } from '@/types';

interface ImportPreviewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (products: Partial<Product>[]) => Promise<void>;
  initialProducts: Partial<Product>[];
}

const COLUMNS: { key: keyof Product; label: string; type: 'text' | 'number' | 'boolean' }[] = [
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
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (index: number, key: string, value: any) => {
    setProducts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [key]: value };
      return updated;
    });
  };

  const removeRow = (index: number) => {
    setProducts(prev => prev.filter((_, i) => i !== index));
  };

  const hasError = (product: Partial<Product>) => !product.trade_name?.trim();

  const validCount = products.filter(p => !hasError(p)).length;
  const errorCount = products.filter(p => hasError(p)).length;

  const handleConfirm = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(products.filter(p => !hasError(p)));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>مراجعة البيانات المستوردة</DialogTitle>
          <DialogDescription>
            راجع وعدّل البيانات قبل تأكيد الإضافة. الصفوف بدون اسم تجاري لن تُضاف.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-success">
            <CheckCircle2 className="h-4 w-4" />
            {validCount} صنف جاهز
          </span>
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <AlertCircle className="h-4 w-4" />
              {errorCount} صنف به خطأ
            </span>
          )}
        </div>

        <ScrollArea className="flex-1 min-h-0 border rounded-md">
          <div className="min-w-[1000px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10 text-right">#</TableHead>
                  {COLUMNS.map(col => (
                    <TableHead key={col.key} className="text-right whitespace-nowrap">{col.label}</TableHead>
                  ))}
                  <TableHead className="w-10"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((product, idx) => (
                  <TableRow key={idx} className={hasError(product) ? 'bg-destructive/10' : ''}>
                    <TableCell className="text-muted-foreground text-xs">{idx + 1}</TableCell>
                    {COLUMNS.map(col => (
                      <TableCell key={col.key} className="p-1">
                        {col.type === 'boolean' ? (
                          <select
                            className="h-8 w-full rounded border border-input bg-background px-2 text-sm"
                            value={product[col.key] ? 'نعم' : 'لا'}
                            onChange={e => updateField(idx, col.key, e.target.value === 'نعم')}
                          >
                            <option value="نعم">نعم</option>
                            <option value="لا">لا</option>
                          </select>
                        ) : (
                          <Input
                            className="h-8 text-sm px-2"
                            type={col.type === 'number' ? 'number' : 'text'}
                            value={String(product[col.key] ?? '')}
                            onChange={e => {
                              const val = col.type === 'number'
                                ? (e.target.value === '' ? 0 : parseFloat(e.target.value))
                                : e.target.value;
                              updateField(idx, col.key, val);
                            }}
                          />
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="p-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeRow(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-2 border-t">
          <span className="text-sm text-muted-foreground">
            إجمالي: {products.length} صنف
          </span>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isSubmitting}>إلغاء</Button>
            <Button onClick={handleConfirm} disabled={isSubmitting || validCount === 0}>
              {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin ml-2" />جارٍ الإضافة...</> : `تأكيد إضافة ${validCount} صنف`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
