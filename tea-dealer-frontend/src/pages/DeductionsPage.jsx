import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Search } from 'lucide-react';
import { useCustomerContext } from '../contexts/CustomerContext';
import { getDeductionByCustomerAndPeriod, calculateMonthlyTotals, saveDeduction } from '../services/deductionService';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DeductionsPage = () => {
  const { customers } = useCustomerContext();
  const { toasts, showToast, removeToast } = useToast();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [monthlyTotals, setMonthlyTotals] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Set first customer as default
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomer) {
      setSelectedCustomer(customers[0]);
    }
  }, [customers, selectedCustomer]);

  const [deductions, setDeductions] = useState({
    lastMonthArrears: '',
    advanceAmount: '',
    advanceDate: '',
    loanAmount: '',
    loanDate: '',
    fertilizer1Amount: '',
    fertilizer1Date: '',
    fertilizer2Amount: '',
    fertilizer2Date: '',
    teaPacketsCount: '',
    agrochemicalsAmount: '',
    agrochemicalsDate: '',
    otherDeductions: '',
    otherDeductionsNote: '',
  });

  // Filter customers based on search term
  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const search = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.bookNumber.toLowerCase().includes(search) ||
      c.growerNameEnglish.toLowerCase().includes(search) ||
      c.growerNameSinhala?.toLowerCase().includes(search)
    );
  }, [customers, searchTerm]);

  // Navigate to previous customer
  const handlePreviousCustomer = () => {
    if (!selectedCustomer || filteredCustomers.length === 0) return;
    const currentIndex = filteredCustomers.findIndex(c => c.id === selectedCustomer.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredCustomers.length - 1;
    setSelectedCustomer(filteredCustomers[prevIndex]);
  };

  // Navigate to next customer
  const handleNextCustomer = () => {
    if (!selectedCustomer || filteredCustomers.length === 0) return;
    const currentIndex = filteredCustomers.findIndex(c => c.id === selectedCustomer.id);
    const nextIndex = currentIndex < filteredCustomers.length - 1 ? currentIndex + 1 : 0;
    setSelectedCustomer(filteredCustomers[nextIndex]);
  };

  const resetDeductionsForm = () => {
    setDeductions({
      lastMonthArrears: '',
      advanceAmount: '',
      advanceDate: '',
      loanAmount: '',
      loanDate: '',
      fertilizer1Amount: '',
      fertilizer1Date: '',
      fertilizer2Amount: '',
      fertilizer2Date: '',
      teaPacketsCount: '',
      agrochemicalsAmount: '',
      agrochemicalsDate: '',
      otherDeductions: '',
      otherDeductionsNote: '',
    });
  };

  useEffect(() => {
    if (selectedCustomer) {
      loadData();
    } else {
      // Reset form when no customer is selected
      resetDeductionsForm();
      setMonthlyTotals(null);
    }
  }, [selectedCustomer, selectedYear, selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Calculate monthly totals
      const totals = await calculateMonthlyTotals(selectedCustomer.id, selectedYear, selectedMonth);
      setMonthlyTotals(totals);

      // Load existing deductions
      try {
        const existingDeduction = await getDeductionByCustomerAndPeriod(
          selectedCustomer.id,
          selectedYear,
          selectedMonth
        );

        if (existingDeduction) {
          setDeductions({
            lastMonthArrears: existingDeduction.lastMonthArrears || '',
            advanceAmount: existingDeduction.advanceAmount || '',
            advanceDate: existingDeduction.advanceDate || '',
            loanAmount: existingDeduction.loanAmount || '',
            loanDate: existingDeduction.loanDate || '',
            fertilizer1Amount: existingDeduction.fertilizer1Amount || '',
            fertilizer1Date: existingDeduction.fertilizer1Date || '',
            fertilizer2Amount: existingDeduction.fertilizer2Amount || '',
            fertilizer2Date: existingDeduction.fertilizer2Date || '',
            teaPacketsCount: existingDeduction.teaPacketsCount || '',
            agrochemicalsAmount: existingDeduction.agrochemicalsAmount || '',
            agrochemicalsDate: existingDeduction.agrochemicalsDate || '',
            otherDeductions: existingDeduction.otherDeductions || '',
            otherDeductionsNote: existingDeduction.otherDeductionsNote || '',
          });
        } else {
          // Reset form for new entry
          resetDeductionsForm();
        }
      } catch (error) {
        // No existing deduction found - reset form
        console.log('No existing deduction found, resetting form');
        resetDeductionsForm();
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (increment) => {
    setSelectedYear(prev => prev + increment);
  };

  const handleMonthChange = (increment) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear++;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear--;
    }

    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  const calculateTeaPacketsTotal = () => {
    if (!deductions.teaPacketsCount || !monthlyTotals?.teaPacketPrice) return 0;
    return parseFloat(deductions.teaPacketsCount) * parseFloat(monthlyTotals.teaPacketPrice);
  };

  const calculateTotalDeductions = () => {
    let total = 0;
    if (deductions.lastMonthArrears) total += parseFloat(deductions.lastMonthArrears);
    if (deductions.advanceAmount) total += parseFloat(deductions.advanceAmount);
    if (deductions.loanAmount) total += parseFloat(deductions.loanAmount);
    if (deductions.fertilizer1Amount) total += parseFloat(deductions.fertilizer1Amount);
    if (deductions.fertilizer2Amount) total += parseFloat(deductions.fertilizer2Amount);
    if (deductions.teaPacketsCount && monthlyTotals?.teaPacketPrice) {
      total += calculateTeaPacketsTotal();
    }
    if (deductions.agrochemicalsAmount) total += parseFloat(deductions.agrochemicalsAmount);
    if (monthlyTotals?.transportDeduction) total += parseFloat(monthlyTotals.transportDeduction);
    if (monthlyTotals?.stampFee) total += parseFloat(monthlyTotals.stampFee);
    if (deductions.otherDeductions) total += parseFloat(deductions.otherDeductions);
    return total;
  };

  const handleSave = async () => {
    if (!selectedCustomer) {
      showToast('Please select a customer', 'error');
      return;
    }

    setSaving(true);
    try {
      const deductionData = {
        customerId: selectedCustomer.id,
        year: selectedYear,
        month: selectedMonth,
        monthTotalAmount: monthlyTotals?.totalAmount || 0,
        lastMonthArrears: deductions.lastMonthArrears !== '' ? deductions.lastMonthArrears : null,
        advanceAmount: deductions.advanceAmount !== '' ? deductions.advanceAmount : null,
        advanceDate: deductions.advanceDate !== '' ? deductions.advanceDate : null,
        loanAmount: deductions.loanAmount !== '' ? deductions.loanAmount : null,
        loanDate: deductions.loanDate !== '' ? deductions.loanDate : null,
        fertilizer1Amount: deductions.fertilizer1Amount !== '' ? deductions.fertilizer1Amount : null,
        fertilizer1Date: deductions.fertilizer1Date !== '' ? deductions.fertilizer1Date : null,
        fertilizer2Amount: deductions.fertilizer2Amount !== '' ? deductions.fertilizer2Amount : null,
        fertilizer2Date: deductions.fertilizer2Date !== '' ? deductions.fertilizer2Date : null,
        teaPacketsCount: deductions.teaPacketsCount !== '' ? deductions.teaPacketsCount : null,
        teaPacketsTotal: calculateTeaPacketsTotal() || null,
        agrochemicalsAmount: deductions.agrochemicalsAmount !== '' ? deductions.agrochemicalsAmount : null,
        agrochemicalsDate: deductions.agrochemicalsDate !== '' ? deductions.agrochemicalsDate : null,
        transportDeduction: monthlyTotals?.transportDeduction || null,
        stampFee: monthlyTotals?.stampFee || null,
        otherDeductions: deductions.otherDeductions !== '' ? deductions.otherDeductions : null,
        otherDeductionsNote: deductions.otherDeductionsNote !== '' ? deductions.otherDeductionsNote : null,
      };

      console.log('Saving deduction data:', deductionData);
      await saveDeduction(deductionData);
      showToast('Deductions saved successfully', 'success');
    } catch (error) {
      console.error('Error saving deductions:', error);
      showToast('Failed to save deductions', 'error');
    } finally {
      setSaving(false);
    }
  };

  const totalDeductions = calculateTotalDeductions();
  const netAmount = (monthlyTotals?.totalAmount || 0) - totalDeductions;

  return (
    <div className="p-3">
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

      <div className="bg-white rounded-lg shadow-lg p-3">
        {/* Period and Customer Selector Row */}
        <div className="flex items-center gap-3 mb-3">
          {/* Period Selector */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1">
              <button onClick={() => handleYearChange(-1)} className="p-0.5 hover:bg-gray-200 rounded">
                <ChevronLeft className="w-3 h-3 text-gray-600" />
              </button>
              <span className="text-xs font-semibold text-gray-800 min-w-[50px] text-center">
                {selectedYear}
              </span>
              <button onClick={() => handleYearChange(1)} className="p-0.5 hover:bg-gray-200 rounded">
                <ChevronRight className="w-3 h-3 text-gray-600" />
              </button>
            </div>

            <div className="flex items-center gap-1 bg-gray-50 rounded px-2 py-1">
              <button onClick={() => handleMonthChange(-1)} className="p-0.5 hover:bg-gray-200 rounded">
                <ChevronLeft className="w-3 h-3 text-gray-600" />
              </button>
              <span className="text-xs font-semibold text-gray-800 min-w-[40px] text-center">
                {MONTHS[selectedMonth - 1]}
              </span>
              <button onClick={() => handleMonthChange(1)} className="p-0.5 hover:bg-gray-200 rounded">
                <ChevronRight className="w-3 h-3 text-gray-600" />
              </button>
            </div>
          </div>

          {/* Customer Navigation and Search */}
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={handlePreviousCustomer}
              disabled={!selectedCustomer}
              className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative flex-1">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
              <input
                type="text"
                placeholder="Search customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none"
              />
              {showDropdown && searchTerm && filteredCustomers.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto z-20">
                  {filteredCustomers.map(customer => (
                    <div
                      key={customer.id}
                      onClick={() => {
                        setSelectedCustomer(customer);
                        setSearchTerm('');
                        setShowDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0"
                    >
                      <div className="font-medium text-gray-800">{customer.bookNumber} - {customer.growerNameEnglish}</div>
                      {customer.growerNameSinhala && (
                        <div className="text-xs text-gray-500">{customer.growerNameSinhala}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="relative flex-1">
              <div
                onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                className="px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-100 transition-colors"
              >
                {selectedCustomer ? (
                  <span className="text-gray-800">
                    {selectedCustomer.bookNumber} - {selectedCustomer.growerNameEnglish}
                  </span>
                ) : (
                  <span className="text-gray-400">No customer selected</span>
                )}
              </div>
              {showCustomerDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowCustomerDropdown(false)}
                  />
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto z-20">
                    {customers.map(customer => (
                      <div
                        key={customer.id}
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setShowCustomerDropdown(false);
                        }}
                        className={`px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-b border-gray-100 last:border-b-0 ${
                          selectedCustomer?.id === customer.id ? 'bg-green-100' : ''
                        }`}
                      >
                        <div className="font-medium text-gray-800">{customer.bookNumber} - {customer.growerNameEnglish}</div>
                        {customer.growerNameSinhala && (
                          <div className="text-xs text-gray-500">{customer.growerNameSinhala}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button
              onClick={handleNextCustomer}
              disabled={!selectedCustomer}
              className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {selectedCustomer && monthlyTotals && !loading && (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* Monthly Total */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2">
                <div className="text-xs text-blue-600 mb-0.5">This Month Total</div>
                <div className="text-base font-bold text-blue-800">Rs. {parseFloat(monthlyTotals.totalAmount || 0).toFixed(2)}</div>
                <div className="text-xs text-blue-500">
                  G1: {parseFloat(monthlyTotals.grade1Kg || 0).toFixed(1)}kg | G2: {parseFloat(monthlyTotals.grade2Kg || 0).toFixed(1)}kg
                </div>
              </div>

              {/* Total Deductions */}
              <div className="bg-red-50 border border-red-200 rounded-lg p-2">
                <div className="text-xs text-red-600 mb-0.5">Total Deductions</div>
                <div className="text-base font-bold text-red-800">Rs. {totalDeductions.toFixed(2)}</div>
              </div>

              {/* Net Amount */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <div className="text-xs text-green-600 mb-0.5">Net Amount</div>
                <div className="text-base font-bold text-green-800">Rs. {netAmount.toFixed(2)}</div>
              </div>
            </div>

            {/* Deductions Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              {/* Last Month Arrears */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Last Month Arrears (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={deductions.lastMonthArrears}
                  onChange={(e) => setDeductions({...deductions, lastMonthArrears: e.target.value})}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                  placeholder="0.00"
                />
              </div>

              {/* Advance with Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Advance</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={deductions.advanceAmount}
                    onChange={(e) => setDeductions({...deductions, advanceAmount: e.target.value})}
                    className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                    placeholder="Amount"
                  />
                  <input
                    type="date"
                    value={deductions.advanceDate}
                    onChange={(e) => setDeductions({...deductions, advanceDate: e.target.value})}
                    className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Loan with Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Loan</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={deductions.loanAmount}
                    onChange={(e) => setDeductions({...deductions, loanAmount: e.target.value})}
                    className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                    placeholder="Amount"
                  />
                  <input
                    type="date"
                    value={deductions.loanDate}
                    onChange={(e) => setDeductions({...deductions, loanDate: e.target.value})}
                    className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Fertilizer 1 with Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fertilizer 1</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={deductions.fertilizer1Amount}
                    onChange={(e) => setDeductions({...deductions, fertilizer1Amount: e.target.value})}
                    className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                    placeholder="Amount"
                  />
                  <input
                    type="date"
                    value={deductions.fertilizer1Date}
                    onChange={(e) => setDeductions({...deductions, fertilizer1Date: e.target.value})}
                    className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Fertilizer 2 with Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Fertilizer 2</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={deductions.fertilizer2Amount}
                    onChange={(e) => setDeductions({...deductions, fertilizer2Amount: e.target.value})}
                    className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                    placeholder="Amount"
                  />
                  <input
                    type="date"
                    value={deductions.fertilizer2Date}
                    onChange={(e) => setDeductions({...deductions, fertilizer2Date: e.target.value})}
                    className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Agrochemicals with Date */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Agrochemicals</label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={deductions.agrochemicalsAmount}
                    onChange={(e) => setDeductions({...deductions, agrochemicalsAmount: e.target.value})}
                    className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                    placeholder="Amount"
                  />
                  <input
                    type="date"
                    value={deductions.agrochemicalsDate}
                    onChange={(e) => setDeductions({...deductions, agrochemicalsDate: e.target.value})}
                    className="px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                  />
                </div>
              </div>

              {/* Tea Packets Count */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tea Packets (Count)</label>
                <input
                  type="number"
                  value={deductions.teaPacketsCount}
                  onChange={(e) => setDeductions({...deductions, teaPacketsCount: e.target.value})}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                  placeholder="0"
                />
                {deductions.teaPacketsCount && monthlyTotals?.teaPacketPrice && (
                  <div className="text-xs text-gray-600 mt-1">
                    Total: Rs. {calculateTeaPacketsTotal().toFixed(2)}
                  </div>
                )}
              </div>

              {/* Transport (Auto-calculated) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Transport ({monthlyTotals?.transportPercentage || 0}%)</label>
                <input
                  type="text"
                  value={`Rs. ${parseFloat(monthlyTotals?.transportDeduction || 0).toFixed(2)}`}
                  disabled
                  className="w-full px-2 py-1.5 border border-gray-300 rounded bg-gray-100 text-sm"
                />
              </div>

              {/* Stamp Fee (Auto-calculated) */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Stamp Fee</label>
                <input
                  type="text"
                  value={`Rs. ${parseFloat(monthlyTotals?.stampFee || 0).toFixed(2)}`}
                  disabled
                  className="w-full px-2 py-1.5 border border-gray-300 rounded bg-gray-100 text-sm"
                />
              </div>

              {/* Other Deductions */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Other Deductions (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={deductions.otherDeductions}
                  onChange={(e) => setDeductions({...deductions, otherDeductions: e.target.value})}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                  placeholder="0.00"
                />
              </div>

              {/* Other Deductions Note - Full Width */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Other Deductions Note</label>
                <input
                  type="text"
                  value={deductions.otherDeductionsNote}
                  onChange={(e) => setDeductions({...deductions, otherDeductionsNote: e.target.value})}
                  className="w-full px-2 py-1.5 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm"
                  placeholder="Note..."
                />
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save Deductions'}
              </button>
            </div>
          </>
        )}

        {loading && (
          <div className="text-center py-8">
            <div className="text-gray-500">Loading...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeductionsPage;
