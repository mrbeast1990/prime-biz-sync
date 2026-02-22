import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import {
  DollarSign, TrendingUp, Package, AlertTriangle, Clock, Shield, Wallet, Loader2,
} from 'lucide-react';
import { useProducts, useInvoices, useInsuranceSales, useTreasuryEntries } from '@/hooks/useSupabaseData';

export default function Dashboard() {
  const { data: products = [], isLoading: loadingProducts } = useProducts();
  const { data: invoices = [] } = useInvoices();
  const { data: insuranceSales = [] } = useInsuranceSales();
  const { data: treasuryEntries = [] } = useTreasuryEntries();

  const lowStockProducts = products.filter(p => p.stock_quantity <= p.min_stock);
  const expiringProducts = products.filter(p => {
    if (!p.has_expiry) return false;
    const expiryDate = new Date(p.expiry_date);
    const threeMonthsFromNow = new Date();
    threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3);
    return expiryDate <= threeMonthsFromNow;
  });

  const today = new Date().toISOString().split('T')[0];
  const todaySales = invoices.filter(i => i.invoice_type === 'sale' && i.invoice_date === today);
  const totalSalesToday = todaySales.reduce((s, i) => s + Number(i.total), 0);
  const totalSalesMonth = invoices.filter(i => i.invoice_type === 'sale').reduce((s, i) => s + Number(i.total), 0);

  const treasuryBalance = treasuryEntries.reduce((sum, e) => {
    if (e.entry_type === 'income' || e.entry_type === 'deposit') return sum + Number(e.amount);
    return sum - Number(e.amount);
  }, 0);

  // Map invoices to match the Invoice type expected by RecentTransactions
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
        <StatCard title="مبيعات اليوم" value={`${totalSalesToday.toFixed(2)} ر.س`} icon={<DollarSign className="h-6 w-6 text-primary-foreground" />} variant="primary" />
        <StatCard title="مبيعات الشهر" value={`${totalSalesMonth.toFixed(2)} ر.س`} icon={<TrendingUp className="h-6 w-6 text-success-foreground" />} variant="success" />
        <StatCard title="إجمالي المنتجات" value={products.length} icon={<Package className="h-6 w-6 text-primary" />} />
        <StatCard title="رصيد الخزينة" value={`${treasuryBalance.toFixed(2)} ر.س`} icon={<Wallet className="h-6 w-6 text-warning-foreground" />} variant="warning" />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <AlertCard title="تنبيه نقص المخزون" type="lowStock" products={lowStockProducts} />
        <AlertCard title="منتجات قاربت على الانتهاء" type="expiring" products={expiringProducts} />
      </div>

      <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <RecentTransactions invoices={recentInvoices as any} />
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
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
