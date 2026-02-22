import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { AlertCard } from '@/components/dashboard/AlertCard';
import { RecentTransactions } from '@/components/dashboard/RecentTransactions';
import {
  DollarSign,
  TrendingUp,
  Package,
  AlertTriangle,
  Clock,
  Shield,
  Wallet,
} from 'lucide-react';
import {
  mockDashboardStats,
  mockInvoices,
  mockInsuranceSales,
  mockTreasuryEntries,
  getLowStockProducts,
  getExpiringProducts,
} from '@/data/mockData';

export default function Dashboard() {
  const stats = mockDashboardStats;
  const lowStockProducts = getLowStockProducts();
  const expiringProducts = getExpiringProducts();

  const insuranceCustomersToday = mockInsuranceSales.length;
  const treasuryBalance = mockTreasuryEntries.reduce((sum, e) => {
    if (e.entry_type === 'income' || e.entry_type === 'deposit') return sum + e.amount;
    return sum - e.amount;
  }, 0);

  return (
    <MainLayout title="لوحة التحكم">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4 animate-fade-in">
        <StatCard
          title="مبيعات اليوم"
          value={`${stats.totalSalesToday.toFixed(2)} ر.س`}
          icon={<DollarSign className="h-6 w-6 text-primary-foreground" />}
          trend={{ value: 12.5, isPositive: true }}
          variant="primary"
        />
        <StatCard
          title="مبيعات الشهر"
          value={`${stats.totalSalesMonth.toFixed(2)} ر.س`}
          icon={<TrendingUp className="h-6 w-6 text-success-foreground" />}
          trend={{ value: 8.2, isPositive: true }}
          variant="success"
        />
        <StatCard
          title="إجمالي المنتجات"
          value={stats.totalProducts}
          icon={<Package className="h-6 w-6 text-primary" />}
        />
        <StatCard
          title="رصيد الخزينة"
          value={`${treasuryBalance.toFixed(2)} ر.س`}
          icon={<Wallet className="h-6 w-6 text-warning-foreground" />}
          variant="warning"
        />
      </div>

      {/* Alerts Section */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2 animate-fade-in" style={{ animationDelay: '0.1s' }}>
        <AlertCard
          title="تنبيه نقص المخزون"
          type="lowStock"
          products={lowStockProducts}
        />
        <AlertCard
          title="منتجات قاربت على الانتهاء"
          type="expiring"
          products={expiringProducts}
        />
      </div>

      {/* Recent Transactions */}
      <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
        <RecentTransactions invoices={mockInvoices} />
      </div>

      {/* Quick Stats Summary */}
      <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="rounded-xl bg-card p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
              <AlertTriangle className="h-7 w-7 text-destructive" />
            </div>
            <div>
              <p className="text-3xl font-bold text-card-foreground">{stats.lowStockCount}</p>
              <p className="text-sm text-muted-foreground">منتجات بمخزون منخفض</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-warning/10">
              <Clock className="h-7 w-7 text-warning" />
            </div>
            <div>
              <p className="text-3xl font-bold text-card-foreground">{stats.expiringCount}</p>
              <p className="text-sm text-muted-foreground">منتجات قاربت على الانتهاء</p>
            </div>
          </div>
        </div>

        <div className="rounded-xl bg-card p-6 shadow-card">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-info/10">
              <Shield className="h-7 w-7 text-info" />
            </div>
            <div>
              <p className="text-3xl font-bold text-card-foreground">{insuranceCustomersToday}</p>
              <p className="text-sm text-muted-foreground">عملاء تأمين اليوم</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
