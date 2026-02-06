import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const CustomerTable = ({ customers, onEdit, onDelete, sortConfig, onSort, SortIcon }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2 grid grid-cols-6 gap-2 font-semibold text-sm">
        <div onClick={() => onSort('bookNumber')} className="cursor-pointer hover:bg-green-700 px-2 py-1 rounded flex items-center gap-1">
          Book No. <SortIcon columnKey="bookNumber" />
        </div>
        <div onClick={() => onSort('growerNameEnglish')} className="cursor-pointer hover:bg-green-700 px-2 py-1 rounded flex items-center gap-1">
          Name (English) <SortIcon columnKey="growerNameEnglish" />
        </div>
        <div onClick={() => onSort('growerNameSinhala')} className="cursor-pointer hover:bg-green-700 px-2 py-1 rounded flex items-center gap-1">
          Name (Sinhala) <SortIcon columnKey="growerNameSinhala" />
        </div>
        <div onClick={() => onSort('contactNumber')} className="cursor-pointer hover:bg-green-700 px-2 py-1 rounded flex items-center gap-1">
          Contact <SortIcon columnKey="contactNumber" />
        </div>
        <div onClick={() => onSort('route')} className="cursor-pointer hover:bg-green-700 px-2 py-1 rounded flex items-center gap-1">
          Route <SortIcon columnKey="route" />
        </div>
        <div className="px-2 py-1">Actions</div>
      </div>
      <div className="divide-y divide-gray-100">
        {customers.length === 0 ? (
          <div className="px-3 py-8 text-center text-gray-500">No customers found</div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="grid grid-cols-6 gap-2 px-3 py-2 hover:bg-green-50 items-center text-sm">
              <div className="font-medium text-gray-800 px-2">{customer.bookNumber}</div>
              <div className="text-gray-700 px-2">{customer.growerNameEnglish}</div>
              <div className="text-gray-700 px-2">{customer.growerNameSinhala}</div>
              <div className="text-gray-700 px-2">{customer.contactNumber || '-'}</div>
              <div className="px-2">
                <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {customer.route}
                </span>
              </div>
              <div className="flex gap-1 px-2">
                <button onClick={() => onEdit(customer)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(customer.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default CustomerTable;