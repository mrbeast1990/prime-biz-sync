import { useState } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Wallet, TrendingUp, TrendingDown, ShoppingCart, Shield, Plus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { mockTreasuryEntries } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

export default function Treasury() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newEntry, setNewEntry] = useState({ type: 'deposit' as 'deposit' | 'withdrawal', description: '', amount: '' });

  const salesTotal = mockTreasuryEntries.filter(e => e.category === 'sales').reduce((s, e) => s + e.amount, 0);
  const insuranceTotal = mockTreasuryEntries.filter(e => e.category === 'insurance_sales').reduce((s, e) => s + e.amount, 0);
  const purchasesTotal = mockTreasuryEntries.filter(e => e.category === 'purchases').reduce((s, e) => s + e.amount, 0);
  const currentBalance = salesTotal + insuranceTotal - purchasesTotal - mockTreasuryEntries.filter(e => e.entry_type === 'withdrawal').reduce((s, e) => s + e.amount, 0);

  const handleAddEntry = () => {
    if (!newEntry.description || !newEntry.amount) {
      toast({ title: 'خطأ', description: 'أدخل جميع البيانات', variant: 'destructive' });
      return;
    }
    toast({ title: 'تم', description: 'تمت إضافة الحركة بنجاح' });
    setShowAddDialog(false);
    setNewEntry({ type: 'deposit', description: '', amount: '' });
  };

  return (
    <MainLayout title="الخزينة">
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-0 shadow-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10"><Wallet className="h-6 w-6 text-primary" /></div><div><p className="text-sm text-muted-foreground">الرصيد الحالي</p><p className="text-2xl font-bold text-foreground">{currentBalance.toFixed(2)} ر.س</p></div></div></CardContent></Card>
          <Card className="border-0 shadow-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success/10"><TrendingUp className="h-6 w-6 text-success" /></div><div><p className="text-sm text-muted-foreground">المبيعات النقدية</p><p className="text-2xl font-bold text-foreground">{salesTotal.toFixed(2)} ر.س</p></div></div></CardContent></Card>
          <Card className="border-0 shadow-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info/10"><Shield className="h-6 w-6 text-info" /></div><div><p className="text-sm text-muted-foreground">مبيعات التأمين</p><p className="text-2xl font-bold text-foreground">{insuranceTotal.toFixed(2)} ر.س</p></div></div></CardContent></Card>
          <Card className="border-0 shadow-card"><CardContent className="p-6"><div className="flex items-center gap-4"><div className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10"><TrendingDown className="h-6 w-6 text-destructive" /></div><div><p className="text-sm text-muted-foreground">المشتريات</p><p className="text-2xl font-bold text-foreground">{purchasesTotal.toFixed(2)} ر.س</p></div></div></CardContent></Card>
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
                {mockTreasuryEntries.map(entry => (
                  <TableRow key={entry.id}>
                    <TableCell>{new Date(entry.entry_date).toLocaleDateString('ar-SA')}</TableCell>
                    <TableCell>{entry.description}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1 text-sm ${entry.entry_type === 'income' || entry.entry_type === 'deposit' ? 'text-success' : 'text-destructive'}`}>
                        {entry.entry_type === 'income' || entry.entry_type === 'deposit' ? <ArrowUpCircle className="h-4 w-4" /> : <ArrowDownCircle className="h-4 w-4" />}
                        {entry.entry_type === 'income' ? 'دخول' : entry.entry_type === 'expense' ? 'خروج' : entry.entry_type === 'deposit' ? 'إيداع' : 'سحب'}
                      </span>
                    </TableCell>
                    <TableCell className="tabular-nums font-medium">{entry.amount.toFixed(2)} ر.س</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

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
            <Button onClick={handleAddEntry}>إضافة</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
