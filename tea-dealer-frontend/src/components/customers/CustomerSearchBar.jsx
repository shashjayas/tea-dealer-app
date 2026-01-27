import React from 'react';
import { Search } from 'lucide-react';

const CustomerSearchBar = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="mb-6 relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
      <input
        type="text"
        placeholder="Search by name, book number, or route..."
        value={searchTerm}
        onChange={(e) => onSearchChange(e.target.value)}
        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
      />
    </div>
  );
};

export default CustomerSearchBar;