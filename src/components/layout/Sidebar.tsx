import { useRef, useEffect, useState, useCallback } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, ShoppingCart, Settings, ChevronRight, ChevronLeft,
  Zap, Shield, Truck, Users, Wallet, BarChart3, UserCog, Upload,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebarContext } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navItems: NavItem[] = [
  { title: 'البيع للتأمين', href: '/insurance-pos', icon: Shield },
  { title: 'البيع السريع', href: '/pos', icon: Zap },
  { title: 'بطاقة صنف', href: '/products', icon: Package },
  { title: 'المشتريات', href: '/purchases', icon: Truck },
  { title: 'الحسابات', href: '/accounts', icon: Users },
  { title: 'الخزينة', href: '/treasury', icon: Wallet },
  { title: 'التقارير', href: '/reports', icon: BarChart3 },
  { title: 'استيراد تاريخي', href: '/import-historical', icon: Upload },
  { title: 'إدارة المستخدمين', href: '/users', icon: UserCog },
  { title: 'الإعدادات', href: '/settings', icon: Settings },
  { title: 'لوحة التحكم', href: '/', icon: LayoutDashboard },
];

function SidebarNav({ onNavClick }: { onNavClick?: () => void }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  return (
    <nav className="mt-6 px-3">
      <ul className="space-y-1">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.href;
          return (
            <li key={item.href}>
              <NavLink
                to={item.href}
                ref={el => { itemRefs.current[index] = el; }}
                onClick={onNavClick}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none',
                  isActive
                    ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                    : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                  focusedIndex === index && !isActive && 'ring-2 ring-sidebar-primary/50'
                )}
                onFocus={() => setFocusedIndex(index)}
              >
                <item.icon className="h-5 w-5 flex-shrink-0" />
                <span>{item.title}</span>
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Sidebar() {
  const { collapsed, toggleSidebar, mobileOpen, setMobileOpen } = useSidebarContext();
  const location = useLocation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

  // Keyboard navigation when sidebar is expanded (desktop only)
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (collapsed || isMobile) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = prev < navItems.length - 1 ? prev + 1 : 0;
        itemRefs.current[next]?.focus();
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedIndex(prev => {
        const next = prev > 0 ? prev - 1 : navItems.length - 1;
        itemRefs.current[next]?.focus();
        return next;
      });
    } else if (e.key === 'Enter' && focusedIndex >= 0) {
      navigate(navItems[focusedIndex].href);
    }
  }, [collapsed, isMobile, focusedIndex, navigate]);

  useEffect(() => {
    if (!collapsed && !isMobile) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [collapsed, isMobile, handleKeyDown]);

  // Mobile: use Sheet
  if (isMobile) {
    return (
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="right" className="w-64 p-0 bg-sidebar text-sidebar-foreground border-l border-sidebar-border">
          <SheetTitle className="sr-only">قائمة التنقل</SheetTitle>
          <SheetDescription className="sr-only">اختر الصفحة التي تريد الانتقال إليها</SheetDescription>
          <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
              <ShoppingCart className="h-5 w-5 text-sidebar-primary-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-sidebar-foreground">نظام المحاسبة</h1>
              <p className="text-xs text-sidebar-foreground/60">POS Pro</p>
            </div>
          </div>
          <SidebarNav onNavClick={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: fixed sidebar
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
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.href;
            return (
              <li key={item.href}>
                <NavLink
                  to={item.href}
                  ref={el => { itemRefs.current[index] = el; }}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                      : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                    focusedIndex === index && !isActive && 'ring-2 ring-sidebar-primary/50'
                  )}
                  onFocus={() => setFocusedIndex(index)}
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
        onClick={toggleSidebar}
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
            <p className="text-xs text-sidebar-foreground/60">F2 لطي/فتح القائمة</p>
            <p className="text-xs text-sidebar-foreground/60">↑↓ للتنقل | Enter للدخول</p>
          </div>
        </div>
      )}
    </aside>
  );
}
