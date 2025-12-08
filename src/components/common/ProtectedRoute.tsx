import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useZustandStore } from '../../store/useStore';
import { ROUTES } from '../../constants/routes';
import { Loader } from 'lucide-react';
import { SectionBox } from '../ui/SectionBox';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, authLoading, userRole, theme, lang } = useZustandStore(s => ({
    isAuthenticated: s.isAuthenticated,
    authLoading: s.authLoading,
    userRole: s.userRole,
    theme: s.theme,
    lang: s.lang,
  }));
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="w-screen h-screen flex items-center justify-center bg-[rgb(var(--bg-secondary-rgb))]">
        <Loader className="w-12 h-12 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} state={{ from: location }} replace />;
  }
  
  if (allowedRoles && userRole && !allowedRoles.includes(userRole)) {
     return (
        <div className="p-8">
            <SectionBox title="Access Denied" theme={theme}>
                <p>{lang === 'ar' ? 'ليس لديك الصلاحية للوصول لهذه الصفحة.' : 'You do not have permission to access this page.'}</p>
            </SectionBox>
        </div>
     );
  }

  return <>{children}</>;
};