import React from 'react';

const CollectionSummary = ({ totalWeight, collectedCount }) => {
  return (
    <div className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg flex justify-between items-center">
      <span className="text-lg font-bold">Daily Summary</span>
      <div className="flex gap-8">
        <div>
          <span className="text-sm opacity-90">Total Weight: </span>
          <span className="text-xl font-bold">{totalWeight} kg</span>
        </div>
        <div>
          <span className="text-sm opacity-90">Customers Collected: </span>
          <span className="text-xl font-bold">{collectedCount}</span>
        </div>
      </div>
    </div>
  );
};

export default CollectionSummary;