import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Wallet, TrendingUp, TrendingDown, Plus, ArrowUpCircle, ArrowDownCircle, Loader2, Users, FileDown, FileText, Save, Edit } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useTreasuryEntries, useCreateTreasuryEntry, useInvoices, useProfiles, useInvoiceItems, useUpdateInvoiceItem } from '@/hooks/useSupabaseData';
import { cn } from '@/lib/utils';
import { exportToCSV, exportToPrintPDF } from '@/utils/exportUtils';

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB');
const fmtNum = (n: number) => n.toFixed(2);

export default function Treasury() {
  const { data: entries = [], isLoading } = useTreasuryEntries();
  const { data: allInvoices = [] } = useInvoices();
  const { data: profiles = [] } = useProfiles();
  const createEntry = useCreateTreasuryEntry();
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: 'deposit' as 'deposit' | 'withdrawal', description: '', amount: '' });
  const [selectedSeller, setSelectedSeller] = useState<string | null>(null);
  const [sellerView, setSellerView] = useState<'summary' | 'detail'>('summary');
  const [editInvoiceId, setEditInvoiceId] = useState<string | null>(null);

  const salesTotal = entries.filter(e => e.category === 'sales').reduce((s, e) => s + Number(e.amount), 0);
  const purchasesTotal = entries.filter(e => e.category === 'purchases').reduce((s, e) => s + Number(e.amount), 0);
  const withdrawals = entries.filter(e => e.entry_type === 'withdrawal').reduce((s, e) => s + Number(e.amount), 0);
  const deposits = entries.filter(e => e.entry_type === 'deposit' || e.entry_type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const currentBalance = deposits + salesTotal - purchasesTotal - withdrawals;

  const handleAddEntry = async () => {
    if (!newEntry.description || !newEntry.amount) {
      toast({ title: 'خطأ', description: 'أدخل جميع البيانات', variant: 'destructive' });
      return;
    }
    try {
      await createEntry.mutateAsync({
        entry_type: newEntry.type,
        description: newEntry.description,
        amount: Number(newEntry.amount),
        category: 'manual',
      });
      toast({ title: 'تم', description: 'تمت إضافة الحركة بنجاح' });
      setShowAddDialog(false);
      setNewEntry({ type: 'deposit', description: '', amount: '' });
    } catch {
      toast({ title: 'خطأ', description: 'فشل إضافة الحركة', variant: 'destructive' });
    }
  };

  const getSellerInvoices = (userId: string) => {
    return allInvoices.filter(i => i.created_by === userId && ['sale', 'return', 'damage', 'purchase'].includes(i.invoice_type));
  };

  const getSellerStats = (userId: string) => {
    const invoices = getSellerInvoices(userId);
    const sales = invoices.filter(i => i.invoice_type === 'sale').reduce((s, i) => s + Number(i.total), 0);
    const purchases = invoices.filter(i => i.invoice_type === 'purchase').reduce((s, i) => s + Number(i.total), 0);
    const count = invoices.length;
    return { sales, purchases, count, net: sales - purchases };
  };

  if (isLoading) {
    return <MainLayout title="الخزينة"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="الخزينة">
      <Tabs defaultValue="general" dir="rtl">
        <TabsList className="mb-4">
          <TabsTrigger value="general" className="gap-2"><Wallet className="h-4 w-4" /> الخزينة العامة</TabsTrigger>
          <TabsTrigger value="sellers" className="gap-2"><Users className="h-4 w-4" /> خزائن البائعين</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-0 shadow-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Wallet className="h-6 w-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">الرصيد الحالي</p><p className="text-2xl font-bold text-foreground tabular-nums">{fmtNum(currentBalance)} د.ل</p></div></div></CardContent></Card>
              <Card className="border-0 shadow-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10"><TrendingUp className="h-6 w-6 text-success" /></div><div><p className="text-sm text-muted-foreground">المبيعات النقدية</p><p className="text-2xl font-bold text-foreground tabular-nums">{fmtNum(salesTotal)} د.ل</p></div></div></CardContent></Card>
              <Card className="border-0 shadow-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10"><TrendingDown className="h-6 w-6 text-destructive" /></div><div><p className="text-sm text-muted-foreground">المشتريات</p><p className="text-2xl font-bold text-foreground tabular-nums">{fmtNum(purchasesTotal)} د.ل</p></div></div></CardContent></Card>
            </div>

            <Card className="border-0 shadow-card">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>سجل الحركات المالية</CardTitle>
                <Button onClick={() => setShowAddDialog(true)} size="sm"><Plus className="h-4 w-4 ml-2" /> إضافة حركة</Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow>
                    <TableHead className="text-right">التاريخ</TableHead><TableHead className="text-right">الوصف</TableHead><TableHead className="text-right">النوع</TableHead><TableHead className="text-right">المبلغ</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {entries.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="tabular-nums">{fmtDate(entry.entry_date)}</TableCell>
                        <TableCell>{entry.description}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center gap-1 text-sm ${entry.entry_type === 'income' || entry.entry_type === 'deposit' ? 'text-success' : 'text-destructive'}`}>
                            {entry.entry_type === 'income' || entry.entry_type === 'deposit' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                            {entry.entry_type === 'income' ? 'دخول' : entry.entry_type === 'expense' ? 'خروج' : entry.entry_type === 'deposit' ? 'إيداع' : 'سحب'}
                          </span>
                        </TableCell>
                        <TableCell className="tabular-nums font-medium">{fmtNum(Number(entry.amount))} د.ل</TableCell>
                      </TableRow>
                    ))}
                    {entries.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">لا توجد حركات</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sellers">
          <div className="space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <h3 className="text-lg font-semibold">خزائن البائعين</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => {
                  const data = profiles.map((p: any) => {
                    const stats = getSellerStats(p.user_id);
                    return { 'البائع': p.display_name, 'عدد العمليات': stats.count, 'المبيعات': fmtNum(stats.sales), 'المشتريات': fmtNum(stats.purchases), 'الصافي': fmtNum(stats.net) };
                  });
                  exportToCSV(data, 'خزائن_البائعين');
                }}><FileDown className="h-4 w-4 ml-1" /> Excel</Button>
                <Button variant="outline" size="sm" onClick={() => exportToPrintPDF('خزائن البائعين', 'sellers-table')}><FileText className="h-4 w-4 ml-1" /> PDF</Button>
              </div>
            </div>
            
            {!selectedSeller ? (
              <div className="rounded-xl bg-card shadow-card overflow-hidden">
                <Table id="sellers-table">
                  <TableHeader><TableRow>
                    <TableHead className="text-right">البائع</TableHead>
                    <TableHead className="text-right">عدد العمليات</TableHead>
                    <TableHead className="text-right">إجمالي المبيعات</TableHead>
                    <TableHead className="text-right">إجمالي المشتريات</TableHead>
                    <TableHead className="text-right">الصافي</TableHead>
                    <TableHead className="text-right">إجراءات</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {profiles.map((p: any) => {
                      const stats = getSellerStats(p.user_id);
                      return (
                        <TableRow key={p.id}>
                          <TableCell className="font-medium">{p.display_name || '—'}</TableCell>
                          <TableCell className="tabular-nums">{stats.count}</TableCell>
                          <TableCell className="tabular-nums text-success">{fmtNum(stats.sales)} د.ل</TableCell>
                          <TableCell className="tabular-nums text-destructive">{fmtNum(stats.purchases)} د.ل</TableCell>
                          <TableCell className={cn('tabular-nums font-bold', stats.net >= 0 ? 'text-success' : 'text-destructive')}>{fmtNum(stats.net)} د.ل</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="outline" size="sm" onClick={() => { setSelectedSeller(p.user_id); setSellerView('summary'); }}>كشف إجمالي</Button>
                              <Button variant="outline" size="sm" onClick={() => { setSelectedSeller(p.user_id); setSellerView('detail'); }}>كشف تفصيلي</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {profiles.length === 0 && <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">لا يوجد بائعين</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <SellerDetail
                userId={selectedSeller}
                profiles={profiles}
                invoices={allInvoices}
                view={sellerView}
                onBack={() => setSelectedSeller(null)}
                onEdit={(id) => setEditInvoiceId(id)}
              />
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>إضافة حركة مالية</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>النوع</Label><Select value={newEntry.type} onValueChange={(v: 'deposit' | 'withdrawal') => setNewEntry({ ...newEntry, type: v })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="deposit">إيداع</SelectItem><SelectItem value="withdrawal">سحب</SelectItem></SelectContent></Select></div>
            <div><Label>الوصف</Label><Input value={newEntry.description} onChange={e => setNewEntry({ ...newEntry, description: e.target.value })} placeholder="وصف الحركة..." /></div>
            <div><Label>المبلغ</Label><Input type="number" value={newEntry.amount} onChange={e => setNewEntry({ ...newEntry, amount: e.target.value })} placeholder="0.00" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>إلغاء</Button>
            <Button onClick={handleAddEntry} disabled={createEntry.isPending}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <InvoiceEditDialog invoiceId={editInvoiceId} onClose={() => setEditInvoiceId(null)} />
    </MainLayout>
  );
}

function SellerDetail({ userId, profiles, invoices, view, onBack, onEdit }: {
  userId: string;
  profiles: any[];
  invoices: any[];
  view: 'summary' | 'detail';
  onBack: () => void;
  onEdit: (id: string) => void;
}) {
  const profile = profiles.find((p: any) => p.user_id === userId);
  const allSellerInvoices = invoices.filter((i: any) => i.created_by === userId && ['sale', 'return', 'damage', 'purchase'].includes(i.invoice_type));
  
  const today = new Date().toISOString().slice(0, 10);
  const monthStart = today.slice(0, 8) + '01';
  const [dateFrom, setDateFrom] = useState(monthStart);
  const [dateTo, setDateTo] = useState(today);
  
  const sellerInvoices = view === 'detail' 
    ? allSellerInvoices.filter((i: any) => i.invoice_date >= dateFrom && i.invoice_date <= dateTo)
    : allSellerInvoices;
  const sales = sellerInvoices.filter((i: any) => i.invoice_type === 'sale');
  const purchases = sellerInvoices.filter((i: any) => i.invoice_type === 'purchase');
  const salesTotal = sales.reduce((s: number, i: any) => s + Number(i.total), 0);
  const purchasesTotal = purchases.reduce((s: number, i: any) => s + Number(i.total), 0);

  const typeLabels: Record<string, string> = { sale: 'بيع', return: 'استرجاع', damage: 'إتلاف', purchase: 'شراء' };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">{view === 'summary' ? 'كشف إجمالي' : 'كشف تفصيلي'} - {profile?.display_name || '—'}</h3>
        <Button variant="outline" onClick={onBack}>رجوع</Button>
      </div>

      {view === 'summary' ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <Card className="border-0 shadow-card"><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-primary tabular-nums">{sellerInvoices.length}</p><p className="text-sm text-muted-foreground mt-1">عدد العمليات</p></CardContent></Card>
          <Card className="border-0 shadow-card"><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-success tabular-nums">{fmtNum(salesTotal)} د.ل</p><p className="text-sm text-muted-foreground mt-1">إجمالي المبيعات</p></CardContent></Card>
          <Card className="border-0 shadow-card"><CardContent className="p-6 text-center"><p className="text-3xl font-bold text-destructive tabular-nums">{fmtNum(purchasesTotal)} د.ل</p><p className="text-sm text-muted-foreground mt-1">إجمالي المشتريات</p></CardContent></Card>
        </div>
      ) : (
        <div className="rounded-xl bg-card shadow-card overflow-hidden">
          <div className="p-3 flex items-center gap-3 flex-wrap border-b">
            <Label className="text-sm">من:</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-[150px] h-8 text-sm" />
            <Label className="text-sm">إلى:</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-[150px] h-8 text-sm" />
            <div className="flex-1" />
            <Button variant="outline" size="sm" onClick={() => {
              exportToCSV(sellerInvoices.map((inv: any) => ({
                'رقم الفاتورة': inv.invoice_number || '—',
                'التاريخ': fmtDate(inv.invoice_date),
                'النوع': typeLabels[inv.invoice_type] || inv.invoice_type,
                'الإجمالي': fmtNum(Number(inv.total)),
              })), `كشف_${profile?.display_name}`);
            }}><FileDown className="h-4 w-4 ml-1" /> Excel</Button>
          </div>
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-right">رقم الفاتورة</TableHead>
              <TableHead className="text-right">التاريخ</TableHead>
              <TableHead className="text-right">النوع</TableHead>
              <TableHead className="text-right">الإجمالي</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {sellerInvoices.map((inv: any) => (
                <TableRow key={inv.id}>
                  <TableCell className="font-mono text-sm">{inv.invoice_number || '—'}</TableCell>
                  <TableCell className="tabular-nums">{fmtDate(inv.invoice_date)}</TableCell>
                  <TableCell>
                    <span className={cn('inline-block rounded-full px-2 py-0.5 text-xs font-medium',
                      inv.invoice_type === 'sale' ? 'bg-success/10 text-success' :
                      inv.invoice_type === 'purchase' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                    )}>
                      {typeLabels[inv.invoice_type] || inv.invoice_type}
                    </span>
                  </TableCell>
                  <TableCell className="tabular-nums font-medium">{fmtNum(Number(inv.total))} د.ل</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(inv.id)}><Edit className="h-3.5 w-3.5" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {sellerInvoices.length === 0 && <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">لا توجد عمليات</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
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
