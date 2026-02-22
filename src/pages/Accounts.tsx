import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Users, Truck, Shield, Loader2 } from 'lucide-react';
import { Contact, InsuranceCustomer } from '@/types';
import { AccountDetailsDialog } from '@/components/accounts/AccountDetailsDialog';
import { useContacts, useInsuranceCustomers, useInsuranceSales } from '@/hooks/useSupabaseData';

export default function Accounts() {
  const { data: allContacts = [], isLoading: loadingContacts } = useContacts();
  const { data: insuranceCustomers = [], isLoading: loadingInsurance } = useInsuranceCustomers();
  const { data: insuranceSales = [] } = useInsuranceSales();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceCustomer | null>(null);
  const [dialogType, setDialogType] = useState<'customer' | 'supplier' | 'insurance'>('customer');

  const customers = allContacts.filter(c => c.contact_type === 'customer');
  const suppliers = allContacts.filter(c => c.contact_type === 'supplier');

  const filterContacts = (contacts: Contact[]) =>
    contacts.filter(c => c.name.includes(searchQuery) || (c.phone || '').includes(searchQuery));

  const filterInsurance = () =>
    insuranceCustomers.filter(c => c.name.includes(searchQuery) || (c.card_number || '').includes(searchQuery) || (c.phone || '').includes(searchQuery));

  const openContact = (contact: Contact, type: 'customer' | 'supplier') => {
    setSelectedContact(contact); setSelectedInsurance(null); setDialogType(type);
  };
  const openInsurance = (customer: InsuranceCustomer) => {
    setSelectedInsurance(customer); setSelectedContact(null); setDialogType('insurance');
  };

  const getInsuranceSalesTotal = (customerId: string) =>
    insuranceSales.filter(s => s.customer_id === customerId).reduce((sum, s) => sum + Number(s.total), 0);

  if (loadingContacts || loadingInsurance) {
    return <MainLayout title="الحسابات"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="الحسابات">
      <div className="space-y-6">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className="pr-9" />
        </div>

        <Tabs defaultValue="customers" dir="rtl">
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="customers" className="flex-1 gap-2"><Users className="h-4 w-4" /> الزبائن</TabsTrigger>
            <TabsTrigger value="suppliers" className="flex-1 gap-2"><Truck className="h-4 w-4" /> الموردين</TabsTrigger>
            <TabsTrigger value="insurance" className="flex-1 gap-2"><Shield className="h-4 w-4" /> عملاء التأمين</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <div className="rounded-xl bg-card shadow-card overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-right">الاسم</TableHead><TableHead className="text-right">الهاتف</TableHead><TableHead className="text-right">العنوان</TableHead><TableHead className="text-right">الرصيد</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filterContacts(customers).map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openContact(c, 'customer')}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell dir="ltr" className="text-right">{c.phone}</TableCell>
                      <TableCell>{c.address}</TableCell>
                      <TableCell className="tabular-nums font-medium">{Number(c.balance).toFixed(2)} ر.س</TableCell>
                    </TableRow>
                  ))}
                  {filterContacts(customers).length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا يوجد زبائن</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="suppliers">
            <div className="rounded-xl bg-card shadow-card overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-right">الاسم</TableHead><TableHead className="text-right">الهاتف</TableHead><TableHead className="text-right">العنوان</TableHead><TableHead className="text-right">الرصيد</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filterContacts(suppliers).map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openContact(c, 'supplier')}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell dir="ltr" className="text-right">{c.phone}</TableCell>
                      <TableCell>{c.address}</TableCell>
                      <TableCell className="tabular-nums font-medium">{Number(c.balance).toFixed(2)} ر.س</TableCell>
                    </TableRow>
                  ))}
                  {filterContacts(suppliers).length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا يوجد موردين</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="insurance">
            <div className="rounded-xl bg-card shadow-card overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-right">الاسم</TableHead><TableHead className="text-right">رقم البطاقة</TableHead><TableHead className="text-right">الهاتف</TableHead><TableHead className="text-right">إجمالي المبيعات</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filterInsurance().map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50" onClick={() => openInsurance(c)}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell>{c.card_number || '—'}</TableCell>
                      <TableCell dir="ltr" className="text-right">{c.phone || '—'}</TableCell>
                      <TableCell className="tabular-nums font-medium">{getInsuranceSalesTotal(c.id).toFixed(2)} ر.س</TableCell>
                    </TableRow>
                  ))}
                  {filterInsurance().length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا يوجد عملاء تأمين</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AccountDetailsDialog
        isOpen={!!(selectedContact || selectedInsurance)}
        onClose={() => { setSelectedContact(null); setSelectedInsurance(null); }}
        contact={selectedContact}
        insuranceCustomer={selectedInsurance}
        type={dialogType}
      />
    </MainLayout>
  );
}
