import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Contact, InsuranceCustomer } from '@/types';
import { Edit, FileText, Save, ChevronDown, CreditCard, Banknote, Wallet } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useInvoices, useInsuranceSales, useInvoiceItems, useInsuranceSaleItems, useUpdateInvoice } from '@/hooks/useSupabaseData';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface AccountDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: Contact | null;
  insuranceCustomer?: InsuranceCustomer | null;
  type: 'customer' | 'supplier' | 'insurance';
}

function TransactionItemsRow({ transactionId, type }: { transactionId: string; type: 'invoice' | 'insurance' }) {
  const { data: invoiceItems = [] } = useInvoiceItems(type === 'invoice' ? transactionId : undefined);
  const { data: insuranceItems = [] } = useInsuranceSaleItems(type === 'insurance' ? transactionId : undefined);
  const items = type === 'invoice' ? invoiceItems : insuranceItems;

  if (items.length === 0) return <p className="text-sm text-muted-foreground py-2 text-center">لا توجد تفاصيل أصناف</p>;

  return (
    <div className="rounded-md border bg-muted/30 overflow-hidden">
      <Table>
        <TableHeader><TableRow className="text-xs">
          <TableHead className="text-right py-1.5">الصنف</TableHead>
          <TableHead className="text-right py-1.5">الكمية</TableHead>
          <TableHead className="text-right py-1.5">السعر</TableHead>
          <TableHead className="text-right py-1.5">الإجمالي</TableHead>
        </TableRow></TableHeader>
        <TableBody>
          {items.map((item: any) => (
            <TableRow key={item.id} className="text-xs">
              <TableCell className="py-1.5">{item.product_name}</TableCell>
              <TableCell className="py-1.5 tabular-nums">{item.quantity}</TableCell>
              <TableCell className="py-1.5 tabular-nums">{Number(item.unit_price).toFixed(2)}</TableCell>
              <TableCell className="py-1.5 tabular-nums">{Number(item.total).toFixed(2)} د.ل</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function AccountDetailsDialog({ isOpen, onClose, contact, insuranceCustomer, type }: AccountDetailsDialogProps) {
  const { data: invoices = [] } = useInvoices();
  const { data: insuranceSales = [] } = useInsuranceSales();
  const updateInvoice = useUpdateInvoice();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', address: '', card_number: '' });
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  // Payment state for supplier invoices
  const [showPayment, setShowPayment] = useState(false);
  const [paymentInvoiceId, setPaymentInvoiceId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentDate, setPaymentDate] = useState(() => new Date().toISOString().slice(0, 10));

  const startEdit = () => {
    if (type === 'insurance' && insuranceCustomer) {
      setForm({ name: insuranceCustomer.name, phone: insuranceCustomer.phone || '', address: '', card_number: insuranceCustomer.card_number || '' });
    } else if (contact) {
      setForm({ name: contact.name, phone: contact.phone || '', address: contact.address || '', card_number: '' });
    }
    setEditing(true);
  };

  const saveEdit = () => {
    setEditing(false);
    toast({ title: 'تم الحفظ', description: 'تم تحديث البيانات بنجاح' });
  };

  const getName = () => type === 'insurance' ? insuranceCustomer?.name : contact?.name;

  const getTransactions = () => {
    if (type === 'insurance' && insuranceCustomer) return insuranceSales.filter(s => s.customer_id === insuranceCustomer.id);
    if (contact) return invoices.filter(i => i.contact_id === contact.id);
    return [];
  };

  const transactions = getTransactions();
  const totalAmount = transactions.reduce((sum, t) => sum + Number(t.total), 0);
  const totalPaid = transactions.reduce((sum, t) => sum + Number((t as any).paid || 0), 0);
  const totalRemaining = totalAmount - totalPaid;

  const toggleExpand = (id: string) => setExpandedId(prev => prev === id ? null : id);

  const openPayment = (invoiceId: string) => {
    setPaymentInvoiceId(invoiceId);
    setPaymentAmount('');
    setPaymentMethod('cash');
    setPaymentDate(new Date().toISOString().slice(0, 10));
    setShowPayment(true);
  };

  const handlePayment = async () => {
    if (!paymentInvoiceId || !paymentAmount) return;
    const invoice = transactions.find((t: any) => t.id === paymentInvoiceId) as any;
    if (!invoice) return;
    
    const amount = Number(paymentAmount);
    const currentPaid = Number(invoice.paid || 0);
    const total = Number(invoice.total);
    const newPaid = currentPaid + amount;
    
    if (newPaid > total) {
      toast({ title: 'خطأ', description: 'المبلغ المسدد أكبر من المتبقي', variant: 'destructive' });
      return;
    }

    try {
      await updateInvoice.mutateAsync({
        id: paymentInvoiceId,
        paid: newPaid,
        status: newPaid >= total ? 'completed' : 'pending',
        payment_method: paymentMethod,
      });
      toast({ title: 'تم السداد', description: `تم سداد ${amount.toFixed(2)} د.ل بنجاح` });
      setShowPayment(false);
      setPaymentInvoiceId(null);
    } catch {
      toast({ title: 'خطأ', description: 'فشل تسجيل السداد', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            تفاصيل حساب: {getName()}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="transactions" dir="rtl">
          <TabsList className="w-full">
            <TabsTrigger value="transactions" className="flex-1">الحركات</TabsTrigger>
            <TabsTrigger value="info" className="flex-1">البيانات</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions" className="space-y-4">
            <div className={cn("grid gap-4", type === 'supplier' ? "grid-cols-3" : "grid-cols-2")}>
              <div className="rounded-lg bg-primary/10 p-4 text-center">
                <p className="text-2xl font-bold text-primary">{transactions.length}</p>
                <p className="text-sm text-muted-foreground">عدد العمليات</p>
              </div>
              <div className="rounded-lg bg-success/10 p-4 text-center">
                <p className="text-2xl font-bold text-success">{totalAmount.toFixed(2)} د.ل</p>
                <p className="text-sm text-muted-foreground">الإجمالي</p>
              </div>
              {type === 'supplier' && (
                <div className="rounded-lg bg-destructive/10 p-4 text-center">
                  <p className="text-2xl font-bold text-destructive">{totalRemaining.toFixed(2)} د.ل</p>
                  <p className="text-sm text-muted-foreground">المتبقي</p>
                </div>
              )}
            </div>

            {transactions.length > 0 ? (
              <div className="space-y-2">
                {transactions.map((t: any) => {
                  const remaining = Number(t.total) - Number(t.paid || 0);
                  const isPaid = remaining <= 0;
                  return (
                    <div key={t.id} className="rounded-lg border overflow-hidden">
                      <button onClick={() => toggleExpand(t.id)}
                        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", expandedId === t.id && "rotate-180")} />
                          <span className="text-sm">{new Date(t.invoice_date || t.sale_date).toLocaleDateString('ar-SA')}</span>
                          {type === 'supplier' && (
                            <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                              isPaid ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning')}>
                              {isPaid ? 'مسددة' : `متبقي ${remaining.toFixed(2)} د.ل`}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="tabular-nums font-medium text-sm">{Number(t.total).toFixed(2)} د.ل</span>
                          {type === 'supplier' && !isPaid && (
                            <Button variant="outline" size="sm" className="h-7 text-xs gap-1"
                              onClick={(e) => { e.stopPropagation(); openPayment(t.id); }}>
                              <Wallet className="h-3 w-3" /> سداد
                            </Button>
                          )}
                        </div>
                      </button>
                      {expandedId === t.id && (
                        <div className="px-3 pb-3">
                          <TransactionItemsRow transactionId={t.id} type={type === 'insurance' ? 'insurance' : 'invoice'} />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">لا توجد حركات مسجلة</p>
            )}
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            {!editing ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">الاسم</span><span className="font-medium">{getName()}</span>
                </div>
                <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                  <span className="text-muted-foreground">الهاتف</span><span dir="ltr">{type === 'insurance' ? insuranceCustomer?.phone : contact?.phone}</span>
                </div>
                {type !== 'insurance' && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">العنوان</span><span>{contact?.address || '—'}</span>
                  </div>
                )}
                {type === 'insurance' && (
                  <div className="flex justify-between items-center p-3 rounded-lg bg-muted/50">
                    <span className="text-muted-foreground">رقم البطاقة</span><span>{insuranceCustomer?.card_number || '—'}</span>
                  </div>
                )}
                <Button variant="outline" onClick={startEdit} className="w-full"><Edit className="h-4 w-4 ml-2" /> تعديل البيانات</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div><Label>الاسم</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></div>
                <div><Label>الهاتف</Label><Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                {type !== 'insurance' && <div><Label>العنوان</Label><Input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} /></div>}
                {type === 'insurance' && <div><Label>رقم البطاقة</Label><Input value={form.card_number} onChange={e => setForm({ ...form, card_number: e.target.value })} /></div>}
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setEditing(false)} className="flex-1">إلغاء</Button>
                  <Button onClick={saveEdit} className="flex-1"><Save className="h-4 w-4 ml-2" /> حفظ</Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>

      {/* Payment Dialog */}
      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>تسجيل سداد</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>المبلغ المسدد</Label>
              <Input type="number" min="0" step="0.01" value={paymentAmount}
                onChange={e => setPaymentAmount(e.target.value)} placeholder="0.00" />
            </div>
            <div>
              <Label>طريقة السداد</Label>
              <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">نقدي</SelectItem>
                  <SelectItem value="card">بطاقة</SelectItem>
                  <SelectItem value="transfer">تحويل بنكي</SelectItem>
                  <SelectItem value="check">شيك</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>تاريخ السداد</Label>
              <Input type="date" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayment(false)}>إلغاء</Button>
            <Button onClick={handlePayment} disabled={updateInvoice.isPending || !paymentAmount}>
              <Wallet className="h-4 w-4 ml-1" /> تأكيد السداد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
