
import React, { lazy, Suspense } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from './constants/routes';
import { isSupabaseConfigured } from './lib/supabaseClient';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { Loader, ServerCrash, RefreshCw } from 'lucide-react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/reactQuery';
import { useAppInitialization } from './hooks/useAppInitialization';
import { AppRoutes } from './routes/AppRoutes';
import { HoloButton } from './components/ui/HoloButton';
import { ErrorBoundary } from './components/common/ErrorBoundary';

const LoginView = lazy(() => import('./features/auth/LoginView').then(m => ({ default: m.LoginView })));
const RegisterView = lazy(() => import('./features/auth/RegisterView').then(m => ({ default: m.RegisterView })));
const AcceptInviteView = lazy(() => import('./features/auth/AcceptInviteView').then(m => ({ default: m.AcceptInviteView })));
const CreateCompanyView = lazy(() => import('./features/onboarding/CreateCompanyView').then(m => ({ default: m.CreateCompanyView })));

const FullPageLoader: React.FC<{ message?: string }> = ({ message }) => (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-[rgb(var(--bg-primary-rgb))] text-[rgb(var(--text-primary-rgb))]">
        <Loader className="w-12 h-12 animate-spin text-cyan-400 mb-4" />
        <p className="animate-pulse">{message || 'Loading...'}</p>
    </div>
);

const SupabaseNotConfigured: React.FC = () => (
    <div className="w-screen h-screen flex flex-col items-center justify-center bg-[rgb(var(--bg-secondary-rgb))] text-[rgb(var(--text-primary-rgb))] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.6)] mb-4">
            <ServerCrash size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-[rgb(var(--text-primary-rgb))] mb-2">Application Not Configured</h1>
        <p className="text-red-300 max-w-md">
            The connection to the backend database (Supabase) is not set up. Please ensure the <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> environment variables are correctly configured in your .env file.
        </p>
    </div>
);

const AuthenticatedAppContent: React.FC = () => {
  const { isAuthenticated, companiesLoaded, companiesError, userCompanies, currentCompany } = useAppInitialization();

  if (!isAuthenticated) {
      return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (companiesError) {
    return (
        <div className="w-screen h-screen flex flex-col items-center justify-center bg-[rgb(var(--bg-primary-rgb))] text-[rgb(var(--text-primary-rgb))] p-8 text-center">
           <div className="p-4 rounded-full bg-red-500/10 mb-4">
               <ServerCrash size={48} className="text-red-500" />
           </div>
           <h1 className="text-2xl font-bold mb-3">System Error</h1>
           <p className="text-[rgb(var(--text-secondary-rgb))] max-w-md mb-6">{companiesError}</p>
           <HoloButton 
               onClick={() => window.location.reload()} 
               variant="primary"
               icon={RefreshCw}
           >
               Retry Connection
           </HoloButton>
        </div>
    );
  }

  if (!companiesLoaded) {
    return <FullPageLoader message="Loading your workspace..." />;
  }

  // If user is authenticated but has no companies, redirect to create company
  if (userCompanies.length === 0 && companiesLoaded) {
    return <CreateCompanyView />;
  }
  
  if (!currentCompany) {
      return <FullPageLoader message="Setting up your company..." />;
  }

  return <AppRoutes />;
};

export const App = () => {
  const { authLoading } = useAppInitialization();

  if (!isSupabaseConfigured) {
      return <SupabaseNotConfigured />;
  }

  if (authLoading) {
      return <FullPageLoader message="Authenticating..." />;
  }

  return (
    <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
            <HashRouter>
                <Suspense fallback={<FullPageLoader message="Loading Application..." />}>
                    <Routes>
                        <Route path={ROUTES.LOGIN} element={<LoginView />} />
                        <Route path={ROUTES.REGISTER} element={<RegisterView />} />
                        <Route path={ROUTES.ACCEPT_INVITE} element={<AcceptInviteView />} />
                        <Route 
                            path="/*" 
                            element={
                            <ProtectedRoute>
                                <AuthenticatedAppContent />
                            </ProtectedRoute>
                            } 
                        />
                    </Routes>
                </Suspense>
            </HashRouter>
        </QueryClientProvider>
    </ErrorBoundary>
  );
};
