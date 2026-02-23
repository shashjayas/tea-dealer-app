import React from 'react';
import { useAuth } from './hooks/useAuth';
import { CustomerProvider } from './contexts/CustomerContext';
import { LanguageProvider } from './contexts/LanguageContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import CollectionRecordingPage from './pages/CollectionRecordingPage';
import ManageRatesPage from './pages/ManageRatesPage';
import DeductionsPage from './pages/DeductionsPage';
import StockManagementPage from './pages/StockManagementPage';
import InvoicesPage from './pages/InvoicesPage';
import ConfigurationsPage from './pages/ConfigurationsPage';
import DashboardLayout from './components/layout/DashboardLayout';

const App = () => {
  const { user, login, logout } = useAuth();

  if (!user) {
    return (
      <LanguageProvider>
        <LoginPage onLogin={login} />
      </LanguageProvider>
    );
  }

  return (
    <LanguageProvider>
      <CustomerProvider>
      <DashboardLayout user={user} onLogout={logout}>
        {({ currentPage }) => (
          <>
            {currentPage === 'dashboard' && <DashboardPage />}
            {currentPage === 'customers' && <CustomerManagementPage />}
            {currentPage === 'collections' && <CollectionRecordingPage />}
            {currentPage === 'rates' && <ManageRatesPage />}
            {currentPage === 'deductions' && <DeductionsPage />}
            {currentPage === 'stock' && <StockManagementPage />}
            {currentPage === 'invoices' && <InvoicesPage />}
            {currentPage === 'configurations' && <ConfigurationsPage currentUser={user} />}
            {currentPage !== 'dashboard' && currentPage !== 'customers' && currentPage !== 'collections' && currentPage !== 'rates' && currentPage !== 'deductions' && currentPage !== 'stock' && currentPage !== 'invoices' && currentPage !== 'configurations' && (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🚧</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
                <p className="text-gray-600">This feature is under development</p>
              </div>
            )}
          </>
        )}
      </DashboardLayout>
    </CustomerProvider>
    </LanguageProvider>
  );
};

export default App;