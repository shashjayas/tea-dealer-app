import React, { useState, useEffect } from 'react';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiCall } from '../../services/api';

const MONTH_KEYS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

const CollectionChart = () => {
  const { t } = useTranslation();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [viewMode, setViewMode] = useState('month'); // 'month' or 'year'
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchChartData();
  }, [viewMode, selectedYear, selectedMonth]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      if (viewMode === 'month') {
        // Fetch daily data for the selected month
        const daysInMonth = new Date(selectedYear, selectedMonth, 0).getDate();
        const data = [];

        for (let day = 1; day <= daysInMonth; day++) {
          const date = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          try {
            const collections = await apiCall(`/collections/date/${date}`);
            const totalWeight = collections.reduce((sum, col) => sum + parseFloat(col.weightKg || 0), 0);
            data.push({
              label: String(day),
              value: totalWeight,
              date: date
            });
          } catch (error) {
            data.push({ label: String(day), value: 0, date: date });
          }
        }
        setChartData(data);
      } else {
        // Fetch monthly data for the selected year
        const data = [];

        for (let month = 1; month <= 12; month++) {
          const startDate = `${selectedYear}-${String(month).padStart(2, '0')}-01`;
          const lastDay = new Date(selectedYear, month, 0).getDate();
          const endDate = `${selectedYear}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

          try {
            const collections = await apiCall(`/collections/date-range?startDate=${startDate}&endDate=${endDate}`);
            const totalWeight = collections.reduce((sum, col) => sum + parseFloat(col.weightKg || 0), 0);
            data.push({
              labelKey: MONTH_KEYS[month - 1],
              value: totalWeight,
              month: month
            });
          } catch (error) {
            data.push({ labelKey: MONTH_KEYS[month - 1], value: 0, month: month });
          }
        }
        setChartData(data);
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrevious = () => {
    if (viewMode === 'month') {
      if (selectedMonth === 1) {
        setSelectedMonth(12);
        setSelectedYear(prev => prev - 1);
      } else {
        setSelectedMonth(prev => prev - 1);
      }
    } else {
      setSelectedYear(prev => prev - 1);
    }
  };

  const handleNext = () => {
    if (viewMode === 'month') {
      if (selectedMonth === 12) {
        setSelectedMonth(1);
        setSelectedYear(prev => prev + 1);
      } else {
        setSelectedMonth(prev => prev + 1);
      }
    } else {
      setSelectedYear(prev => prev + 1);
    }
  };

  const maxValue = Math.max(...chartData.map(d => d.value), 1);

  // Calculate nice scale intervals with proper rounding
  const getScaleIntervals = (max) => {
    // Find a nice round number greater than max
    const magnitude = Math.pow(10, Math.floor(Math.log10(max)));
    const normalized = max / magnitude;

    let niceMax;
    if (normalized <= 1) niceMax = magnitude;
    else if (normalized <= 2) niceMax = 2 * magnitude;
    else if (normalized <= 5) niceMax = 5 * magnitude;
    else niceMax = 10 * magnitude;

    // Create 5 intervals
    const intervals = [];
    const step = niceMax / 5;
    for (let i = 5; i >= 0; i--) {
      intervals.push(step * i);
    }
    return intervals;
  };

  const scaleIntervals = getScaleIntervals(maxValue);
  const scaleMax = scaleIntervals[0]; // Top value of the scale

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-green-600" />
          {t('dashboard.collectionOverview')}
        </h2>

        <div className="flex items-center gap-4">
          {/* View Mode Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('month')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'month'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t('dashboard.monthly')}
            </button>
            <button
              onClick={() => setViewMode('year')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                viewMode === 'year'
                  ? 'bg-white text-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t('dashboard.yearly')}
            </button>
          </div>

          {/* Navigation */}
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-1.5">
            <button
              onClick={handlePrevious}
              className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-semibold text-gray-800 min-w-[100px] text-center">
              {viewMode === 'month' ? `${t(`months.short.${MONTH_KEYS[selectedMonth - 1]}`)} ${selectedYear}` : selectedYear}
            </span>
            <button
              onClick={handleNext}
              className="p-0.5 hover:bg-gray-200 rounded transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="text-gray-500">{t('common.loading')}</div>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between h-48 py-2">
            {scaleIntervals.map((value, index) => (
              <div key={index} className="text-xs text-gray-500 text-right pr-2 min-w-[50px]">
                {value.toFixed(0)} {t('common.kg')}
              </div>
            ))}
          </div>

          {/* Chart area with grid lines */}
          <div className="flex-1 h-48 relative">
            {/* Horizontal grid lines */}
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
              {scaleIntervals.map((_, index) => (
                <div key={index} className="border-t border-gray-200" />
              ))}
            </div>

            {/* Bars */}
            <div className="relative h-full flex items-end justify-between gap-1 px-2 pb-6">
              {chartData.map((item, index) => {
                const barHeight = scaleMax > 0 ? (item.value / scaleMax) * 100 : 0;
                return (
                  <div key={index} className="flex-1 flex flex-col items-center group h-full">
                    {/* Bar container - takes remaining height */}
                    <div className="flex-1 w-full flex items-end">
                      <div className="relative w-full h-full flex items-end">
                        {/* Tooltip */}
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                          {Math.round(item.value)} {t('common.kg')}
                        </div>

                        {/* Bar */}
                        <div
                          className="w-full bg-gradient-to-t from-green-600 to-emerald-500 rounded-t transition-all duration-300 hover:from-green-700 hover:to-emerald-600"
                          style={{
                            height: `${barHeight}%`,
                            minHeight: item.value > 0 ? '4px' : '0px'
                          }}
                        />
                      </div>
                    </div>

                    {/* Label */}
                    <div className="text-xs text-gray-600 mt-1 font-medium shrink-0">
                      {item.labelKey ? t(`months.short.${item.labelKey}`) : item.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
        <div className="text-sm text-gray-600">
          {t('common.total')}: <span className="font-bold text-green-600">
            {Math.round(chartData.reduce((sum, d) => sum + d.value, 0))} {t('common.kg')}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {t('dashboard.average')}: <span className="font-bold text-green-600">
            {Math.round(chartData.reduce((sum, d) => sum + d.value, 0) / (chartData.length || 1))} {t('common.kg')}/{viewMode === 'month' ? t('dashboard.day') : t('dashboard.month')}
          </span>
        </div>
        <div className="text-sm text-gray-600">
          {t('dashboard.peak')}: <span className="font-bold text-green-600">
            {Math.round(maxValue)} {t('common.kg')}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CollectionChart;
