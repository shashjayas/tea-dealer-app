import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';

const CollectionTable = ({ customers, collections, saving, onWeightChange }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 grid grid-cols-7 gap-4 font-semibold text-sm">
        <div className="col-span-2">Customer</div>
        <div>Book No.</div>
        <div>Route</div>
        <div className="text-center">Grade 1 (kg)</div>
        <div className="text-center">Grade 2 (kg)</div>
        <div className="text-center">Total (kg)</div>
      </div>
      <div className="divide-y max-h-[500px] overflow-y-auto">
        {customers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">No customers found</div>
        ) : (
          customers.map((customer) => {
            const customerCollections = collections[customer.id] || {};
            const grade1Collection = customerCollections['GRADE_1'];
            const grade2Collection = customerCollections['GRADE_2'];
            const hasAnyCollection = !!grade1Collection || !!grade2Collection;

            const grade1Weight = parseFloat(grade1Collection?.weightKg || 0);
            const grade2Weight = parseFloat(grade2Collection?.weightKg || 0);
            const totalWeight = grade1Weight + grade2Weight;

            return (
              <div
                key={customer.id}
                className={`grid grid-cols-7 gap-4 p-4 items-center text-sm ${
                  hasAnyCollection ? 'bg-green-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="col-span-2 flex items-center gap-2">
                  {hasAnyCollection ? (
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
                    value={grade1Collection?.weightKg || ''}
                    onChange={(e) => onWeightChange(customer.id, e.target.value, 'GRADE_1')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-center"
                    placeholder="0.00"
                  />
                  {saving[`${customer.id}_GRADE_1`] && (
                    <span className="text-xs text-blue-600">Saving...</span>
                  )}
                </div>
                <div>
                  <input
                    type="number"
                    step="0.01"
                    value={grade2Collection?.weightKg || ''}
                    onChange={(e) => onWeightChange(customer.id, e.target.value, 'GRADE_2')}
                    className="w-full px-3 py-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-center bg-green-50"
                    placeholder="0.00"
                  />
                  {saving[`${customer.id}_GRADE_2`] && (
                    <span className="text-xs text-blue-600">Saving...</span>
                  )}
                </div>
                <div className="text-center font-semibold text-gray-900">
                  {totalWeight > 0 ? totalWeight.toFixed(2) : '-'}
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