import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';
import { useIsMobile } from '@/hooks/use-mobile';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

function LayoutInner({ children, title }: MainLayoutProps) {
  const { collapsed } = useSidebarContext();
  const isMobile = useIsMobile();
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={`transition-all duration-300 ${isMobile ? '' : collapsed ? 'mr-20' : 'mr-64'}`}>
        <Header title={title} />
        <main className="p-4 md:p-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}

export function MainLayout({ children, title }: MainLayoutProps) {
  return (
    <SidebarProvider>
      <LayoutInner title={title}>{children}</LayoutInner>
    </SidebarProvider>
  );
}
