import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Search, Edit, Users } from 'lucide-react';
import { mockInsuranceCustomers, mockInsuranceSales } from '@/data/mockData';
import { InsuranceCustomer } from '@/types';

export default function InsuranceCustomers() {
  const [searchQuery, setSearchQuery] = useState('');
  const [editCustomer, setEditCustomer] = useState<InsuranceCustomer | null>(null);
  const [editForm, setEditForm] = useState({ name: '', cardNumber: '', phone: '' });

  const filtered = mockInsuranceCustomers.filter(
    (c) => c.name.includes(searchQuery) || c.cardNumber.includes(searchQuery) || c.phone.includes(searchQuery)
  );

  const openEdit = (customer: InsuranceCustomer) => {
    setEditCustomer(customer);
    setEditForm({ name: customer.name, cardNumber: customer.cardNumber, phone: customer.phone });
  };

  const saveEdit = () => {
    if (!editCustomer) return;
    const idx = mockInsuranceCustomers.findIndex((c) => c.id === editCustomer.id);
    if (idx >= 0) {
      mockInsuranceCustomers[idx] = { ...mockInsuranceCustomers[idx], ...editForm };
    }
    setEditCustomer(null);
  };

  const getSalesCount = (customerId: string) =>
    mockInsuranceSales.filter((s) => s.customerId === customerId).length;

  const getTotalSpent = (customerId: string) =>
    mockInsuranceSales.filter((s) => s.customerId === customerId).reduce((sum, s) => sum + s.total, 0);

  return (
    <MainLayout title="عملاء التأمين">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">عملاء التأمين</h2>
              <p className="text-sm text-muted-foreground">{mockInsuranceCustomers.length} عميل</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="بحث بالاسم أو رقم البطاقة..." className="pr-9" />
        </div>

        <div className="rounded-xl bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">الاسم</TableHead>
                <TableHead className="text-right">رقم البطاقة</TableHead>
                <TableHead className="text-right">الهاتف</TableHead>
                <TableHead className="text-right">عدد العمليات</TableHead>
                <TableHead className="text-right">إجمالي المشتريات</TableHead>
                <TableHead className="text-right">تاريخ التسجيل</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell className="font-medium">{customer.name}</TableCell>
                  <TableCell>{customer.cardNumber || '—'}</TableCell>
                  <TableCell dir="ltr" className="text-right">{customer.phone || '—'}</TableCell>
                  <TableCell>{getSalesCount(customer.id)}</TableCell>
                  <TableCell className="tabular-nums">{getTotalSpent(customer.id).toFixed(2)} ر.س</TableCell>
                  <TableCell>{new Date(customer.createdAt).toLocaleDateString('ar-SA')}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <Dialog open={!!editCustomer} onOpenChange={() => setEditCustomer(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تعديل بيانات العميل</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>الاسم</Label>
              <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <Label>رقم البطاقة</Label>
              <Input value={editForm.cardNumber} onChange={(e) => setEditForm({ ...editForm, cardNumber: e.target.value })} />
            </div>
            <div>
              <Label>رقم الهاتف</Label>
              <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditCustomer(null)}>إلغاء</Button>
            <Button onClick={saveEdit}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
