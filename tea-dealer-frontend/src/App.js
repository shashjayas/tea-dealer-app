import React from 'react';
import { useAuth } from './hooks/useAuth';
import { CustomerProvider } from './contexts/CustomerContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import CustomerManagementPage from './pages/CustomerManagementPage';
import CollectionRecordingPage from './pages/CollectionRecordingPage';
import DashboardLayout from './components/layout/DashboardLayout';

const App = () => {
  const { user, login, logout } = useAuth();

  if (!user) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <CustomerProvider>
      <DashboardLayout user={user} onLogout={logout}>
        {({ currentPage }) => (
          <>
            {currentPage === 'dashboard' && <DashboardPage />}
            {currentPage === 'customers' && <CustomerManagementPage />}
            {currentPage === 'collections' && <CollectionRecordingPage />}
            {currentPage !== 'dashboard' && currentPage !== 'customers' && currentPage !== 'collections' && (
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
  );
};

export default App;