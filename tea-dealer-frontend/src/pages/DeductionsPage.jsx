import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Save, Search, Plus, Trash2, Calendar } from 'lucide-react';
import { useCustomerContext } from '../contexts/CustomerContext';
import { getDeductionByCustomerAndPeriod, calculateMonthlyTotals, saveDeduction, getAutoArrears } from '../services/deductionService';
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
  const [autoArrearsInfo, setAutoArrearsInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // New advance entry input state
  const [newAdvanceAmount, setNewAdvanceAmount] = useState('');
  const [newAdvanceDate, setNewAdvanceDate] = useState('');
  const [showAdvanceDatePicker, setShowAdvanceDatePicker] = useState(false);

  // Set first customer as default
  useEffect(() => {
    if (customers.length > 0 && !selectedCustomer) {
      setSelectedCustomer(customers[0]);
    }
  }, [customers, selectedCustomer]);

  const [deductions, setDeductions] = useState({
    lastMonthArrears: '',
    advanceEntries: [], // [{date, amount}, ...]
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
      advanceEntries: [],
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
      setAutoArrearsInfo(null);
    }
  }, [selectedCustomer, selectedYear, selectedMonth]);

  const loadData = async () => {
    setLoading(true);
    // Reset form immediately when switching customers to prevent stale data
    resetDeductionsForm();
    setAutoArrearsInfo(null);

    try {
      // Calculate monthly totals and fetch auto-arrears in parallel
      const [totals, autoArrears] = await Promise.all([
        calculateMonthlyTotals(selectedCustomer.id, selectedYear, selectedMonth),
        getAutoArrears(selectedCustomer.id, selectedYear, selectedMonth)
      ]);
      setMonthlyTotals(totals);
      setAutoArrearsInfo(autoArrears);

      // Load existing deductions (returns null if not found)
      const existingDeduction = await getDeductionByCustomerAndPeriod(
        selectedCustomer.id,
        selectedYear,
        selectedMonth
      );

      if (existingDeduction) {
        // Parse advance entries from JSON
        let advanceEntries = [];
        try {
          if (existingDeduction.advanceEntries) {
            advanceEntries = typeof existingDeduction.advanceEntries === 'string'
              ? JSON.parse(existingDeduction.advanceEntries)
              : existingDeduction.advanceEntries;
          }
        } catch (e) {
          console.error('Error parsing advance entries:', e);
          advanceEntries = [];
        }

        setDeductions({
          lastMonthArrears: existingDeduction.lastMonthArrears || '',
          advanceEntries: advanceEntries,
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
      }
      // If no existing deduction, form is already reset above
    } catch (error) {
      console.error('Error loading data:', error);
      // Don't show error toast for normal "not found" cases
      if (!error.message?.includes('404') && !error.message?.includes('Not Found')) {
        showToast('Error loading data', 'error');
      }
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

  // Calculate total from advance entries
  const calculateAdvanceTotal = () => {
    return deductions.advanceEntries.reduce((sum, entry) => sum + (parseFloat(entry.amount) || 0), 0);
  };

  // Advance entry management functions
  const addAdvanceEntry = () => {
    if (!newAdvanceAmount || parseFloat(newAdvanceAmount) <= 0) return;

    // Use selected date or default to today
    const entryDate = newAdvanceDate || new Date().toISOString().split('T')[0];

    setDeductions({
      ...deductions,
      advanceEntries: [...deductions.advanceEntries, { date: entryDate, amount: newAdvanceAmount }]
    });

    // Reset input fields
    setNewAdvanceAmount('');
    setNewAdvanceDate('');
    setShowAdvanceDatePicker(false);
  };

  const removeAdvanceEntry = (index) => {
    setDeductions({
      ...deductions,
      advanceEntries: deductions.advanceEntries.filter((_, i) => i !== index)
    });
  };

  const calculateTotalDeductions = () => {
    let total = 0;
    // Include auto-arrears if enabled
    if (autoArrearsInfo?.autoArrearsEnabled && autoArrearsInfo?.autoArrearsAmount) {
      total += parseFloat(autoArrearsInfo.autoArrearsAmount);
    }
    // Include manual arrears
    if (deductions.lastMonthArrears) total += parseFloat(deductions.lastMonthArrears);
    total += calculateAdvanceTotal();
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
        advanceAmount: calculateAdvanceTotal() || null,
        advanceEntries: JSON.stringify(deductions.advanceEntries),
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
      console.log('advanceEntries being saved:', deductions.advanceEntries, '-> stringified:', JSON.stringify(deductions.advanceEntries));
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

          {/* Customer Search */}
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 z-10" />
            <input
              type="text"
              placeholder="Search customer..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              className="w-full pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none"
            />
            {showDropdown && searchTerm && filteredCustomers.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto z-20">
                {filteredCustomers.map(customer => (
                  <div
                    key={customer.id}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
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

          {/* Customer Navigation - Arrow | Dropdown | Arrow */}
          <div className="flex items-center gap-2 flex-1">
            <button
              onClick={handlePreviousCustomer}
              disabled={!selectedCustomer}
              className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

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
                  Collected: {Math.round(parseFloat(monthlyTotals.totalKg || 0))}kg
                  {monthlyTotals.supplyDeductionKg > 0 && (
                    <span className="text-orange-500 ml-1">
                      (-{Math.round(parseFloat(monthlyTotals.supplyDeductionKg))}kg)
                    </span>
                  )}
                  {' = '}Payable: {Math.round(parseFloat(monthlyTotals.payableKg || 0))}kg
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

            {/* Auto Arrears Info Banner */}
            {autoArrearsInfo?.autoArrearsEnabled && autoArrearsInfo?.autoArrearsAmount > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-semibold text-orange-700">Auto Arrears from Previous Month</span>
                    <p className="text-xs text-orange-600 mt-0.5">
                      {MONTHS[autoArrearsInfo.previousMonth - 1]} {autoArrearsInfo.previousYear} had negative net pay of Rs. {Math.abs(parseFloat(autoArrearsInfo.previousNetAmount || 0)).toFixed(2)}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-800">Rs. {parseFloat(autoArrearsInfo.autoArrearsAmount).toFixed(2)}</div>
                    <span className="text-xs text-orange-500">Will be added automatically</span>
                  </div>
                </div>
              </div>
            )}

            {/* Deductions Form */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-3">
              {/* Additional Manual Arrears */}
              <div>
                <label className="block text-xs font-medium text-rose-700 mb-1">
                  {autoArrearsInfo?.autoArrearsEnabled ? 'Additional Arrears (Rs.)' : 'Arrears (Rs.)'}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={deductions.lastMonthArrears}
                  onChange={(e) => setDeductions({...deductions, lastMonthArrears: e.target.value})}
                  className="w-full px-2 py-1.5 border border-rose-300 rounded focus:ring-1 focus:ring-rose-500 outline-none text-sm bg-rose-50"
                  placeholder="0.00"
                />
                {autoArrearsInfo?.autoArrearsEnabled && !autoArrearsInfo?.autoArrearsAmount && (
                  <p className="text-xs text-gray-400 mt-0.5">No auto-arrears (prev. month OK)</p>
                )}
              </div>

              {/* Advance with Add button */}
              <div>
                <label className="block text-xs font-medium text-blue-700 mb-1">
                  Advance (Rs.)
                  {calculateAdvanceTotal() > 0 && (
                    <span className="text-blue-500 ml-1">({deductions.advanceEntries.length} entries)</span>
                  )}
                </label>
                <div className="flex gap-1">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      step="0.01"
                      value={newAdvanceAmount}
                      onChange={(e) => setNewAdvanceAmount(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && addAdvanceEntry()}
                      className="w-full px-2 py-1.5 pr-7 border border-blue-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-sm bg-blue-50"
                      placeholder="0.00"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2">
                      <button
                        type="button"
                        onClick={() => setShowAdvanceDatePicker(!showAdvanceDatePicker)}
                        className={`p-0.5 rounded hover:bg-blue-200 ${newAdvanceDate ? 'text-blue-600' : 'text-gray-400'}`}
                        title={newAdvanceDate || 'Select date (optional)'}
                      >
                        <Calendar className="w-4 h-4" />
                      </button>
                    </div>
                    {showAdvanceDatePicker && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowAdvanceDatePicker(false)} />
                        <div className="absolute top-full right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg p-2 z-20">
                          <input
                            type="date"
                            value={newAdvanceDate}
                            onChange={(e) => {
                              setNewAdvanceDate(e.target.value);
                              setShowAdvanceDatePicker(false);
                            }}
                            className="px-2 py-1 border border-gray-300 rounded text-sm"
                          />
                        </div>
                      </>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={addAdvanceEntry}
                    disabled={!newAdvanceAmount || parseFloat(newAdvanceAmount) <= 0}
                    className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
                    title="Add advance entry"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Loan */}
              <div>
                <label className="block text-xs font-medium text-purple-700 mb-1">Loan (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={deductions.loanAmount}
                  onChange={(e) => setDeductions({...deductions, loanAmount: e.target.value})}
                  className="w-full px-2 py-1.5 border border-purple-300 rounded focus:ring-1 focus:ring-purple-500 outline-none text-sm bg-purple-50"
                  placeholder="0.00"
                />
              </div>

              {/* Fertilizer 1 */}
              <div>
                <label className="block text-xs font-medium text-green-700 mb-1">Fertilizer 1 (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={deductions.fertilizer1Amount}
                  onChange={(e) => setDeductions({...deductions, fertilizer1Amount: e.target.value})}
                  className="w-full px-2 py-1.5 border border-green-300 rounded focus:ring-1 focus:ring-green-500 outline-none text-sm bg-green-50"
                  placeholder="0.00"
                />
              </div>

              {/* Fertilizer 2 */}
              <div>
                <label className="block text-xs font-medium text-emerald-700 mb-1">Fertilizer 2 (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={deductions.fertilizer2Amount}
                  onChange={(e) => setDeductions({...deductions, fertilizer2Amount: e.target.value})}
                  className="w-full px-2 py-1.5 border border-emerald-300 rounded focus:ring-1 focus:ring-emerald-500 outline-none text-sm bg-emerald-50"
                  placeholder="0.00"
                />
              </div>

              {/* Agrochemicals */}
              <div>
                <label className="block text-xs font-medium text-cyan-700 mb-1">Agrochemicals (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={deductions.agrochemicalsAmount}
                  onChange={(e) => setDeductions({...deductions, agrochemicalsAmount: e.target.value})}
                  className="w-full px-2 py-1.5 border border-cyan-300 rounded focus:ring-1 focus:ring-cyan-500 outline-none text-sm bg-cyan-50"
                  placeholder="0.00"
                />
              </div>

              {/* Tea Packets Count */}
              <div>
                <label className="block text-xs font-medium text-amber-700 mb-1">
                  Tea Packets
                  {deductions.teaPacketsCount && monthlyTotals?.teaPacketPrice && (
                    <span className="text-amber-600 ml-1">(Rs. {calculateTeaPacketsTotal().toFixed(0)})</span>
                  )}
                </label>
                <input
                  type="number"
                  value={deductions.teaPacketsCount}
                  onChange={(e) => setDeductions({...deductions, teaPacketsCount: e.target.value})}
                  className="w-full px-2 py-1.5 border border-amber-300 rounded focus:ring-1 focus:ring-amber-500 outline-none text-sm bg-amber-50"
                  placeholder="Count"
                />
              </div>

              {/* Other Deductions */}
              <div>
                <label className="block text-xs font-medium text-pink-700 mb-1">Other (Rs.)</label>
                <input
                  type="number"
                  step="0.01"
                  value={deductions.otherDeductions}
                  onChange={(e) => setDeductions({...deductions, otherDeductions: e.target.value})}
                  className="w-full px-2 py-1.5 border border-pink-300 rounded focus:ring-1 focus:ring-pink-500 outline-none text-sm bg-pink-50"
                  placeholder="0.00"
                />
              </div>

              {/* Transport (Auto-calculated) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">
                  Transport {monthlyTotals?.transportRatePerKg > 0 && `(@${parseFloat(monthlyTotals.transportRatePerKg).toFixed(1)}/kg)`}
                </label>
                <input
                  type="text"
                  value={`Rs. ${parseFloat(monthlyTotals?.transportDeduction || 0).toFixed(2)}`}
                  disabled
                  className="w-full px-2 py-1.5 border border-gray-200 rounded bg-gray-100 text-sm text-gray-600"
                />
              </div>

              {/* Stamp Fee (Auto-calculated) */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Stamp Fee</label>
                <input
                  type="text"
                  value={`Rs. ${parseFloat(monthlyTotals?.stampFee || 0).toFixed(2)}`}
                  disabled
                  className="w-full px-2 py-1.5 border border-gray-200 rounded bg-gray-100 text-sm text-gray-600"
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

            {/* Advance Entries Display Section */}
            {deductions.advanceEntries.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-blue-700">
                    Advance Payments
                    <span className="ml-2 text-blue-600">(Total: Rs. {calculateAdvanceTotal().toFixed(2)})</span>
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  {deductions.advanceEntries.map((entry, index) => (
                    <div key={index} className="flex items-center gap-2 bg-white px-3 py-1.5 rounded border border-blue-200">
                      <span className="text-xs text-gray-500">
                        {entry.date ? new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) : 'No date'}
                      </span>
                      <span className="text-sm font-medium text-blue-800">Rs. {parseFloat(entry.amount).toFixed(2)}</span>
                      <button
                        type="button"
                        onClick={() => removeAdvanceEntry(index)}
                        className="p-0.5 text-red-500 hover:bg-red-100 rounded"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
