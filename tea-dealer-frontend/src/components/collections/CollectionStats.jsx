import React from 'react';
import { Calendar, Package, Users, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const CollectionStats = ({ selectedDate, onDateChange, totalWeight, grade1Total, grade2Total, collectedCount, totalCustomers, onQuickAdd }) => {
  const { t } = useTranslation();

  const handlePreviousDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() - 1);
    onDateChange(currentDate.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const currentDate = new Date(selectedDate);
    currentDate.setDate(currentDate.getDate() + 1);
    onDateChange(currentDate.toISOString().split('T')[0]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {/* Calendar Card */}
      <div className="bg-white rounded-xl shadow-lg p-3 overflow-hidden">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-green-600 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs text-gray-600">{t('collections.selectedDate')}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePreviousDay}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="text-sm font-bold text-gray-800 border-0 outline-none cursor-pointer min-w-0 max-w-[130px]"
              />
              <button
                onClick={handleNextDay}
                className="p-1 hover:bg-gray-100 rounded transition-colors flex-shrink-0"
                aria-label="Next day"
              >
                <ChevronRight className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Total Collection Card */}
      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg p-3">
        <div className="flex items-center justify-between">
          <div className="w-full">
            <p className="text-xs opacity-90">{t('collections.totalCollection')}</p>
            <p className="text-xl font-bold">{totalWeight} {t('common.kg')}</p>
            <div className="flex gap-2 mt-1">
              <span className="text-xs opacity-75">G1: {grade1Total}{t('common.kg')}</span>
              <span className="text-xs opacity-75">•</span>
              <span className="text-xs opacity-75">G2: {grade2Total}{t('common.kg')}</span>
            </div>
          </div>
          <Package className="w-8 h-8 opacity-80 flex-shrink-0" />
        </div>
      </div>

      {/* Customers Collected Card */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-90">{t('collections.customersCollected')}</p>
            <p className="text-xl font-bold">{collectedCount} / {totalCustomers}</p>
          </div>
          <Users className="w-8 h-8 opacity-80" />
        </div>
      </div>

      {/* Quick Add Card */}
      <button
        onClick={onQuickAdd}
        className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl shadow-lg p-3 flex items-center justify-center gap-2 hover:from-purple-600 hover:to-pink-600 transition-all"
      >
        <Plus className="w-8 h-8 opacity-80" />
        <div className="text-left">
          <p className="text-xs opacity-90">{t('collections.quickAction')}</p>
          <p className="text-xl font-bold">{t('collections.quickAdd')}</p>
        </div>
      </button>
    </div>
  );
};

export default CollectionStats;
