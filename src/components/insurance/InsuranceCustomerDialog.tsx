import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Search, UserPlus, CalendarIcon, Pill, Plus, Trash2, ArrowRight } from 'lucide-react';
import { InsuranceCustomer } from '@/types';
import { cn } from '@/lib/utils';
import { useInsuranceCustomers, useCreateInsuranceCustomer, useProducts, useAddDefaultMedication } from '@/hooks/useSupabaseData';
import { format } from 'date-fns';
import { toast } from '@/hooks/use-toast';

interface InsuranceCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customer: InsuranceCustomer, saleDate: string) => void;
}

interface PendingMed {
  product_id: string;
  product_name: string;
  quantity: number;
}

export function InsuranceCustomerDialog({ isOpen, onClose, onConfirm }: InsuranceCustomerDialogProps) {
  const { data: customers = [] } = useInsuranceCustomers();
  const { data: products = [] } = useProducts();
  const createCustomer = useCreateInsuranceCustomer();
  const addMed = useAddDefaultMedication();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<InsuranceCustomer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [showPrescription, setShowPrescription] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCardNumber, setNewCardNumber] = useState('');
  const [saleDate, setSaleDate] = useState<Date>(new Date());

  // Prescription state
  const [pendingMeds, setPendingMeds] = useState<PendingMed[]>([]);
  const [medSearchQuery, setMedSearchQuery] = useState('');
  const [selectedMedProductId, setSelectedMedProductId] = useState('');
  const [medQuantity, setMedQuantity] = useState(1);

  const filteredCustomers = customers.filter(
    (c) => c.name.includes(searchQuery) || (c.card_number || '').includes(searchQuery) || (c.phone || '').includes(searchQuery)
  );

  const filteredMedProducts = medSearchQuery.length > 0
    ? products.filter(p => p.trade_name.includes(medSearchQuery) || (p.scientific_name || '').toLowerCase().includes(medSearchQuery.toLowerCase())).slice(0, 10)
    : [];

  const addPendingMed = () => {
    if (!selectedMedProductId) return;
    const product = products.find(p => p.id === selectedMedProductId);
    if (!product) return;
    if (pendingMeds.some(m => m.product_id === selectedMedProductId)) {
      toast({ title: 'موجود بالفعل', variant: 'destructive' });
      return;
    }
    setPendingMeds(prev => [...prev, { product_id: selectedMedProductId, product_name: product.trade_name, quantity: medQuantity }]);
    setSelectedMedProductId('');
    setMedSearchQuery('');
    setMedQuantity(1);
  };

  const removePendingMed = (productId: string) => {
    setPendingMeds(prev => prev.filter(m => m.product_id !== productId));
  };

  const handleConfirm = async () => {
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
        // Save pending meds for the new customer
        for (const med of pendingMeds) {
          await addMed.mutateAsync({ customer_id: newCustomer.id, product_id: med.product_id, quantity: med.quantity });
        }
        onConfirm(newCustomer, dateStr);
      } catch { return; }
    } else if (selectedCustomer) {
      onConfirm(selectedCustomer, dateStr);
    }
    resetState();
  };

  const resetState = () => {
    setSearchQuery(''); setSelectedCustomer(null); setIsNewCustomer(false);
    setShowPrescription(false);
    setNewName(''); setNewPhone(''); setNewCardNumber('');
    setSaleDate(new Date());
    setPendingMeds([]); setMedSearchQuery(''); setSelectedMedProductId(''); setMedQuantity(1);
  };

  const handleClose = () => { resetState(); onClose(); };

  const goToPrescription = () => {
    if (!newName.trim()) {
      toast({ title: 'أدخل اسم العميل أولاً', variant: 'destructive' });
      return;
    }
    setShowPrescription(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
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
        ) : !showPrescription ? (
          /* Step 1: Basic info */
          <div className="space-y-4">
            <div><Label>اسم العميل *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="أدخل اسم العميل" /></div>
            <div><Label>رقم البطاقة</Label><Input value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value)} placeholder="رقم بطاقة التأمين" /></div>
            <div><Label>رقم الهاتف</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="05xxxxxxxx" /></div>
            <Button variant="default" className="w-full gap-2" onClick={goToPrescription}>
              <Pill className="h-4 w-4" /> الوصفة الافتراضية
            </Button>
            <Button variant="outline" className="w-full" onClick={() => setIsNewCustomer(false)}>العودة للقائمة</Button>
          </div>
        ) : (
          /* Step 2: Prescription */
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowPrescription(false)}>
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                <Pill className="h-4 w-4 text-primary" /> الوصفة الافتراضية - {newName}
              </p>
            </div>

            {/* Search & add product */}
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={medSearchQuery} onChange={(e) => { setMedSearchQuery(e.target.value); setSelectedMedProductId(''); }} placeholder="بحث عن دواء..." className="pr-9" />
            </div>

            {filteredMedProducts.length > 0 && !selectedMedProductId && (
              <div className="max-h-32 overflow-y-auto space-y-1 rounded-lg border border-border p-1">
                {filteredMedProducts.map(p => (
                  <button key={p.id} onClick={() => { setSelectedMedProductId(p.id); setMedSearchQuery(p.trade_name); }}
                    className="w-full rounded-md p-2 text-right text-sm hover:bg-muted transition-colors">
                    <span className="font-medium text-card-foreground">{p.trade_name}</span>
                    <span className="text-xs text-muted-foreground mr-2">{p.scientific_name}</span>
                  </button>
                ))}
              </div>
            )}

            {selectedMedProductId && (
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <Label className="text-xs">الكمية</Label>
                  <Input type="number" min={1} value={medQuantity} onChange={e => setMedQuantity(Math.max(1, +e.target.value))} className="h-9" />
                </div>
                <Button onClick={addPendingMed} className="h-9 gap-1">
                  <Plus className="h-4 w-4" /> إضافة
                </Button>
              </div>
            )}

            {/* Pending meds list */}
            <div className="space-y-2 mt-2">
              <p className="text-sm font-medium text-muted-foreground">الأدوية ({pendingMeds.length})</p>
              {pendingMeds.length === 0 ? (
                <p className="text-center text-sm text-muted-foreground py-3">لم تضف أدوية بعد</p>
              ) : (
                <div className="max-h-40 overflow-y-auto space-y-2">
                  {pendingMeds.map((med) => (
                    <div key={med.product_id} className="flex items-center justify-between rounded-lg bg-muted/50 p-3">
                      <div>
                        <p className="font-medium text-sm text-card-foreground">{med.product_name}</p>
                        <p className="text-xs text-muted-foreground">الكمية: {med.quantity}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removePendingMed(med.product_id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>إلغاء</Button>
          <Button onClick={handleConfirm} disabled={(!isNewCustomer && !selectedCustomer) || (isNewCustomer && !newName.trim()) || createCustomer.isPending}>
            تأكيد البيع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
