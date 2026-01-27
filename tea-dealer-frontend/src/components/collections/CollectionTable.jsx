import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const CollectionTable = ({ customers, collections, saving, onWeightChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 grid grid-cols-5 gap-4 font-semibold text-sm">
        <div className="col-span-2">Customer</div>
        <div>Book No.</div>
        <div>Route</div>
        <div>Weight (kg)</div>
      </div>
      <div className="divide-y max-h-[500px] overflow-y-auto">
        {customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No customers found</div>
        ) : (
          customers.map((customer) => {
            const collection = collections[customer.id];
            const hasCollection = !!collection;

            return (
              <div
                key={customer.id}
                className={`grid grid-cols-5 gap-4 p-4 items-center text-sm ${
                  hasCollection ? 'bg-green-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="col-span-2 flex items-center gap-2">
                  {hasCollection ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-gray-300" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{customer.growerNameEnglish}</p>
                    <p className="text-xs text-gray-500">{customer.growerNameSinhala}</p>
                  </div>
                </div>
                <div className="text-gray-700">{customer.bookNumber}</div>
                <div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    {customer.route}
                  </span>
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    value={collection?.weightKg || ''}
                    onChange={(e) => onWeightChange(customer.id, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="0.00"
                  />
                  {saving[customer.id] && (
                    <span className="text-xs text-blue-600">Saving...</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default CollectionTable;