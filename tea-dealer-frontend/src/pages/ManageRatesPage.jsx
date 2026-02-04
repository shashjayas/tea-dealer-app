import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useRates } from '../hooks/useRates';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';
import MonthTabs from '../components/rates/MonthTabs';
import RateForm from '../components/rates/RateForm';
import ConfirmDialog from '../components/common/ConfirmDialog';

const MONTH_NAMES = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const ManageRatesPage = () => {
  const {
    rates,
    selectedYear,
    selectedMonth,
    loading,
    saving,
    setSelectedYear,
    setSelectedMonth,
    fetchRatesByYear,
    saveMonthlyRate,
    deleteMonthlyRate,
    getCurrentRate,
  } = useRates();

  const { toasts, showToast, removeToast } = useToast();

  const [formData, setFormData] = useState({
    year: selectedYear,
    month: selectedMonth,
    teaPacketPrice: '',
    transportPercentage: '',
    stampFee: '',
    grade1Rate: '',
    grade2Rate: '',
  });

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    fetchRatesByYear(selectedYear);
  }, [selectedYear]);

  useEffect(() => {
    const currentRate = getCurrentRate(selectedMonth);
    if (currentRate) {
      setFormData({
        year: selectedYear,
        month: selectedMonth,
        teaPacketPrice: currentRate.teaPacketPrice || '',
        transportPercentage: currentRate.transportPercentage || '',
        stampFee: currentRate.stampFee || '',
        grade1Rate: currentRate.grade1Rate || '',
        grade2Rate: currentRate.grade2Rate || '',
      });
    } else {
      setFormData({
        year: selectedYear,
        month: selectedMonth,
        teaPacketPrice: '',
        transportPercentage: '',
        stampFee: '',
        grade1Rate: '',
        grade2Rate: '',
      });
    }
  }, [selectedMonth, rates]);

  const handleYearChange = (increment) => {
    setSelectedYear(prev => prev + increment);
  };

  const handleMonthChange = (month) => {
    setSelectedMonth(month);
  };

  const handleSave = async () => {
    // Clean the data - remove empty strings and convert to numbers
    const cleanData = {
      year: selectedYear,
      month: selectedMonth,
    };

    if (formData.teaPacketPrice && formData.teaPacketPrice !== '') {
      cleanData.teaPacketPrice = parseFloat(formData.teaPacketPrice);
    }
    if (formData.transportPercentage && formData.transportPercentage !== '') {
      cleanData.transportPercentage = parseFloat(formData.transportPercentage);
    }
    if (formData.stampFee && formData.stampFee !== '') {
      cleanData.stampFee = parseFloat(formData.stampFee);
    }
    if (formData.grade1Rate && formData.grade1Rate !== '') {
      cleanData.grade1Rate = parseFloat(formData.grade1Rate);
    }
    if (formData.grade2Rate && formData.grade2Rate !== '') {
      cleanData.grade2Rate = parseFloat(formData.grade2Rate);
    }

    const result = await saveMonthlyRate(cleanData);

    if (result.success) {
      showToast('Rates saved successfully', 'success');
      fetchRatesByYear(selectedYear);
    } else {
      showToast('Failed to save rates', 'error');
    }
  };

  const handleDelete = async () => {
    const currentRate = getCurrentRate(selectedMonth);
    if (currentRate && currentRate.id) {
      const result = await deleteMonthlyRate(currentRate.id, selectedMonth);
      if (result.success) {
        showToast('Rates deleted successfully', 'success');
        setShowDeleteConfirm(false);
      } else {
        showToast('Failed to delete rates', 'error');
      }
    }
  };

  const currentRate = getCurrentRate(selectedMonth);
  const isEditing = !!currentRate;

  return (
    <div className="p-2">
      {/* Toast notifications */}
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <ConfirmDialog
          title="Delete Rates"
          message={`Are you sure you want to delete the rates for ${MONTH_NAMES[selectedMonth]} ${selectedYear}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}

      {/* Year Selector and Month Tabs */}
      <div className="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div className="flex items-center justify-start mb-4">
          <div className="flex items-center gap-2 bg-gray-50 rounded-lg px-4 py-2">
            <button
              onClick={() => handleYearChange(-1)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Previous year"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <span className="text-xl font-bold text-gray-800 min-w-[80px] text-center">
              {selectedYear}
            </span>
            <button
              onClick={() => handleYearChange(1)}
              className="p-1 hover:bg-gray-200 rounded transition-colors"
              aria-label="Next year"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Month Tabs */}
        <MonthTabs
          selectedMonth={selectedMonth}
          onMonthChange={handleMonthChange}
          rates={rates}
        />
      </div>

      {/* Selected Month Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl shadow-lg p-4 mb-6">
        <h2 className="text-xl font-bold">
          {MONTH_NAMES[selectedMonth]} {selectedYear}
        </h2>
        <p className="text-sm opacity-90 mt-1">
          {isEditing ? 'Edit existing rates for this month' : 'Add new rates for this month'}
        </p>
      </div>

      {/* Rate Form */}
      {loading ? (
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <div className="text-gray-500">Loading...</div>
        </div>
      ) : (
        <RateForm
          formData={formData}
          onChange={setFormData}
          onSave={handleSave}
          saving={saving}
          isEditing={isEditing}
        />
      )}
    </div>
  );
};

export default ManageRatesPage;
