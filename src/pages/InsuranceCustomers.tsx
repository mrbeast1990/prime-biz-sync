import { useState, useMemo } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Search, Edit, Users, Loader2, Pill, CalendarClock, TrendingUp, ShoppingBag } from 'lucide-react';
import { InsuranceCustomer } from '@/types';
import { useInsuranceCustomers, useInsuranceSales, useUpdateInsuranceCustomer } from '@/hooks/useSupabaseData';
import { DefaultMedicationsDialog } from '@/components/insurance/DefaultMedicationsDialog';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

export default function InsuranceCustomers() {
  const { data: customers = [], isLoading } = useInsuranceCustomers();
  const { data: sales = [] } = useInsuranceSales();
  const updateCustomer = useUpdateInsuranceCustomer();

  const [searchQuery, setSearchQuery] = useState('');
  const [editCustomer, setEditCustomer] = useState<InsuranceCustomer | null>(null);
  const [editForm, setEditForm] = useState({ name: '', card_number: '', phone: '' });
  const [medsCustomer, setMedsCustomer] = useState<InsuranceCustomer | null>(null);

  // Fetch all sale items to compute top products
  const { data: allSaleItems = [] } = useQuery({
    queryKey: ['insurance_sale_items_all'],
    queryFn: async () => {
      const { data, error } = await supabase.from('insurance_sale_items' as any).select('*');
      if (error) throw error;
      return data || [];
    },
  });

  // Dashboard metrics
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
  const salesThisMonth = sales.filter((s: any) => s.sale_date >= monthStart).length;

  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number }>();
    for (const item of allSaleItems as any[]) {
      const key = item.product_id || item.product_name;
      const cur = map.get(key) || { name: item.product_name || '—', qty: 0 };
      cur.qty += Number(item.quantity || 0);
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.qty - a.qty).slice(0, 5);
  }, [allSaleItems]);

  const todayStr = new Date().toISOString().slice(0, 10);
  const upcomingAppointments = useMemo(() => {
    return customers
      .filter((c: any) => c.next_dispense_date)
      .map((c: any) => {
        const diff = Math.ceil((new Date(c.next_dispense_date).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24));
        return { customer: c, daysLeft: diff };
      })
      .sort((a, b) => a.daysLeft - b.daysLeft);
  }, [customers, todayStr]);

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
    } catch { /* error handled by mutation */ }
  };

  const getSalesCount = (customerId: string) => sales.filter((s) => s.customer_id === customerId).length;
  const getTotalSpent = (customerId: string) => sales.filter((s) => s.customer_id === customerId).reduce((sum, s) => sum + Number(s.total), 0);

  const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-GB') : '—';

  if (isLoading) {
    return <MainLayout title="عملاء التأمين"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="عملاء التأمين">
      <div className="space-y-6">
        {/* Insurance Dashboard */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl bg-card p-4 shadow-card flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><Users className="h-6 w-6 text-primary" /></div>
            <div><p className="text-2xl font-bold text-card-foreground tabular-nums">{customers.length}</p><p className="text-xs text-muted-foreground">إجمالي عملاء التأمين</p></div>
          </div>
          <div className="rounded-xl bg-card p-4 shadow-card flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"><ShoppingBag className="h-6 w-6 text-success" /></div>
            <div><p className="text-2xl font-bold text-card-foreground tabular-nums">{salesThisMonth}</p><p className="text-xs text-muted-foreground">عمليات الصرف هذا الشهر</p></div>
          </div>
          <div className="rounded-xl bg-card p-4 shadow-card flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10"><CalendarClock className="h-6 w-6 text-warning" /></div>
            <div><p className="text-2xl font-bold text-card-foreground tabular-nums">{upcomingAppointments.filter(a => a.daysLeft < 0).length}</p><p className="text-xs text-muted-foreground">مواعيد متأخرة</p></div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Top products */}
          <div className="rounded-xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-card-foreground">أكثر 5 أصناف سحباً</h3>
            </div>
            {topProducts.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">لا توجد بيانات</p>
            ) : (
              <div className="space-y-2">
                {topProducts.map((p, i) => (
                  <div key={i} className="flex items-center justify-between rounded-lg bg-muted/50 p-2.5">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">{i + 1}</span>
                      <span className="text-sm font-medium text-card-foreground">{p.name}</span>
                    </div>
                    <span className="text-sm font-bold tabular-nums text-primary">{p.qty}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Upcoming appointments */}
          <div className="rounded-xl bg-card p-4 shadow-card">
            <div className="flex items-center gap-2 mb-3">
              <CalendarClock className="h-5 w-5 text-primary" />
              <h3 className="font-semibold text-card-foreground">المواعيد القادمة</h3>
            </div>
            {upcomingAppointments.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-4">لا توجد مواعيد مسجلة</p>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {upcomingAppointments.slice(0, 20).map(({ customer, daysLeft }) => (
                  <div key={customer.id} className={cn(
                    'flex items-center justify-between rounded-lg p-2.5',
                    daysLeft < 0 ? 'bg-destructive/10 border border-destructive/30' : 'bg-muted/50'
                  )}>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{customer.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(customer.next_dispense_date)}</p>
                    </div>
                    <span className={cn(
                      'text-xs font-bold rounded-full px-2 py-0.5 tabular-nums',
                      daysLeft < 0 ? 'bg-destructive text-destructive-foreground' :
                      daysLeft <= 3 ? 'bg-warning/20 text-warning' : 'bg-success/10 text-success'
                    )}>
                      {daysLeft < 0 ? `متأخر ${Math.abs(daysLeft)} يوم` : daysLeft === 0 ? 'اليوم' : `${daysLeft} يوم`}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

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

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {filtered.map((customer: any) => (
            <div key={customer.id} className="rounded-xl bg-card p-4 shadow-card">
              <div className="flex items-center justify-between">
                <p className="font-medium text-card-foreground">{customer.name}</p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => setMedsCustomer(customer)} title="العلاج الافتراضي"><Pill className="h-4 w-4 text-primary" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}><Edit className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-muted-foreground text-xs">رقم البطاقة</span><p>{customer.card_number || '—'}</p></div>
                <div><span className="text-muted-foreground text-xs">الهاتف</span><p dir="ltr" className="text-right">{customer.phone || '—'}</p></div>
                <div><span className="text-muted-foreground text-xs">العمليات</span><p>{getSalesCount(customer.id)}</p></div>
                <div><span className="text-muted-foreground text-xs">الإجمالي</span><p className="tabular-nums font-medium">{getTotalSpent(customer.id).toFixed(2)} د.ل</p></div>
                <div className="col-span-2"><span className="text-muted-foreground text-xs">موعد الصرف القادم</span><p className="tabular-nums">{formatDate(customer.next_dispense_date)}</p></div>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-8 text-muted-foreground">لا يوجد عملاء</p>}
        </div>

        {/* Desktop Table */}
        <div className="hidden md:block rounded-xl bg-card shadow-card overflow-hidden">
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-right">الاسم</TableHead><TableHead className="text-right">رقم البطاقة</TableHead><TableHead className="text-right">الهاتف</TableHead>
              <TableHead className="text-right">عدد العمليات</TableHead><TableHead className="text-right">إجمالي المبيعات</TableHead>
              <TableHead className="text-right">موعد الصرف القادم</TableHead>
              <TableHead className="text-right">إجراءات</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {filtered.map((customer: any) => {
                const next = customer.next_dispense_date;
                const days = next ? Math.ceil((new Date(next).getTime() - new Date(todayStr).getTime()) / (1000 * 60 * 60 * 24)) : null;
                return (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.card_number || '—'}</TableCell>
                    <TableCell dir="ltr" className="text-right">{customer.phone || '—'}</TableCell>
                    <TableCell>{getSalesCount(customer.id)}</TableCell>
                    <TableCell className="tabular-nums">{getTotalSpent(customer.id).toFixed(2)} د.ل</TableCell>
                    <TableCell>
                      {next ? (
                        <span className={cn('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium tabular-nums',
                          days! < 0 ? 'bg-destructive/10 text-destructive' :
                          days! <= 3 ? 'bg-warning/10 text-warning' : 'bg-success/10 text-success'
                        )}>
                          {formatDate(next)} {days! < 0 ? `(متأخر ${Math.abs(days!)} يوم)` : days === 0 ? '(اليوم)' : `(${days} يوم)`}
                        </span>
                      ) : '—'}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setMedsCustomer(customer)} title="العلاج الافتراضي"><Pill className="h-4 w-4 text-primary" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openEdit(customer)}><Edit className="h-4 w-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
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

      {medsCustomer && (
        <DefaultMedicationsDialog
          isOpen={!!medsCustomer}
          onClose={() => setMedsCustomer(null)}
          customerId={medsCustomer.id}
          customerName={medsCustomer.name}
        />
      )}
    </MainLayout>
  );
}
