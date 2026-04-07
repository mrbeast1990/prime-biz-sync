import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Plus, Trash2, Pill, Loader2 } from 'lucide-react';
import { useProducts, useCustomerDefaultMedications, useAddDefaultMedication, useDeleteDefaultMedication } from '@/hooks/useSupabaseData';
import { toast } from '@/hooks/use-toast';

interface DefaultMedicationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
}

export function DefaultMedicationsDialog({ isOpen, onClose, customerId, customerName }: DefaultMedicationsDialogProps) {
  const { data: products = [] } = useProducts();
  const { data: meds = [], isLoading } = useCustomerDefaultMedications(customerId);
  const addMed = useAddDefaultMedication();
  const deleteMed = useDeleteDefaultMedication();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [quantity, setQuantity] = useState(1);

  const filteredProducts = searchQuery.length > 0
    ? products.filter(p => p.trade_name.includes(searchQuery) || (p.scientific_name || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const handleAdd = async () => {
    if (!selectedProductId) return;
    try {
      await addMed.mutateAsync({ customer_id: customerId, product_id: selectedProductId, quantity });
      setSelectedProductId('');
      setQuantity(1);
      setSearchQuery('');
      toast({ title: 'تمت الإضافة' });
    } catch {
      toast({ title: 'خطأ', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMed.mutateAsync(id);
    } catch {
      toast({ title: 'خطأ', variant: 'destructive' });
    }
  };

  const getProductName = (productId: string) => products.find(p => p.id === productId)?.trade_name || '—';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5 text-primary" />
            العلاج الافتراضي - {customerName}
          </DialogTitle>
        </DialogHeader>

        {/* Add new medication */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث عن دواء..." className="pr-9" />
          </div>

          {filteredProducts.length > 0 && !selectedProductId && (
            <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-border p-1">
              {filteredProducts.slice(0, 10).map(p => (
                <button key={p.id} onClick={() => { setSelectedProductId(p.id); setSearchQuery(p.trade_name); }}
                  className="w-full rounded-md p-2 text-right text-sm hover:bg-muted transition-colors">
                  <span className="font-medium text-card-foreground">{p.trade_name}</span>
                  <span className="text-xs text-muted-foreground mr-2">{p.scientific_name}</span>
                </button>
              ))}
            </div>
          )}

          {selectedProductId && (
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <Label className="text-xs">الكمية</Label>
                <Input type="number" min={1} value={quantity} onChange={e => setQuantity(Math.max(1, +e.target.value))} className="h-9" />
              </div>
              <Button onClick={handleAdd} disabled={addMed.isPending} className="h-9 gap-1">
                <Plus className="h-4 w-4" /> إضافة
              </Button>
            </div>
          )}
        </div>

        {/* Current medications list */}
        <div className="space-y-2 mt-2">
          <p className="text-sm font-medium text-muted-foreground">الأدوية الافتراضية ({(meds as any[]).length})</p>
          {isLoading ? (
            <div className="flex justify-center py-4"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
          ) : (meds as any[]).length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-4">لا توجد أدوية افتراضية</p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-2">
              {(meds as any[]).map((med: any) => (
                <div key={med.id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                  <div>
                    <p className="font-medium text-sm text-card-foreground">{getProductName(med.product_id)}</p>
                    <p className="text-xs text-muted-foreground">الكمية: {med.quantity}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(med.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
