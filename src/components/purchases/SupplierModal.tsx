import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contact } from '@/types';
import { mockContacts } from '@/data/mockData';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Contact) => void;
}

export function SupplierModal({ isOpen, onClose, onSave }: SupplierModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSave = () => {
    if (!name.trim()) return;
    const newSupplier: Contact = {
      id: Date.now().toString(),
      name,
      type: 'supplier',
      phone,
      email: '',
      address,
      balance: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };
    mockContacts.push(newSupplier);
    onSave(newSupplier);
    setName('');
    setPhone('');
    setAddress('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>إضافة مورد جديد</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>اسم المورد *</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل اسم المورد" />
          </div>
          <div>
            <Label>رقم الهاتف</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" />
          </div>
          <div>
            <Label>العنوان</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!name.trim()}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
