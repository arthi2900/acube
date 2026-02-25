import { useAuth } from '@/hooks/useAuth';
import { useState, useEffect } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { profile } = useAuth();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check if current route should show sidebar
  const shouldShowSidebar = profile && ['/admin', '/principal', '/teacher', '/student'].some(
    path => window.location.pathname.startsWith(path)
  );

  // Listen for sidebar collapse state changes
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setSidebarCollapsed(true);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="min-h-screen">
      <Header />
      <div className="flex pt-16">
        {shouldShowSidebar && (
          <Sidebar 
            collapsed={sidebarCollapsed} 
            onCollapsedChange={setSidebarCollapsed} 
          />
        )}
        <main 
          className="flex-1 p-6 transition-all duration-300 rounded-3xl"
          style={{
            marginLeft: shouldShowSidebar ? (sidebarCollapsed ? '64px' : '256px') : '0'
          }}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
