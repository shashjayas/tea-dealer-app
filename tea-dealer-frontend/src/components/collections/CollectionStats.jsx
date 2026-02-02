import React from 'react';
import { Calendar, Package, Users, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

const CollectionStats = ({ selectedDate, onDateChange, totalWeight, collectedCount, totalCustomers, onQuickAdd }) => {
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
      <div className="bg-white rounded-xl shadow-lg p-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-6 h-6 text-green-600" />
          <div className="flex-1">
            <p className="text-xs text-gray-600">Selected Date</p>
            <div className="flex items-center gap-1">
              <button
                onClick={handlePreviousDay}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
                aria-label="Previous day"
              >
                <ChevronLeft className="w-4 h-4 text-gray-600" />
              </button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => onDateChange(e.target.value)}
                className="text-sm font-bold text-gray-800 border-0 outline-none cursor-pointer"
              />
              <button
                onClick={handleNextDay}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
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
          <div>
            <p className="text-xs opacity-90">Total Collection</p>
            <p className="text-xl font-bold">{totalWeight} kg</p>
          </div>
          <Package className="w-8 h-8 opacity-80" />
        </div>
      </div>

      {/* Customers Collected Card */}
      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-90">Customers Collected</p>
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
          <p className="text-xs opacity-90">Quick Action</p>
          <p className="text-xl font-bold">Quick Add</p>
        </div>
      </button>
    </div>
  );
};

export default CollectionStats;