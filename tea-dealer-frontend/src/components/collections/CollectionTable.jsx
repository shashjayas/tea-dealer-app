import React from 'react';
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CollectionTable = ({ customers, collections, saving, onWeightChange }) => {
  const { t } = useTranslation();

  // Prevent decimal point entry
  const handleKeyDown = (e) => {
    if (e.key === '.' || e.key === ',') {
      e.preventDefault();
    }
  };

  // Handle change - strip decimals if any get through (e.g., via paste)
  const handleWeightChange = (customerId, value, grade) => {
    // Remove any decimal portion
    const intValue = value === '' ? '' : Math.floor(Math.abs(parseFloat(value) || 0)).toString();
    onWeightChange(customerId, intValue, grade);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-3 py-2 grid grid-cols-7 gap-2 font-semibold text-sm">
        <div className="col-span-2 px-2 py-1">{t('customers.customer')}</div>
        <div className="px-2 py-1">{t('customers.bookNumber')}</div>
        <div className="px-2 py-1">{t('customers.route')}</div>
        <div className="text-center px-2 py-1">{t('collections.grade1')} ({t('common.kg')})</div>
        <div className="text-center px-2 py-1">{t('collections.grade2')} ({t('common.kg')})</div>
        <div className="text-center px-2 py-1">{t('common.total')} ({t('common.kg')})</div>
      </div>
      <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
        {customers.length === 0 ? (
          <div className="px-3 py-8 text-center text-gray-500">{t('common.noData')}</div>
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
                className={`grid grid-cols-7 gap-2 px-3 py-2 items-center text-sm ${
                  hasAnyCollection ? 'bg-green-50' : 'hover:bg-gray-50'
                }`}
              >
                <div className="col-span-2 flex items-center gap-2 px-2">
                  {hasAnyCollection ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-gray-300" />
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{customer.growerNameEnglish}</p>
                    <p className="text-sm text-gray-500">{customer.growerNameSinhala}</p>
                  </div>
                </div>
                <div className="text-gray-700 px-2">{customer.bookNumber}</div>
                <div className="px-2">
                  <span className="px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                    {customer.route}
                  </span>
                </div>
                <div className="px-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={grade1Collection?.weightKg || ''}
                    onChange={(e) => handleWeightChange(customer.id, e.target.value, 'GRADE_1')}
                    onKeyDown={handleKeyDown}
                    className="w-full px-2 py-1 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-center text-sm"
                    placeholder="0"
                  />
                  {saving[`${customer.id}_GRADE_1`] && (
                    <span className="text-xs text-blue-600">{t('common.saving')}</span>
                  )}
                </div>
                <div className="px-2">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={grade2Collection?.weightKg || ''}
                    onChange={(e) => handleWeightChange(customer.id, e.target.value, 'GRADE_2')}
                    onKeyDown={handleKeyDown}
                    className="w-full px-2 py-1 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-center text-sm bg-green-50"
                    placeholder="0"
                  />
                  {saving[`${customer.id}_GRADE_2`] && (
                    <span className="text-xs text-blue-600">{t('common.saving')}</span>
                  )}
                </div>
                <div className="text-center font-semibold text-gray-900 px-2">
                  {totalWeight > 0 ? Math.round(totalWeight) : '-'}
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
