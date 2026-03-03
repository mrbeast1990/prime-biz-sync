import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Eye, Edit, FileDown, FileText, Save, Loader2, ChevronDown, ShoppingCart, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';
import { useInvoices, useInvoiceItems, useUpdateInvoiceItem, useProfiles } from '@/hooks/useSupabaseData';
import { exportToCSV, exportToPrintPDF } from '@/utils/exportUtils';

const paymentLabels: Record<string, string> = {
  cash: 'نقدي', card: 'بطاقة', credit: 'آجل', damage: 'إتلاف',
};
const typeLabels: Record<string, string> = {
  sale: 'بيع', return: 'استرجاع', damage: 'إتلاف',
};

export default function Sales() {
  const { data: allInvoices = [], isLoading } = useInvoices();
  const { data: profiles = [] } = useProfiles();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewInvoiceId, setViewInvoiceId] = useState<string | null>(null);
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));

  const salesInvoices = allInvoices.filter(i => ['sale', 'return', 'damage'].includes(i.invoice_type));
  
  const dateFiltered = salesInvoices.filter(inv => inv.invoice_date === selectedDate);
  
  const filtered = dateFiltered.filter(inv =>
    (inv.invoice_number || '').includes(searchQuery) ||
    (inv.contact_name || '').includes(searchQuery) ||
    (inv.payment_method || '').includes(searchQuery)
  );

  const navigateDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const isToday = selectedDate === new Date().toISOString().slice(0, 10);

  const getSellerName = (userId: string | null) => {
    if (!userId) return '—';
    const profile = profiles.find((p: any) => p.user_id === userId);
    return profile?.display_name || '—';
  };

  const handleExportCSV = () => {
    exportToCSV(filtered.map(inv => ({
      'رقم الفاتورة': inv.invoice_number || '—',
      'التاريخ': new Date(inv.invoice_date).toLocaleDateString('en-GB'),
      'نوع العملية': typeLabels[inv.invoice_type] || inv.invoice_type,
      'طريقة الدفع': paymentLabels[inv.payment_method || ''] || inv.payment_method,
      'الإجمالي': Number(inv.total).toFixed(2),
      'البائع': getSellerName(inv.created_by),
    })), 'سجل_المبيعات');
    toast({ title: 'تم التصدير' });
  };

  if (isLoading) {
    return <MainLayout title="المبيعات"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="المبيعات">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateDate(-1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="w-[160px] text-center" />
            <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => navigateDate(1)} disabled={isToday}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {!isToday && <Button variant="ghost" size="sm" onClick={() => setSelectedDate(new Date().toISOString().slice(0, 10))}>اليوم</Button>}
          </div>
          <div className="relative max-w-sm flex-1">
            <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="بحث برقم الفاتورة أو الاسم..." className="pr-9" />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportCSV}><FileDown className="h-4 w-4 ml-1" /> Excel</Button>
            <Button variant="outline" size="sm" onClick={() => exportToPrintPDF('سجل المبيعات', 'sales-table')}><FileText className="h-4 w-4 ml-1" /> PDF</Button>
          </div>
        </div>

        <div className="rounded-xl bg-card shadow-card overflow-hidden">
          <Table id="sales-table">
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">رقم الفاتورة</TableHead>
                <TableHead className="text-right">التاريخ</TableHead>
                <TableHead className="text-right">نوع العملية</TableHead>
                <TableHead className="text-right">طريقة الدفع</TableHead>
                <TableHead className="text-right">الزبون</TableHead>
                <TableHead className="text-right">الإجمالي</TableHead>
                <TableHead className="text-right">البائع</TableHead>
                <TableHead className="text-right">إجراءات</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(inv => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.invoice_number || '—'}</TableCell>
                  <TableCell>{new Date(inv.invoice_date).toLocaleDateString('en-GB')}</TableCell>
                  <TableCell>
                    <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      inv.invoice_type === 'sale' ? 'bg-success/10 text-success' :
                      inv.invoice_type === 'return' ? 'bg-warning/10 text-warning' : 'bg-destructive/10 text-destructive'
                    )}>
                      {typeLabels[inv.invoice_type] || inv.invoice_type}
                    </span>
                  </TableCell>
                  <TableCell>{paymentLabels[inv.payment_method || ''] || inv.payment_method}</TableCell>
                  <TableCell>{inv.contact_name || '—'}</TableCell>
                  <TableCell className="tabular-nums font-medium">{Number(inv.total).toFixed(2)} د.ل</TableCell>
                  <TableCell>{getSellerName(inv.created_by)}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewInvoiceId(inv.id)}><Eye className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditInvoiceId(inv.id)}><Edit className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">لا توجد عمليات بيع</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </div>

      <InvoiceViewDialog invoiceId={viewInvoiceId} onClose={() => setViewInvoiceId(null)} />
      <InvoiceEditDialog invoiceId={editInvoiceId} onClose={() => setEditInvoiceId(null)} />
    </MainLayout>
  );
}

