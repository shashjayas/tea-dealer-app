import React from 'react';
import { Menu, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import LanguageToggle from '../common/LanguageToggle';

const Header = ({ currentPage, user, sidebarOpen, onToggleSidebar }) => {
  const { t } = useTranslation();

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return t('navigation.dashboard');
      case 'customers': return t('navigation.customers');
      case 'collections': return t('navigation.collections');
      case 'rates': return t('navigation.rates');
      case 'deductions': return t('navigation.deductions');
      case 'stock': return t('navigation.stock');
      case 'invoices': return t('navigation.invoices');
      case 'configurations': return t('navigation.configurations');
      default: return t('common.comingSoon');
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
        <div className="flex items-center gap-4">
          <LanguageToggle />
          <div className="text-sm text-gray-600">
            <span>{t('common.welcomeBack')}, </span>
            <span className="font-semibold text-green-700">{user.username}</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;