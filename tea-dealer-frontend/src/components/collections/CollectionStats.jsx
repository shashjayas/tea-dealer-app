import React from 'react';
import { Calendar, Package, Users } from 'lucide-react';

const CollectionStats = ({ selectedDate, onDateChange, totalWeight, collectedCount, totalCustomers }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <div className="bg-white rounded-xl shadow-lg p-4">
        <div className="flex items-center gap-3">
          <Calendar className="w-8 h-8 text-green-600" />
          <div>
            <p className="text-sm text-gray-600">Selected Date</p>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => onDateChange(e.target.value)}
              className="text-lg font-bold text-gray-800 border-0 outline-none cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Total Collection</p>
            <p className="text-2xl font-bold">{totalWeight} kg</p>
          </div>
          <Package className="w-10 h-10 opacity-80" />
        </div>
      </div>

      <div className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl shadow-lg p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">Customers Collected</p>
            <p className="text-2xl font-bold">{collectedCount} / {totalCustomers}</p>
          </div>
          <Users className="w-10 h-10 opacity-80" />
        </div>
      </div>
    </div>
  );
};

export default CollectionStats;