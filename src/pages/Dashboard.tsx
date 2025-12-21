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
  FileText,
} from 'lucide-react';
import {
  mockDashboardStats,
  mockInvoices,
  getLowStockProducts,
  getExpiringProducts,
} from '@/data/mockData';

export default function Dashboard() {
  const stats = mockDashboardStats;
  const lowStockProducts = getLowStockProducts();
  const expiringProducts = getExpiringProducts();

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
          title="فواتير معلقة"
          value={stats.pendingInvoices}
          icon={<FileText className="h-6 w-6 text-warning-foreground" />}
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
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
              <TrendingUp className="h-7 w-7 text-success" />
            </div>
            <div>
              <p className="text-3xl font-bold text-card-foreground">+15.3%</p>
              <p className="text-sm text-muted-foreground">نمو المبيعات هذا الأسبوع</p>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
