import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Contact } from '@/types';
import { useCreateContact } from '@/hooks/useSupabaseData';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Contact) => void;
}

export function SupplierModal({ isOpen, onClose, onSave }: SupplierModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const createContact = useCreateContact();

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      const supplier = await createContact.mutateAsync({
        name,
        contact_type: 'supplier',
        phone,
        address,
      });
      onSave(supplier);
      setName(''); setPhone(''); setAddress('');
    } catch {
      // handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>إضافة مورد جديد</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>اسم المورد *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل اسم المورد" /></div>
          <div><Label>رقم الهاتف</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" /></div>
          <div><Label>العنوان</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!name.trim() || createContact.isPending}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