function InvoiceViewDialog({ invoiceId, onClose }: { invoiceId: string | null; onClose: () => void }) {
  const { data: items = [] } = useInvoiceItems(invoiceId || undefined);
  return (
    <Dialog open={!!invoiceId} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>تفاصيل الفاتورة</DialogTitle></DialogHeader>
        <Table>
          <TableHeader><TableRow>
            <TableHead className="text-right">الصنف</TableHead>
            <TableHead className="text-right">الكمية</TableHead>
            <TableHead className="text-right">السعر</TableHead>
            <TableHead className="text-right">الإجمالي</TableHead>
          </TableRow></TableHeader>
          <TableBody>
            {items.map((item: any) => (
              <TableRow key={item.id}>
                <TableCell>{item.product_name}</TableCell>
                <TableCell className="tabular-nums">{item.quantity}</TableCell>
                <TableCell className="tabular-nums">{Number(item.unit_price).toFixed(2)}</TableCell>
                <TableCell className="tabular-nums font-medium">{Number(item.total).toFixed(2)} د.ل</TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-4 text-muted-foreground">لا توجد أصناف</TableCell></TableRow>}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}

function InvoiceEditDialog({ invoiceId, onClose }: { invoiceId: string | null; onClose: () => void }) {
  const { data: items = [] } = useInvoiceItems(invoiceId || undefined);
  const updateItem = useUpdateInvoiceItem();
  const [editedItems, setEditedItems] = useState<Record<string, { quantity: number; unit_price: number }>>({});

  const getItemValue = (item: any, field: 'quantity' | 'unit_price') => editedItems[item.id]?.[field] ?? item[field];

  const handleChange = (itemId: string, field: 'quantity' | 'unit_price', value: number) => {
    setEditedItems(prev => ({ ...prev, [itemId]: { quantity: prev[itemId]?.quantity ?? 0, unit_price: prev[itemId]?.unit_price ?? 0, [field]: value } }));
  };

  const handleSave = async () => {
    try {
      for (const [id, data] of Object.entries(editedItems)) {
        await updateItem.mutateAsync({ id, quantity: data.quantity, unit_price: data.unit_price, total: data.quantity * data.unit_price });
      }
      toast({ title: 'تم الحفظ', description: 'تم تعديل الفاتورة بنجاح' });
      setEditedItems({});
      onClose();
    } catch {
      toast({ title: 'خطأ', description: 'فشل تعديل الفاتورة', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={!!invoiceId} onOpenChange={() => { setEditedItems({}); onClose(); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader><DialogTitle>تعديل الفاتورة</DialogTitle></DialogHeader>
        <div className="space-y-3">
          {items.map((item: any) => (
            <div key={item.id} className="rounded-lg bg-muted/50 p-3">
              <p className="font-medium text-sm mb-2">{item.product_name}</p>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">الكمية</Label><Input type="number" value={getItemValue(item, 'quantity')} onChange={e => handleChange(item.id, 'quantity', Math.max(1, +e.target.value))} className="h-8 text-sm" /></div>
                <div><Label className="text-xs">السعر</Label><Input type="number" value={getItemValue(item, 'unit_price')} onChange={e => handleChange(item.id, 'unit_price', Math.max(0, +e.target.value))} className="h-8 text-sm" /></div>
              </div>
            </div>
          ))}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setEditedItems({}); onClose(); }}>إلغاء</Button>
          <Button onClick={handleSave} disabled={updateItem.isPending}><Save className="h-4 w-4 ml-1" /> حفظ التعديلات</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
