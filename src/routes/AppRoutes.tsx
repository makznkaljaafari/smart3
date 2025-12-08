
import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ROUTES } from '../constants/routes';
import { ProtectedRoute } from '../components/common/ProtectedRoute';
import { Loader } from 'lucide-react';
import { AppLayout } from '../components/layout/AppLayout';
import { CompanySetupWizard } from '../features/onboarding/CompanySetupWizard';

// Lazy load all view components
const DashboardView = lazy(() => import('../features/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const SettingsView = lazy(() => import('../features/settings/SettingsView').then(m => ({ default: m.SettingsView })));
const CustomersView = lazy(() => import('../features/customers/CustomersView').then(m => ({ default: m.CustomersView })));
const DebtsView = lazy(() => import('../features/debts/DebtsView').then(m => ({ default: m.DebtsView })));
const ExpensesView = lazy(() => import('../features/expenses/ExpensesView').then(m => ({ default: m.ExpensesView })));
const NotesView = lazy(() => import('../features/notes/NotesView').then(m => ({ default: m.NotesView })));
const ReportsView = lazy(() => import('../features/reports/ReportsView').then(m => ({ default: m.ReportsView })));
const IncomeView = lazy(() => import('../features/income/IncomeView').then(m => ({ default: m.IncomeView })));
const InventoryView = lazy(() => import('../features/inventory/InventoryView').then(m => ({ default: m.InventoryView })));
const ImportItemsView = lazy(() => import('../features/inventory/components/ImportItemsView').then(m => ({ default: m.ImportItemsView })));
const AccountingView = lazy(() => import('../features/accounting/AccountingView').then(m => ({ default: m.AccountingView })));
const SalesView = lazy(() => import('../features/sales/SalesView').then(m => ({ default: m.SalesView })));
const PurchasesView = lazy(() => import('../features/purchases/PurchasesView').then(m => ({ default: m.PurchasesView })));
const IntegrationsView = lazy(() => import('../features/integrations/IntegrationsView').then(m => ({ default: m.IntegrationsView })));
const SuppliersView = lazy(() => import('../features/suppliers/SuppliersView').then(m => ({ default: m.SuppliersView })));
const ProjectsView = lazy(() => import('../features/projects/ProjectsView').then(m => ({ default: m.ProjectsView })));
const ProjectDetailsView = lazy(() => import('../features/projects/ProjectDetailsView').then(m => ({ default: m.ProjectDetailsView })));
const TeamManagementView = lazy(() => import('../features/team/TeamManagementView').then(m => ({ default: m.TeamManagementView })));
const ImportInvoiceView = lazy(() => import('../features/purchases/components/ImportInvoiceView').then(m => ({ default: m.ImportInvoiceView })));
const VehiclesView = lazy(() => import('../features/vehicles/VehiclesView').then(m => ({ default: m.VehiclesView })));

const RouteLoader: React.FC = () => (
    <div className="p-8 w-full flex justify-center mt-10">
        <Loader className="w-12 h-12 animate-spin text-cyan-400" />
    </div>
);

export const AppRoutes: React.FC = () => {
  const adminManagerRoles = ['owner', 'admin', 'manager'];
  
  return (
    <AppLayout>
      <CompanySetupWizard />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
          {/* Routes accessible to all authenticated users */}
          <Route path={ROUTES.DASHBOARD} element={<DashboardView />} />
          <Route path={ROUTES.EXPENSES} element={<ExpensesView />} />
          <Route path={ROUTES.NOTES} element={<NotesView />} />
          <Route path={ROUTES.SETTINGS} element={<SettingsView />} />
          
          {/* Routes restricted to admin/manager/owner */}
          <Route path={ROUTES.SALES} element={<ProtectedRoute allowedRoles={adminManagerRoles}><SalesView /></ProtectedRoute>} />
          <Route path={ROUTES.VEHICLES} element={<ProtectedRoute allowedRoles={adminManagerRoles}><VehiclesView /></ProtectedRoute>} />
          <Route path={ROUTES.PURCHASES} element={<ProtectedRoute allowedRoles={adminManagerRoles}><PurchasesView /></ProtectedRoute>} />
          <Route path={ROUTES.PURCHASES_IMPORT} element={<ProtectedRoute allowedRoles={adminManagerRoles}><ImportInvoiceView /></ProtectedRoute>} />
          <Route path={ROUTES.CUSTOMERS} element={<ProtectedRoute allowedRoles={adminManagerRoles}><CustomersView /></ProtectedRoute>} />
          <Route path={ROUTES.SUPPLIERS} element={<ProtectedRoute allowedRoles={adminManagerRoles}><SuppliersView /></ProtectedRoute>} />
          <Route path={ROUTES.PROJECTS} element={<ProtectedRoute allowedRoles={adminManagerRoles}><ProjectsView /></ProtectedRoute>} />
          <Route path={ROUTES.PROJECT_DETAILS} element={<ProtectedRoute allowedRoles={adminManagerRoles}><ProjectDetailsView /></ProtectedRoute>} />
          <Route path={ROUTES.DEBTS} element={<ProtectedRoute allowedRoles={adminManagerRoles}><DebtsView /></ProtectedRoute>} />
          <Route path={ROUTES.INVENTORY} element={<ProtectedRoute allowedRoles={adminManagerRoles}><InventoryView /></ProtectedRoute>} />
          <Route path={ROUTES.INVENTORY_IMPORT} element={<ProtectedRoute allowedRoles={adminManagerRoles}><ImportItemsView /></ProtectedRoute>} />
          <Route path={ROUTES.REPORTS} element={<ProtectedRoute allowedRoles={adminManagerRoles}><ReportsView /></ProtectedRoute>} />
          <Route path={ROUTES.ACCOUNTING} element={<ProtectedRoute allowedRoles={adminManagerRoles}><AccountingView /></ProtectedRoute>} />
          <Route path={ROUTES.TEAM} element={<ProtectedRoute allowedRoles={adminManagerRoles}><TeamManagementView /></ProtectedRoute>} />
          <Route path={ROUTES.INTEGRATIONS} element={<ProtectedRoute allowedRoles={adminManagerRoles}><IntegrationsView /></ProtectedRoute>} />
          
          <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </Suspense>
    </AppLayout>
  );
};
