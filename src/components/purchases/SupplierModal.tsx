import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Contact } from '@/types';
import { useCreateContact, useUpdateContact } from '@/hooks/useSupabaseData';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (supplier: Contact) => void;
  initialSupplier?: Contact | null;
}

export function SupplierModal({ isOpen, onClose, onSave, initialSupplier }: SupplierModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isInsurance, setIsInsurance] = useState(false);
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();

  useEffect(() => {
    if (initialSupplier) {
      setName(initialSupplier.name || '');
      setPhone(initialSupplier.phone || '');
      setAddress(initialSupplier.address || '');
      setIsInsurance(!!initialSupplier.is_insurance);
    } else {
      setName(''); setPhone(''); setAddress(''); setIsInsurance(false);
    }
  }, [initialSupplier, isOpen]);

  const handleSave = async () => {
    if (!name.trim()) return;
    try {
      if (initialSupplier) {
        await updateContact.mutateAsync({ id: initialSupplier.id, name, phone, address, is_insurance: isInsurance });
        onSave({ ...initialSupplier, name, phone, address, is_insurance: isInsurance });
      } else {
        const supplier = await createContact.mutateAsync({
          name, contact_type: 'supplier', phone, address, is_insurance: isInsurance,
        });
        onSave(supplier as Contact);
      }
      setName(''); setPhone(''); setAddress(''); setIsInsurance(false);
    } catch {
      // handled by mutation
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader><DialogTitle>{initialSupplier ? 'تعديل بيانات المورد' : 'إضافة مورد جديد'}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>اسم المورد *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="أدخل اسم المورد" /></div>
          <div><Label>رقم الهاتف</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="05xxxxxxxx" /></div>
          <div><Label>العنوان</Label><Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="العنوان" /></div>
          <div className="flex items-center justify-between rounded-lg border border-border p-3">
            <div>
              <Label className="text-sm">شركة تأمين</Label>
              <p className="text-xs text-muted-foreground">يتم تمييزها بلون مختلف في القوائم</p>
            </div>
            <Switch checked={isInsurance} onCheckedChange={setIsInsurance} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button onClick={handleSave} disabled={!name.trim() || createContact.isPending || updateContact.isPending}>حفظ</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
