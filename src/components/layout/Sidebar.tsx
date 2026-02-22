import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Settings,
  ChevronRight,
  ChevronLeft,
  Zap,
  Shield,
  Truck,
  Users,
  Wallet,
  BarChart3,
  UserCog,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { title: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
  { title: 'البيع للتأمين', href: '/insurance-pos', icon: Shield },
  { title: 'البيع السريع', href: '/pos', icon: Zap },
  { title: 'بطاقة صنف', href: '/products', icon: Package },
  { title: 'المشتريات', href: '/purchases', icon: Truck },
  { title: 'الحسابات', href: '/accounts', icon: Users },
  { title: 'الخزينة', href: '/treasury', icon: Wallet },
  { title: 'التقارير', href: '/reports', icon: BarChart3 },
  { title: 'إدارة المستخدمين', href: '/users', icon: UserCog },
  { title: 'الإعدادات', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <aside
      className={cn(
        'fixed right-0 top-0 h-screen bg-sidebar text-sidebar-foreground transition-all duration-300 z-40',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        {!collapsed && (
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
              <ShoppingCart className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">نظام المحاسبة</h1>
              <p className="text-xs text-sidebar-foreground/60">POS Pro</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <ShoppingCart className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="mt-6 px-3">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  )}
                >
                  <item.icon className={cn('h-5 w-5 flex-shrink-0', collapsed && 'mx-auto')} />
                  {!collapsed && <span>{item.title}</span>}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -left-3 top-20 flex h-6 w-6 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground shadow-lg transition-transform hover:scale-110"
      >
        {collapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </button>

      {/* Footer */}
      {!collapsed && (
        <div className="absolute bottom-4 right-4 left-4">
          <div className="rounded-lg bg-sidebar-accent p-3">
            <p className="text-xs text-sidebar-foreground/60">الإصدار 1.0.0</p>
            <p className="text-xs text-sidebar-foreground/60">نظام نقاط البيع المتكامل</p>
          </div>
        </div>
      )}
    </aside>
  );
}
