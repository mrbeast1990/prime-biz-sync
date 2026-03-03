import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Edit, Users, Loader2 } from 'lucide-react';
import { InsuranceCustomer } from '@/types';
import { useInsuranceCustomers, useInsuranceSales, useUpdateInsuranceCustomer } from '@/hooks/useSupabaseData';

export default function InsuranceCustomers() {
  const { data: customers = [], isLoading } = useInsuranceCustomers();
  const { data: sales = [] } = useInsuranceSales();
  const updateCustomer = useUpdateInsuranceCustomer();

  const [searchQuery, setSearchQuery] = useState('');
  const [editCustomer, setEditCustomer] = useState<InsuranceCustomer | null>(null);
  const [editForm, setEditForm] = useState({ name: '', card_number: '', phone: '' });

  const filtered = customers.filter(
    (c) => c.name.includes(searchQuery) || (c.card_number || '').includes(searchQuery) || (c.phone || '').includes(searchQuery)
  );

  const openEdit = (customer: InsuranceCustomer) => {
    setEditCustomer(customer);
    setEditForm({ name: customer.name, card_number: customer.card_number || '', phone: customer.phone || '' });
  };

  const saveEdit = async () => {
    if (!editCustomer) return;
    try {
      await updateCustomer.mutateAsync({ id: editCustomer.id, ...editForm });
      setEditCustomer(null);
    } catch {
      // error handled by mutation
    }
  };

  const getSalesCount = (customerId: string) => sales.filter((s) => s.customer_id === customerId).length;
  const getTotalSpent = (customerId: string) => sales.filter((s) => s.customer_id === customerId).reduce((sum, s) => sum + Number(s.total), 0);

  if (isLoading) {
    return <MainLayout title="عملاء التأمين"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="عملاء التأمين">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
            <div><h2 className="text-xl font-bold text-foreground">عملاء التأمين</h2><p className="text-sm text-muted-foreground">{customers.length} عميل</p></div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بالاسم أو رقم البطاقة..." className="pr-9" />
        </div>

        <div className="rounded-xl bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-right">الاسم</TableHead><TableHead className="text-right">رقم البطاقة</TableHead><TableHead className="text-right">الهاتف</TableHead>
              <TableHead className="text-right">عدد العمليات</TableHead><TableHead className="text-right">إجمالي المبيعات</TableHead><TableHead className="text-right">تاريخ التسجيل</TableHead><TableHead className="text-right">إجراءات</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.card_number || '—'}</TableCell>
                  <TableCell dir="ltr" className="text-right">{customer.phone || '—'}</TableCell>
                  <TableCell>{getSalesCount(customer.id)}</TableCell>
                  <TableCell className="tabular-nums">{getTotalSpent(customer.id).toFixed(2)} د.ل</TableCell>
                  <TableCell>{new Date(customer.created_at).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell><Button variant="ghost" size="icon" onClick={() => openEdit(customer)}><Edit className="h-4 w-4" /></Button></TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">لا يوجد عملاء</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!editCustomer} onOpenChange={() => setEditCustomer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>تعديل بيانات العميل</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>الاسم</Label><Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} /></div>
            <div><Label>رقم البطاقة</Label><Input value={editForm.card_number} onChange={(e) => setEditForm({ ...editForm, card_number: e.target.value })} /></div>
            <div><Label>رقم الهاتف</Label><Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomer(null)}>إلغاء</Button>
            <Button onClick={saveEdit} disabled={updateCustomer.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
