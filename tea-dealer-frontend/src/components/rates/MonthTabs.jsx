import React from 'react';

const MONTHS = [
  { number: 1, name: 'Jan', fullName: 'January' },
  { number: 2, name: 'Feb', fullName: 'February' },
  { number: 3, name: 'Mar', fullName: 'March' },
  { number: 4, name: 'Apr', fullName: 'April' },
  { number: 5, name: 'May', fullName: 'May' },
  { number: 6, name: 'Jun', fullName: 'June' },
  { number: 7, name: 'Jul', fullName: 'July' },
  { number: 8, name: 'Aug', fullName: 'August' },
  { number: 9, name: 'Sep', fullName: 'September' },
  { number: 10, name: 'Oct', fullName: 'October' },
  { number: 11, name: 'Nov', fullName: 'November' },
  { number: 12, name: 'Dec', fullName: 'December' }
];

const MonthTabs = ({ selectedMonth, onMonthChange, rates }) => {
  return (
    <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5">
      {MONTHS.map((month) => {
        const hasRate = rates[month.number];
        return (
          <button
            key={month.number}
            onClick={() => onMonthChange(month.number)}
            className={`
              py-1.5 px-2 rounded-md font-medium text-xs transition-all
              ${selectedMonth === month.number
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm'
                : hasRate
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }
            `}
            title={month.fullName}
          >
            {month.name}
          </button>
        );
      })}
    </div>
  );
};

export default MonthTabs;
