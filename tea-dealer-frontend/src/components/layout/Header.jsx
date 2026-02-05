import React from 'react';
import { Menu, X } from 'lucide-react';

const Header = ({ currentPage, user, sidebarOpen, onToggleSidebar }) => {
  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard';
      case 'customers': return 'Customer Management';
      case 'collections': return 'Daily Collection';
      case 'rates': return 'Manage Rates';
      case 'deductions': return 'Manage Deductions';
      case 'invoices': return 'Invoices';
      default: return 'Coming Soon';
    }
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-20">
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            {sidebarOpen ? <X /> : <Menu />}
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            {getPageTitle()}
          </h1>
        </div>
        <div className="text-sm text-gray-600">
          <span>Welcome back, </span>
          <span className="font-semibold text-green-700">{user.username}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;