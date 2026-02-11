import React from 'react';
import { Leaf } from 'lucide-react';
import { menuItems } from '../../constants/menuItems';

const Sidebar = ({ currentPage, onPageChange, user, onLogout, isOpen }) => {
  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => {
    if (!item.requiredRole) return true; // No role required, show to all
    return user?.role === item.requiredRole;
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
            <span className="font-medium">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="flex-shrink-0 p-4 border-t border-green-600">
        <button
          onClick={onLogout}
          className="w-full px-4 py-3 bg-yellow-500 hover:bg-yellow-600 rounded-lg font-medium text-gray-900"
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;