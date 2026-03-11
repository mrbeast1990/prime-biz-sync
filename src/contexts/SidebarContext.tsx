import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

interface SidebarContextType {
  collapsed: boolean;
  toggleSidebar: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType>({ collapsed: true, toggleSidebar: () => {}, mobileOpen: false, setMobileOpen: () => {} });

export function useSidebarContext() {
  return useContext(SidebarContext);
}

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggleSidebar = useCallback(() => setCollapsed(prev => !prev), []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggleSidebar]);

  return (
    <SidebarContext.Provider value={{ collapsed, toggleSidebar, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
}
