import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import Layout from '@/components/common/Layout';
import ErrorBoundary from '@/components/common/ErrorBoundary';
import routes from './routes';

function AppContent() {
  const location = useLocation();
  const publicRoutes = ['/login', '/register'];
  const isPublicRoute = publicRoutes.includes(location.pathname);

  if (isPublicRoute) {
    return (
      <>
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </>
    );
  }

  return (
    <Layout>
      <Routes>
        {routes.map((route, index) => (
          <Route key={index} path={route.path} element={route.element} />
        ))}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster />
    </Layout>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <TooltipProvider>
          <AppContent />
        </TooltipProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
