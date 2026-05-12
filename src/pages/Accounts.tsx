import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Users, Truck, Shield, Loader2, Plus, Pill } from 'lucide-react';
import { Contact, InsuranceCustomer } from '@/types';
import { AccountDetailsDialog } from '@/components/accounts/AccountDetailsDialog';
import { DefaultMedicationsDialog } from '@/components/insurance/DefaultMedicationsDialog';
import { useContacts, useInsuranceCustomers, useInsuranceSales, useInvoices, useCreateContact, useCreateInsuranceCustomer } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export default function Accounts() {
  const { data: allContacts = [], isLoading: loadingContacts } = useContacts();
  const { data: insuranceCustomers = [], isLoading: loadingInsurance } = useInsuranceCustomers();
  const { data: insuranceSales = [] } = useInsuranceSales();
  const { data: allInvoices = [] } = useInvoices();
  const createContact = useCreateContact();
  const createInsuranceCustomer = useCreateInsuranceCustomer();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [selectedInsurance, setSelectedInsurance] = useState<InsuranceCustomer | null>(null);
  const [dialogType, setDialogType] = useState<'customer' | 'supplier' | 'insurance'>('customer');
  const [activeTab, setActiveTab] = useState('customers');
  const [medsCustomer, setMedsCustomer] = useState<InsuranceCustomer | null>(null);

  // Add contact/insurance dialog
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newForm, setNewForm] = useState({ name: '', phone: '', address: '', card_number: '' });

  const customers = allContacts.filter(c => c.contact_type === 'customer');
  const suppliers = allContacts.filter(c => c.contact_type === 'supplier');

  const filterContacts = (contacts: Contact[]) =>
    contacts.filter(c => {
      const matchesSearch = c.name.includes(searchQuery) || (c.phone || '').includes(searchQuery);
      if (!searchQuery && getContactBalance(c.id) === 0) return false;
      return matchesSearch;
    });

  const filterInsurance = () =>
    insuranceCustomers.filter(c => {
      const matchesSearch = c.name.includes(searchQuery) || (c.card_number || '').includes(searchQuery) || (c.phone || '').includes(searchQuery);
      if (!searchQuery && getInsuranceSalesTotal(c.id) === 0) return false;
      return matchesSearch;
    });

  const openContact = (contact: Contact, type: 'customer' | 'supplier') => {
    setSelectedContact(contact); setSelectedInsurance(null); setDialogType(type);
  };
  const openInsurance = (customer: InsuranceCustomer) => {
    setSelectedInsurance(customer); setSelectedContact(null); setDialogType('insurance');
  };

  const getInsuranceSalesTotal = (customerId: string) =>
    insuranceSales.filter(s => s.customer_id === customerId).reduce((sum, s) => sum + Number(s.total), 0);

  const getContactBalance = (contactId: string) => {
    const contactInvoices = allInvoices.filter(i => i.contact_id === contactId);
    const totalAmount = contactInvoices.reduce((sum, i) => sum + Number(i.total), 0);
    const totalPaid = contactInvoices.reduce((sum, i) => sum + Number(i.paid || 0), 0);
    return totalAmount - totalPaid;
  };

  const renderBalance = (balance: number) => (
    <span className={cn('tabular-nums font-medium', balance > 0 ? 'text-destructive' : balance < 0 ? 'text-success' : '')}>
      {balance.toFixed(2)} د.ل
    </span>
  );

  const handleAdd = async () => {
    if (!newForm.name.trim()) return;
    try {
      if (activeTab === 'insurance') {
        await createInsuranceCustomer.mutateAsync({
          name: newForm.name,
          phone: newForm.phone || undefined,
          card_number: newForm.card_number || undefined,
        });
      } else {
        await createContact.mutateAsync({
          name: newForm.name,
          contact_type: activeTab === 'customers' ? 'customer' : 'supplier',
          phone: newForm.phone || undefined,
          address: newForm.address || undefined,
        });
      }
      toast({ title: 'تم', description: 'تمت الإضافة بنجاح' });
      setShowAddDialog(false);
      setNewForm({ name: '', phone: '', address: '', card_number: '' });
    } catch {
      toast({ title: 'خطأ', description: 'فشلت الإضافة', variant: 'destructive' });
    }
  };

  const addLabel = activeTab === 'customers' ? 'زبون' : activeTab === 'suppliers' ? 'مورد' : 'عميل تأمين';

  if (loadingContacts || loadingInsurance) {
    return <MainLayout title="الحسابات"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  const ContactCards = ({ contacts, type }: { contacts: Contact[]; type: 'customer' | 'supplier' }) => (
    <div className="space-y-3 md:hidden">
      {contacts.map(c => (
        <div key={c.id} className="rounded-xl bg-card p-4 shadow-card cursor-pointer active:scale-[0.98] transition-transform" onClick={() => openContact(c, type)}>
          <div className="flex items-center justify-between">
            <p className="font-medium text-card-foreground">{c.name}</p>
            {renderBalance(getContactBalance(c.id))}
          </div>
          <div className="mt-1 text-sm text-muted-foreground flex gap-3">
            {c.phone && <span dir="ltr">{c.phone}</span>}
            {c.address && <span>{c.address}</span>}
          </div>
        </div>
      ))}
      {contacts.length === 0 && <p className="text-center py-8 text-muted-foreground">لا يوجد بيانات</p>}
    </div>
  );

  const InsuranceCards = () => {
    const list = filterInsurance();
    return (
      <div className="space-y-3 md:hidden">
        {list.map(c => (
          <div key={c.id} className="rounded-xl bg-card p-4 shadow-card">
            <div className="flex items-center justify-between">
              <p className="font-medium text-card-foreground cursor-pointer flex-1" onClick={() => openInsurance(c)}>{c.name}</p>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setMedsCustomer(c); }} title="العلاج الافتراضي">
                  <Pill className="h-4 w-4 text-primary" />
                </Button>
                <span className="tabular-nums font-medium" onClick={() => openInsurance(c)}>{getInsuranceSalesTotal(c.id).toFixed(2)} د.ل</span>
              </div>
            </div>
            <div className="mt-1 text-sm text-muted-foreground flex gap-3 cursor-pointer" onClick={() => openInsurance(c)}>
              {c.card_number && <span>{c.card_number}</span>}
              {c.phone && <span dir="ltr">{c.phone}</span>}
            </div>
          </div>
        ))}
        {list.length === 0 && <p className="text-center py-8 text-muted-foreground">لا يوجد عملاء تأمين</p>}
      </div>
    );
  };

  return (
    <MainLayout title="الحسابات">
      <div className="space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث بالاسم أو الهاتف..." className="pr-9" />
          </div>
          <Button onClick={() => setShowAddDialog(true)} size="sm"><Plus className="h-4 w-4 ml-1" /> إضافة {addLabel}</Button>
        </div>

        <Tabs defaultValue="customers" dir="rtl" onValueChange={setActiveTab}>
          <TabsList className="w-full max-w-md">
            <TabsTrigger value="customers" className="flex-1 gap-2"><Users className="h-4 w-4" /> الزبائن</TabsTrigger>
            <TabsTrigger value="suppliers" className="flex-1 gap-2"><Truck className="h-4 w-4" /> الموردين</TabsTrigger>
            <TabsTrigger value="insurance" className="flex-1 gap-2"><Shield className="h-4 w-4" /> عملاء التأمين</TabsTrigger>
          </TabsList>

          <TabsContent value="customers">
            <ContactCards contacts={filterContacts(customers)} type="customer" />
            <div className="hidden md:block rounded-xl bg-card shadow-card overflow-hidden">
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
                      <TableCell>{renderBalance(getContactBalance(c.id))}</TableCell>
                    </TableRow>
                  ))}
                  {filterContacts(customers).length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا يوجد زبائن</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="suppliers">
            <ContactCards contacts={filterContacts(suppliers)} type="supplier" />
            <div className="hidden md:block rounded-xl bg-card shadow-card overflow-hidden">
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
                      <TableCell>{renderBalance(getContactBalance(c.id))}</TableCell>
                    </TableRow>
                  ))}
                  {filterContacts(suppliers).length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا يوجد موردين</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="insurance">
            <InsuranceCards />
            <div className="hidden md:block rounded-xl bg-card shadow-card overflow-hidden">
              <Table>
                <TableHeader><TableRow>
                  <TableHead className="text-right">الاسم</TableHead><TableHead className="text-right">رقم البطاقة</TableHead><TableHead className="text-right">الهاتف</TableHead><TableHead className="text-right">إجمالي المبيعات</TableHead><TableHead className="text-right">إجراءات</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {filterInsurance().map(c => (
                    <TableRow key={c.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium" onClick={() => openInsurance(c)}>{c.name}</TableCell>
                      <TableCell onClick={() => openInsurance(c)}>{c.card_number || '—'}</TableCell>
                      <TableCell dir="ltr" className="text-right" onClick={() => openInsurance(c)}>{c.phone || '—'}</TableCell>
                      <TableCell className="tabular-nums font-medium" onClick={() => openInsurance(c)}>{getInsuranceSalesTotal(c.id).toFixed(2)} د.ل</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setMedsCustomer(c); }} title="العلاج الافتراضي">
                          <Pill className="h-4 w-4 text-primary" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filterInsurance().length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا يوجد عملاء تأمين</TableCell></TableRow>}
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

      {medsCustomer && (
        <DefaultMedicationsDialog
          isOpen={!!medsCustomer}
          onClose={() => setMedsCustomer(null)}
          customerId={medsCustomer.id}
          customerName={medsCustomer.name}
        />
      )}

      {/* Add Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>إضافة {addLabel} جديد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>الاسم *</Label><Input value={newForm.name} onChange={e => setNewForm({ ...newForm, name: e.target.value })} placeholder="أدخل الاسم" /></div>
            <div><Label>رقم الهاتف</Label><Input value={newForm.phone} onChange={e => setNewForm({ ...newForm, phone: e.target.value })} placeholder="05xxxxxxxx" /></div>
            {activeTab === 'insurance' ? (
              <div><Label>رقم البطاقة</Label><Input value={newForm.card_number} onChange={e => setNewForm({ ...newForm, card_number: e.target.value })} placeholder="رقم بطاقة التأمين" /></div>
            ) : (
              <div><Label>العنوان</Label><Input value={newForm.address} onChange={e => setNewForm({ ...newForm, address: e.target.value })} placeholder="العنوان" /></div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button onClick={handleAdd} disabled={!newForm.name.trim() || createContact.isPending || createInsuranceCustomer.isPending}>حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
