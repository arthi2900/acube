import React from 'react';
import { useLocation } from 'react-router-dom';
import BottomNavigation from './BottomNavigation';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const hideNavigation = location.pathname === '/login' || location.pathname.includes('/quiz');

  return (
    <div className="min-h-screen bg-background">
      <main className={`${hideNavigation ? '' : 'pb-20'} mobile-safe-area`}>
        {children}
      </main>
      {!hideNavigation && <BottomNavigation />}
    </div>
  );
};

export default Layout;