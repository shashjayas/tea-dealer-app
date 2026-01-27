import React from 'react';
import { Edit, Trash2 } from 'lucide-react';

const CustomerTable = ({ customers, onEdit, onDelete, sortConfig, onSort, SortIcon }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 grid grid-cols-6 gap-4 font-semibold text-sm">
        <div onClick={() => onSort('bookNumber')} className="cursor-pointer hover:bg-green-700 p-2 rounded flex items-center gap-2">
          Book No. <SortIcon columnKey="bookNumber" />
        </div>
        <div onClick={() => onSort('growerNameEnglish')} className="cursor-pointer hover:bg-green-700 p-2 rounded flex items-center gap-2">
          Name (English) <SortIcon columnKey="growerNameEnglish" />
        </div>
        <div onClick={() => onSort('growerNameSinhala')} className="cursor-pointer hover:bg-green-700 p-2 rounded flex items-center gap-2">
          Name (Sinhala) <SortIcon columnKey="growerNameSinhala" />
        </div>
        <div onClick={() => onSort('contactNumber')} className="cursor-pointer hover:bg-green-700 p-2 rounded flex items-center gap-2">
          Contact <SortIcon columnKey="contactNumber" />
        </div>
        <div onClick={() => onSort('route')} className="cursor-pointer hover:bg-green-700 p-2 rounded flex items-center gap-2">
          Route <SortIcon columnKey="route" />
        </div>
        <div className="p-2">Actions</div>
      </div>
      <div className="divide-y">
        {customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No customers found</div>
        ) : (
          customers.map((customer) => (
            <div key={customer.id} className="grid grid-cols-6 gap-4 p-4 hover:bg-green-50 items-center text-sm">
              <div className="font-medium text-gray-900">{customer.bookNumber}</div>
              <div className="text-gray-700">{customer.growerNameEnglish}</div>
              <div className="text-gray-700">{customer.growerNameSinhala}</div>
              <div className="text-gray-700">{customer.contactNumber || '-'}</div>
              <div>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                  {customer.route}
                </span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => onEdit(customer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg">
                  <Edit className="w-4 h-4" />
                </button>
                <button onClick={() => onDelete(customer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
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