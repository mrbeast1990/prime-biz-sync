import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, UserPlus, CalendarIcon } from 'lucide-react';
import { InsuranceCustomer } from '@/types';
import { cn } from '@/lib/utils';
import { useInsuranceCustomers, useCreateInsuranceCustomer } from '@/hooks/useSupabaseData';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface InsuranceCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customer: InsuranceCustomer, saleDate: string) => void;
}

export function InsuranceCustomerDialog({ isOpen, onClose, onConfirm }: InsuranceCustomerDialogProps) {
  const { data: customers = [] } = useInsuranceCustomers();
  const createCustomer = useCreateInsuranceCustomer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<InsuranceCustomer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [saleDate, setSaleDate] = useState<Date>(new Date());

  const filteredCustomers = customers.filter(
    (c) => c.name.includes(searchQuery) || (c.card_number || '').includes(searchQuery) || (c.phone || '').includes(searchQuery)
  );

  const handleConfirm = async () => {
    // Check if date is older than 1 month
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    if (saleDate < oneMonthAgo) {
      const confirmed = window.confirm('التاريخ المختار أقدم من شهر. هل أنت متأكد؟');
      if (!confirmed) return;
    }

    const dateStr = format(saleDate, 'yyyy-MM-dd');

    if (isNewCustomer) {
      if (!newName.trim()) return;
      try {
        const newCustomer = await createCustomer.mutateAsync({ name: newName, card_number: newCardNumber, phone: newPhone });
        onConfirm(newCustomer, dateStr);
      } catch { return; }
    } else if (selectedCustomer) {
      onConfirm(selectedCustomer, dateStr);
    }
    resetState();
  };

  const resetState = () => {
    setSearchQuery(''); setSelectedCustomer(null); setIsNewCustomer(false);
    setNewName(''); setNewPhone(''); setNewCardNumber('');
    setSaleDate(new Date());
  };

  const handleClose = () => { resetState(); onClose(); };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>اختيار عميل التأمين</DialogTitle></DialogHeader>

        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <Label className="shrink-0">تاريخ العملية</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn('flex-1 justify-start text-left font-normal', !saleDate && 'text-muted-foreground')}>
                <CalendarIcon className="ml-2 h-4 w-4" />
                {format(saleDate, 'yyyy-MM-dd')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={saleDate}
                onSelect={(d) => d && setSaleDate(d)}
                disabled={(date) => date > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {!isNewCustomer ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بالاسم أو رقم البطاقة..." className="pr-9" />
            </div>
            <div className="max-h-48 space-y-2 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <button key={customer.id} onClick={() => setSelectedCustomer(customer)}
                  className={cn('w-full rounded-lg border p-3 text-right transition-colors', selectedCustomer?.id === customer.id ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted/50')}>
                  <p className="font-medium text-card-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">{customer.card_number || ''} • {customer.phone || ''}</p>
                </button>
              ))}
              {filteredCustomers.length === 0 && <p className="py-4 text-center text-sm text-muted-foreground">لا توجد نتائج</p>}
            </div>
            <Button variant="outline" className="w-full gap-2" onClick={() => setIsNewCustomer(true)}><UserPlus className="h-4 w-4" />إضافة عميل جديد</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div><Label>اسم العميل *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="أدخل اسم العميل" /></div>
            <div><Label>رقم البطاقة</Label><Input value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value)} placeholder="رقم بطاقة التأمين" /></div>
            <div><Label>رقم الهاتف</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="05xxxxxxxx" /></div>
            <Button variant="outline" className="w-full" onClick={() => setIsNewCustomer(false)}>العودة للقائمة</Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>إلغاء</Button>
          <Button onClick={handleConfirm} disabled={(!isNewCustomer && !selectedCustomer) || (isNewCustomer && !newName.trim()) || createCustomer.isPending}>تأكيد البيع</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
