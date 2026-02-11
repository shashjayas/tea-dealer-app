import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

const DashboardLayout = ({ user, onLogout, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Sidebar
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        user={user}
        onLogout={onLogout}
        isOpen={sidebarOpen}
      />

      <div className={`flex-1 flex flex-col transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        <Header
          currentPage={currentPage}
          user={user}
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
        />

        <main className="flex-1 p-6">
          {children({ currentPage, setCurrentPage })}
        </main>
      </div>

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}
    </div>
  );
};

export default DashboardLayout;