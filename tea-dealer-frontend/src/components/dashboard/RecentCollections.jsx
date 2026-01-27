import React from 'react';
import { TrendingUp } from 'lucide-react';

const RecentCollections = () => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-6 h-6 text-green-600" />
        Recent Collections
      </h2>
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            key={item}
            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-green-50"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">
                {item}
              </div>
              <div>
                <p className="font-semibold text-gray-800">Farmer {item}</p>
                <p className="text-sm text-gray-500">Collected today at 2:30 PM</p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-bold text-green-700">45 kg</p>
              <p className="text-sm text-gray-500">@ Rs. 180/kg</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentCollections;