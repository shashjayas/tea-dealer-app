import React from 'react';
import { XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const QuickAddModal = ({ customers, formData, onChange, onSubmit, onClose }) => {
  const { t } = useTranslation();

  // Prevent decimal point entry
  const handleKeyDown = (e) => {
    if (e.key === '.' || e.key === ',') {
      e.preventDefault();
    }
  };

  // Handle weight change - strip decimals if any get through (e.g., via paste)
  const handleWeightChange = (value) => {
    const intValue = value === '' ? '' : Math.floor(Math.abs(parseFloat(value) || 0)).toString();
    onChange({ ...formData, weightKg: intValue });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">{t('collections.quickAddCollection')}</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('customers.customer')} *</label>
            <select
              value={formData.customerId}
              onChange={(e) => onChange({ ...formData, customerId: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">{t('customers.selectCustomer')}</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.bookNumber} - {customer.growerNameEnglish}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('common.date')} *</label>
            <input
              type="date"
              value={formData.collectionDate}
              onChange={(e) => onChange({ ...formData, collectionDate: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('collections.grade')} *</label>
            <select
              value={formData.grade || 'GRADE_2'}
              onChange={(e) => onChange({ ...formData, grade: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-green-50"
            >
              <option value="GRADE_2">{t('collections.grade2Default')}</option>
              <option value="GRADE_1">{t('collections.grade1')}</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('collections.weight')} ({t('common.kg')}) *</label>
            <input
              type="number"
              step="1"
              min="0"
              value={formData.weightKg}
              onChange={(e) => handleWeightChange(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="0"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('collections.notes')}</label>
            <textarea
              value={formData.notes}
              onChange={(e) => onChange({ ...formData, notes: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows="2"
            />
          </div>
          <button
            onClick={onSubmit}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700"
          >
            {t('collections.saveCollection')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuickAddModal;
