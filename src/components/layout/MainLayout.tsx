import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { SidebarProvider, useSidebarContext } from '@/contexts/SidebarContext';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

function LayoutInner({ children, title }: MainLayoutProps) {
  const { collapsed } = useSidebarContext();
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={`transition-all duration-300 ${collapsed ? 'mr-20' : 'mr-64'}`}>
        <Header title={title} />
        <main className="p-6 custom-scrollbar">
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
