import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, UserPlus } from 'lucide-react';
import { InsuranceCustomer } from '@/types';
import { mockInsuranceCustomers } from '@/data/mockData';
import { cn } from '@/lib/utils';

interface InsuranceCustomerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (customer: InsuranceCustomer) => void;
}

export function InsuranceCustomerDialog({ isOpen, onClose, onConfirm }: InsuranceCustomerDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<InsuranceCustomer | null>(null);
  const [isNewCustomer, setIsNewCustomer] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newCardNumber, setNewCardNumber] = useState('');

  const filteredCustomers = mockInsuranceCustomers.filter(
    (c) => c.name.includes(searchQuery) || c.cardNumber.includes(searchQuery) || c.phone.includes(searchQuery)
  );

  const handleConfirm = () => {
    if (isNewCustomer) {
      if (!newName.trim()) return;
      const newCustomer: InsuranceCustomer = {
        id: Date.now().toString(),
        name: newName,
        cardNumber: newCardNumber,
        phone: newPhone,
        balance: 0,
        createdAt: new Date().toISOString().split('T')[0],
      };
      mockInsuranceCustomers.push(newCustomer);
      onConfirm(newCustomer);
    } else if (selectedCustomer) {
      onConfirm(selectedCustomer);
    }
    resetState();
  };

  const resetState = () => {
    setSearchQuery('');
    setSelectedCustomer(null);
    setIsNewCustomer(false);
    setNewName('');
    setNewPhone('');
    setNewCardNumber('');
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>اختيار عميل التأمين</DialogTitle>
        </DialogHeader>

        {!isNewCustomer ? (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="بحث بالاسم أو رقم البطاقة..."
                className="pr-9"
              />
            </div>

            <div className="max-h-48 space-y-2 overflow-y-auto">
              {filteredCustomers.map((customer) => (
                <button
                  key={customer.id}
                  onClick={() => setSelectedCustomer(customer)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-right transition-colors',
                    selectedCustomer?.id === customer.id
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:bg-muted/50'
                  )}
                >
                  <p className="font-medium text-card-foreground">{customer.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {customer.cardNumber} • {customer.phone}
                  </p>
                </button>
              ))}
              {filteredCustomers.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">لا توجد نتائج</p>
              )}
            </div>

            <Button variant="outline" className="w-full gap-2" onClick={() => setIsNewCustomer(true)}>
              <UserPlus className="h-4 w-4" />
              إضافة عميل جديد
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>اسم العميل *</Label>
              <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="أدخل اسم العميل" />
            </div>
            <div>
              <Label>رقم البطاقة</Label>
              <Input value={newCardNumber} onChange={(e) => setNewCardNumber(e.target.value)} placeholder="رقم بطاقة التأمين" />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="05xxxxxxxx" />
            </div>
            <Button variant="outline" className="w-full" onClick={() => setIsNewCustomer(false)}>
              العودة للقائمة
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>إلغاء</Button>
          <Button
            onClick={handleConfirm}
            disabled={!isNewCustomer && !selectedCustomer || isNewCustomer && !newName.trim()}
          >
            تأكيد البيع
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
