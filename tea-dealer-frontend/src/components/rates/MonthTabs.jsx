import React from 'react';
import { useTranslation } from 'react-i18next';

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTH_KEYS_FULL = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

const MonthTabs = ({ selectedMonth, onMonthChange, rates }) => {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-6 md:grid-cols-12 gap-1.5">
      {MONTH_KEYS.map((monthKey, index) => {
        const monthNumber = index + 1;
        const hasRate = rates[monthNumber];
        return (
          <button
            key={monthNumber}
            onClick={() => onMonthChange(monthNumber)}
            className={`
              py-1.5 px-2 rounded-md font-medium text-xs transition-all
              ${selectedMonth === monthNumber
                ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-sm'
                : hasRate
                  ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-300'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
              }
            `}
            title={t(`months.full.${MONTH_KEYS_FULL[index]}`)}
          >
            {t(`months.short.${monthKey}`)}
          </button>
        );
      })}
    </div>
  );
};

export default MonthTabs;
