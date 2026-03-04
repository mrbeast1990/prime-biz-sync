import { MainLayout } from '@/components/layout/MainLayout';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import {
  AlertTriangle, Clock, Shield, Loader2, Package, Truck, Users, Wallet, Landmark,
} from 'lucide-react';
import { useProducts, useInvoices, useInsuranceSales, useTreasuryEntries, useContacts } from '@/hooks/useSupabaseData';

export default function Dashboard() {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: invoices = [] } = useInvoices();
  const { data: insuranceSales = [] } = useInsuranceSales();
  const { data: entries = [] } = useTreasuryEntries();
  const { data: allContacts = [] } = useContacts();

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock);
  const expiringProducts = products.filter(p => {
    if (!p.has_expiry || !p.expiry_date) return false;
    const expiryDate = new Date(p.expiry_date);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow;
  });

  // Stock value
  const stockValue = products.reduce((sum, p) => sum + p.cost_price * p.stock_quantity, 0);

  // Supplier debts (total invoices - total paid for suppliers)
  const suppliers = allContacts.filter(c => c.contact_type === 'supplier');
  const customers = allContacts.filter(c => c.contact_type === 'customer');
  const getContactBalance = (contactId: string) => {
    const contactInvoices = invoices.filter(i => i.contact_id === contactId);
    return contactInvoices.reduce((sum, i) => sum + Number(i.total), 0) - contactInvoices.reduce((sum, i) => sum + Number(i.paid || 0), 0);
  };
  const supplierDebt = suppliers.reduce((sum, s) => sum + getContactBalance(s.id), 0);
  const customerDebt = customers.reduce((sum, c) => sum + getContactBalance(c.id), 0);

  // Treasury balances
  const salesTotal = entries.filter(e => e.category === 'sales').reduce((s, e) => s + Number(e.amount), 0);
  const purchasesTotal = entries.filter(e => e.category === 'purchases').reduce((s, e) => s + Number(e.amount), 0);
  const withdrawals = entries.filter(e => e.entry_type === 'withdrawal').reduce((s, e) => s + Number(e.amount), 0);
  const deposits = entries.filter(e => e.entry_type === 'deposit' || e.entry_type === 'income').reduce((s, e) => s + Number(e.amount), 0);
  const cashBalance = deposits + salesTotal - purchasesTotal - withdrawals;

  // Bank balance (card sales)
  const cardSales = invoices.filter(i => i.payment_method === 'card' && i.invoice_type === 'sale').reduce((s, i) => s + Number(i.total), 0);

  const recentInvoices = invoices.slice(0, 5).map(inv => ({
    ...inv,
    items: [],
    paid: Number(inv.paid),
    total: Number(inv.total),
  }));

  if (loadingProducts) {
    return <MainLayout title="لوحة التحكم"><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></MainLayout>;
  }

  return (
    <MainLayout title="لوحة التحكم">
      {/* Financial Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-5 animate-fade-in mb-6">
        <div className="rounded-xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10"><Package className="h-6 w-6 text-primary" /></div>
            <div><p className="text-2xl font-bold text-card-foreground tabular-nums">{stockValue.toFixed(2)} <span className="text-sm">د.ل</span></p><p className="text-xs text-muted-foreground">رصيد البضاعة</p></div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10"><Truck className="h-6 w-6 text-destructive" /></div>
            <div><p className="text-2xl font-bold text-destructive tabular-nums">{supplierDebt.toFixed(2)} <span className="text-sm">د.ل</span></p><p className="text-xs text-muted-foreground">دين الشركات</p></div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-warning/10"><Users className="h-6 w-6 text-warning" /></div>
            <div><p className="text-2xl font-bold text-warning tabular-nums">{customerDebt.toFixed(2)} <span className="text-sm">د.ل</span></p><p className="text-xs text-muted-foreground">دين الزبائن</p></div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10"><Wallet className="h-6 w-6 text-success" /></div>
            <div><p className="text-2xl font-bold text-success tabular-nums">{cashBalance.toFixed(2)} <span className="text-sm">د.ل</span></p><p className="text-xs text-muted-foreground">رصيد النقدية</p></div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-card">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10"><Landmark className="h-6 w-6 text-info" /></div>
            <div><p className="text-2xl font-bold text-info tabular-nums">{cardSales.toFixed(2)} <span className="text-sm">د.ل</span></p><p className="text-xs text-muted-foreground">رصيد المصرف</p></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in">
        <AlertCard title="تنبيه نقص المخزون" type="lowStock" products={lowStockProducts} />
        <AlertCard title="منتجات قاربت على الانتهاء" type="expiring" products={expiringProducts} />
      </div>

      <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <RecentTransactions invoices={recentInvoices as any} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <div className="rounded-xl bg-card p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10"><AlertTriangle className="h-7 w-7 text-destructive" /></div>
            <div><p className="text-3xl font-bold text-card-foreground">{lowStockProducts.length}</p><p className="text-sm text-muted-foreground">منتجات بمخزون منخفض</p></div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10"><Clock className="h-7 w-7 text-warning" /></div>
            <div><p className="text-3xl font-bold text-card-foreground">{expiringProducts.length}</p><p className="text-sm text-muted-foreground">منتجات قاربت على الانتهاء</p></div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info/10"><Shield className="h-7 w-7 text-info" /></div>
            <div><p className="text-3xl font-bold text-card-foreground">{insuranceSales.length}</p><p className="text-sm text-muted-foreground">عملاء تأمين</p></div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
