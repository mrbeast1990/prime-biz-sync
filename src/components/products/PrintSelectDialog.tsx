import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Printer } from 'lucide-react';
import { Product } from '@/types';
import { PharmacySettings } from '@/types';
import { printProductsTable } from '@/utils/printUtils';

interface PrintSelectDialogProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: PharmacySettings;
}

export function PrintSelectDialog({ isOpen, onClose, products, settings }: PrintSelectDialogProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set(products.map(p => p.id)));
  const [searchQuery, setSearchQuery] = useState('');

  const filtered = products.filter(p =>
    p.trade_name.includes(searchQuery) ||
    (p.scientific_name || '').includes(searchQuery) ||
    (p.barcode || '').includes(searchQuery)
  );

  const allSelected = selected.size === products.length;

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(products.map(p => p.id)));
    }
  };

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelected(next);
  };

  const handlePrint = () => {
    const toPrint = products.filter(p => selected.has(p.id));
    printProductsTable(toPrint, settings);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>اختيار أصناف للطباعة</DialogTitle>
        </DialogHeader>

        <div className="relative mb-3">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث..." className="pr-9" />
        </div>

        <div className="flex items-center justify-between mb-2">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            تحديد الكل ({products.length})
          </label>
          <span className="text-sm text-muted-foreground">{selected.size} محدد</span>
        </div>

        <ScrollArea className="flex-1 min-h-0 border rounded-md">
          <div className="p-2 space-y-1">
            {filtered.map(p => (
              <label key={p.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted/50 cursor-pointer">
                <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggle(p.id)} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{p.trade_name}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.scientific_name} {p.barcode && `| ${p.barcode}`}</p>
                </div>
                <span className="text-xs tabular-nums text-muted-foreground">{p.stock_quantity}</span>
              </label>
            ))}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-3 border-t">
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handlePrint} disabled={selected.size === 0} className="gap-2">
            <Printer className="h-4 w-4" />
            طباعة {selected.size} صنف
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
