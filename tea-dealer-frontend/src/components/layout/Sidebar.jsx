import React from 'react';
import { Leaf } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { menuItems } from '../../constants/menuItems';
import LanguageToggle from '../common/LanguageToggle';

const Sidebar = ({ currentPage, onPageChange, user, onLogout, isOpen, pageVisibility }) => {
  const { t } = useTranslation();
  // Filter menu items based on user role and page visibility settings
  const filteredMenuItems = menuItems.filter(item => {
    // Check role requirement first
    if (item.requiredRole && user?.role !== item.requiredRole) {
      return false;
    }

    // Check page visibility settings
    if (item.page === 'stock' && !pageVisibility?.stockEnabled) return false;
    if (item.page === 'deductions' && !pageVisibility?.deductionsEnabled) return false;
    if (item.page === 'invoices' && !pageVisibility?.invoicesEnabled) return false;
    if (item.page === 'reports' && !pageVisibility?.reportsEnabled) return false;

    return true;
  });

  return (
    <div className={`fixed inset-y-0 left-0 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 bg-gradient-to-b from-green-700 to-emerald-800 text-white w-64 z-30 flex flex-col`}>
      <div className="p-6 border-b border-green-600 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <Leaf className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Tea Dealer Pro</h2>
            <p className="text-green-200 text-xs">{user.email}</p>
            {user?.role === 'SUPER_ADMIN' && (
              <span className="text-xs bg-yellow-500 text-gray-900 px-2 py-0.5 rounded-full font-medium">Admin</span>
            )}
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {filteredMenuItems.map((item, i) => (
          <button
            key={i}
            onClick={() => onPageChange(item.page)}
            className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all text-left ${
              currentPage === item.page ? 'bg-white/20' : 'hover:bg-white/10'
            }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="font-medium">{t(item.labelKey)}</span>
          </button>
        ))}
      </nav>

      <div className="flex-shrink-0 p-4 border-t border-green-600 space-y-3">
        <div className="flex justify-center">
          <LanguageToggle compact />
        </div>
        <button
          onClick={onLogout}
          className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-medium text-gray-900"
        >
          {t('common.logout')}
        </button>
      </div>
    </div>
  );
};

export default Sidebar;