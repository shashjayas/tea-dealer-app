import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Package, Truck, Search } from 'lucide-react';
import { useCustomerContext } from '../contexts/CustomerContext';
import {
  getFertilizerTypes,
  getStockByPeriod,
  addStock,
  getAvailableStock,
  getSuppliesByPeriod,
  recordSupply,
  deleteSupply
} from '../services/fertilizerService';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const FertilizerManagementPage = () => {
  const { customers } = useCustomerContext();
  const { toasts, showToast, removeToast } = useToast();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [activeTab, setActiveTab] = useState('supply');

  // Fertilizer types state
  const [fertilizerTypes, setFertilizerTypes] = useState([]);

  // Stock state
  const [stockData, setStockData] = useState([]);
  const [availableStock, setAvailableStock] = useState({});
  const [stockForm, setStockForm] = useState({ fertilizerTypeId: '', bagSizeKg: '', bagsCount: '', notes: '' });

  // Supply state
  const [supplies, setSupplies] = useState([]);
  const [supplyForm, setSupplyForm] = useState({
    customerId: '',
    fertilizerTypeId: '',
    supplyDate: new Date().toISOString().split('T')[0],
    bagSizeKg: '',
    bagsCount: '1',
    notes: ''
  });
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const [loading, setLoading] = useState(false);

  // Load fertilizer types
  useEffect(() => {
    loadFertilizerTypes();
  }, []);

  // Load stock and supplies when period changes
  useEffect(() => {
    loadStockData();
    loadSupplies();
  }, [selectedYear, selectedMonth]);

  // Load available stock for each type
  useEffect(() => {
    if (fertilizerTypes.length > 0) {
      loadAvailableStock();
    }
  }, [fertilizerTypes, selectedYear, selectedMonth, supplies]);

  const loadFertilizerTypes = async () => {
    try {
      const types = await getFertilizerTypes();
      setFertilizerTypes(types || []);
    } catch (error) {
      console.error('Error loading fertilizer types:', error);
    }
  };

  const loadStockData = async () => {
    try {
      const stock = await getStockByPeriod(selectedYear, selectedMonth);
      setStockData(stock || []);
    } catch (error) {
      console.error('Error loading stock:', error);
    }
  };

  const loadAvailableStock = async () => {
    const stockMap = {};
    for (const type of fertilizerTypes) {
      try {
        const result = await getAvailableStock(type.id, selectedYear, selectedMonth);
        stockMap[type.id] = result.availableKg;
      } catch (error) {
        stockMap[type.id] = 0;
      }
    }
    setAvailableStock(stockMap);
  };

  const loadSupplies = async () => {
    try {
      const data = await getSuppliesByPeriod(selectedYear, selectedMonth);
      setSupplies(data || []);
    } catch (error) {
      console.error('Error loading supplies:', error);
    }
  };

  // Stock handlers
  const handleAddStock = async () => {
    if (!stockForm.fertilizerTypeId || !stockForm.bagSizeKg || !stockForm.bagsCount) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    try {
      await addStock({
        fertilizerTypeId: stockForm.fertilizerTypeId,
        year: selectedYear,
        month: selectedMonth,
        bagSizeKg: stockForm.bagSizeKg,
        bagsCount: parseInt(stockForm.bagsCount),
        notes: stockForm.notes
      });
      showToast('Stock added successfully', 'success');
      setStockForm({ fertilizerTypeId: '', bagSizeKg: '', bagsCount: '', notes: '' });
      loadStockData();
      loadAvailableStock();
    } catch (error) {
      showToast('Error adding stock', 'error');
    }
  };

  // Supply handlers
  const handleRecordSupply = async () => {
    if (!selectedCustomer || !supplyForm.fertilizerTypeId || !supplyForm.bagSizeKg || !supplyForm.bagsCount) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    try {
      await recordSupply({
        customerId: selectedCustomer.id,
        fertilizerTypeId: supplyForm.fertilizerTypeId,
        supplyDate: supplyForm.supplyDate,
        bagSizeKg: supplyForm.bagSizeKg,
        bagsCount: parseInt(supplyForm.bagsCount),
        notes: supplyForm.notes
      });
      showToast('Supply recorded successfully', 'success');
      setSupplyForm({
        customerId: '',
        fertilizerTypeId: supplyForm.fertilizerTypeId,
        supplyDate: new Date().toISOString().split('T')[0],
        bagSizeKg: supplyForm.bagSizeKg,
        bagsCount: '1',
        notes: ''
      });
      setSelectedCustomer(null);
      setCustomerSearch('');
      loadSupplies();
      loadAvailableStock();
    } catch (error) {
      showToast('Error recording supply', 'error');
    }
  };

  const handleDeleteSupply = (supply) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Supply Record',
      message: `Delete supply of ${supply.quantityKg}kg to ${supply.customer.growerNameEnglish}?`,
      onConfirm: async () => {
        try {
          await deleteSupply(supply.id);
          showToast('Supply record deleted', 'success');
          loadSupplies();
          loadAvailableStock();
        } catch (error) {
          showToast('Error deleting supply', 'error');
        }
      }
    });
  };

  // Get bag sizes for selected type
  const getSelectedTypeBagSizes = (typeId) => {
    const type = fertilizerTypes.find(t => t.id === parseInt(typeId));
    if (!type) return [];
    return type.bagSizes.split(',').map(s => s.trim());
  };

  // Filter customers
  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 10);
    const search = customerSearch.toLowerCase();
    return customers.filter(c =>
      c.bookNumber.toLowerCase().includes(search) ||
      c.growerNameEnglish.toLowerCase().includes(search) ||
      c.growerNameSinhala?.toLowerCase().includes(search)
    ).slice(0, 10);
  }, [customers, customerSearch]);

  const handleYearChange = (increment) => setSelectedYear(prev => prev + increment);

  const handleMonthChange = (increment) => {
    let newMonth = selectedMonth + increment;
    let newYear = selectedYear;
    if (newMonth > 12) { newMonth = 1; newYear++; }
    else if (newMonth < 1) { newMonth = 12; newYear--; }
    setSelectedMonth(newMonth);
    setSelectedYear(newYear);
  };

  return (
    <div className="p-3">
      {toasts.map(toast => (
        <Toast key={toast.id} message={toast.message} type={toast.type} duration={toast.duration} onClose={() => removeToast(toast.id)} />
      ))}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => { if (confirmDialog.onConfirm) confirmDialog.onConfirm(); setConfirmDialog({ isOpen: false }); }}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />

      <div className="bg-white rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-gray-800">Fertilizer Management</h1>
            {/* Period Selector */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                <button onClick={() => handleYearChange(-1)} className="p-0.5 hover:bg-gray-200 rounded">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm font-semibold text-gray-800 min-w-[50px] text-center">{selectedYear}</span>
                <button onClick={() => handleYearChange(1)} className="p-0.5 hover:bg-gray-200 rounded">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
              <div className="flex items-center gap-1 bg-gray-100 rounded px-2 py-1">
                <button onClick={() => handleMonthChange(-1)} className="p-0.5 hover:bg-gray-200 rounded">
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-sm font-semibold text-gray-800 min-w-[40px] text-center">{MONTHS[selectedMonth - 1]}</span>
                <button onClick={() => handleMonthChange(1)} className="p-0.5 hover:bg-gray-200 rounded">
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setActiveTab('supply')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'supply' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <Truck className="w-4 h-4 inline mr-1" /> Supply
            </button>
            <button
              onClick={() => setActiveTab('stock')}
              className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'stock' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
            >
              <Package className="w-4 h-4 inline mr-1" /> Stock
            </button>
          </div>
        </div>

        {/* Supply Tab */}
        {activeTab === 'supply' && (
          <div>
            {/* Supply Form */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <div className="grid grid-cols-6 gap-3">
                {/* Customer Search */}
                <div className="col-span-2 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      value={selectedCustomer ? `${selectedCustomer.bookNumber} - ${selectedCustomer.growerNameEnglish}` : customerSearch}
                      onChange={(e) => { setCustomerSearch(e.target.value); setSelectedCustomer(null); }}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                      placeholder="Search customer..."
                      className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                    />
                    {showCustomerDropdown && filteredCustomers.length > 0 && !selectedCustomer && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto z-20">
                        {filteredCustomers.map(customer => (
                          <div
                            key={customer.id}
                            onMouseDown={(e) => { e.preventDefault(); setSelectedCustomer(customer); setShowCustomerDropdown(false); }}
                            className="px-3 py-2 hover:bg-green-50 cursor-pointer border-b border-gray-100"
                          >
                            <span className="font-medium">{customer.bookNumber}</span> - {customer.growerNameEnglish}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Fertilizer Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                  <select
                    value={supplyForm.fertilizerTypeId}
                    onChange={(e) => setSupplyForm({ ...supplyForm, fertilizerTypeId: e.target.value, bagSizeKg: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                  >
                    <option value="">Select type</option>
                    {fertilizerTypes.filter(t => t.active).map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                {/* Bag Size */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bag Size</label>
                  <select
                    value={supplyForm.bagSizeKg}
                    onChange={(e) => setSupplyForm({ ...supplyForm, bagSizeKg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                    disabled={!supplyForm.fertilizerTypeId}
                  >
                    <option value="">Select size</option>
                    {getSelectedTypeBagSizes(supplyForm.fertilizerTypeId).map(size => (
                      <option key={size} value={size}>{size}kg</option>
                    ))}
                  </select>
                </div>

                {/* Bags Count */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bags</label>
                  <input
                    type="number"
                    min="1"
                    value={supplyForm.bagsCount}
                    onChange={(e) => setSupplyForm({ ...supplyForm, bagsCount: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                  />
                </div>

                {/* Record Button */}
                <div className="flex items-end">
                  <button
                    onClick={handleRecordSupply}
                    className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                  >
                    <Plus className="w-4 h-4" /> Record
                  </button>
                </div>
              </div>

              {/* Date and Total Display */}
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-green-200">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="text-sm text-gray-600 mr-2">Date:</label>
                    <input
                      type="date"
                      value={supplyForm.supplyDate}
                      onChange={(e) => setSupplyForm({ ...supplyForm, supplyDate: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-600 mr-2">Notes:</label>
                    <input
                      type="text"
                      value={supplyForm.notes}
                      onChange={(e) => setSupplyForm({ ...supplyForm, notes: e.target.value })}
                      className="px-2 py-1 border border-gray-300 rounded text-sm w-48"
                      placeholder="Optional notes..."
                    />
                  </div>
                </div>
                {supplyForm.bagSizeKg && supplyForm.bagsCount && (
                  <div className="text-lg font-bold text-green-700">
                    Total: {parseFloat(supplyForm.bagSizeKg) * parseInt(supplyForm.bagsCount || 0)}kg
                  </div>
                )}
              </div>
            </div>

            {/* Available Stock Summary */}
            <div className="flex gap-2 mb-4 flex-wrap">
              {fertilizerTypes.filter(t => t.active).map(type => (
                <div key={type.id} className="bg-blue-50 border border-blue-200 rounded px-3 py-1.5">
                  <span className="text-blue-700 font-medium">{type.name}:</span>
                  <span className={`ml-2 font-bold ${(availableStock[type.id] || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {(availableStock[type.id] || 0).toFixed(0)}kg
                  </span>
                </div>
              ))}
            </div>

            {/* Supply Records Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Date</th>
                    <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Customer</th>
                    <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Type</th>
                    <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Quantity</th>
                    <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Notes</th>
                    <th className="px-3 py-2 text-center text-gray-700 font-semibold border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {supplies.length > 0 ? supplies.map(supply => (
                    <tr key={supply.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2">{new Date(supply.supplyDate).toLocaleDateString()}</td>
                      <td className="px-3 py-2">
                        <span className="font-medium">{supply.customer.bookNumber}</span>
                        <span className="text-gray-500 ml-1">- {supply.customer.growerNameEnglish}</span>
                      </td>
                      <td className="px-3 py-2">{supply.fertilizerType.name}</td>
                      <td className="px-3 py-2 text-right font-semibold">
                        {supply.bagsCount} × {supply.bagSizeKg}kg = <span className="text-green-700">{supply.quantityKg}kg</span>
                      </td>
                      <td className="px-3 py-2 text-gray-500 text-sm">{supply.notes || '-'}</td>
                      <td className="px-3 py-2 text-center">
                        <button onClick={() => handleDeleteSupply(supply)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="6" className="px-3 py-8 text-center text-gray-500">No supply records for this month</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Stock Tab */}
        {activeTab === 'stock' && (
          <div>
            {/* Add Stock Form */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-blue-800 mb-3">Add Stock for {MONTHS[selectedMonth - 1]} {selectedYear}</h3>
              <div className="grid grid-cols-5 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fertilizer Type</label>
                  <select
                    value={stockForm.fertilizerTypeId}
                    onChange={(e) => setStockForm({ ...stockForm, fertilizerTypeId: e.target.value, bagSizeKg: '' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  >
                    <option value="">Select type</option>
                    {fertilizerTypes.filter(t => t.active).map(type => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bag Size</label>
                  <select
                    value={stockForm.bagSizeKg}
                    onChange={(e) => setStockForm({ ...stockForm, bagSizeKg: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                    disabled={!stockForm.fertilizerTypeId}
                  >
                    <option value="">Select size</option>
                    {getSelectedTypeBagSizes(stockForm.fertilizerTypeId).map(size => (
                      <option key={size} value={size}>{size}kg</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Number of Bags</label>
                  <input
                    type="number"
                    min="1"
                    value={stockForm.bagsCount}
                    onChange={(e) => setStockForm({ ...stockForm, bagsCount: e.target.value })}
                    placeholder="e.g., 10"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <input
                    type="text"
                    value={stockForm.notes}
                    onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div className="flex items-end">
                  <button onClick={handleAddStock} className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                    <Plus className="w-4 h-4" /> Add Stock
                  </button>
                </div>
              </div>
              {stockForm.bagSizeKg && stockForm.bagsCount && (
                <div className="mt-2 text-blue-700 font-medium">
                  Total: {parseFloat(stockForm.bagSizeKg) * parseInt(stockForm.bagsCount || 0)}kg
                </div>
              )}
            </div>

            {/* Stock Summary Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Fertilizer Type</th>
                    <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Stock by Bag Size</th>
                    <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Total Added</th>
                    <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Available</th>
                  </tr>
                </thead>
                <tbody>
                  {fertilizerTypes.filter(t => t.active).map(type => {
                    // Get all stock entries for this type
                    const typeStocks = stockData.filter(s => s.fertilizerType.id === type.id);
                    const totalKg = typeStocks.reduce((sum, s) => sum + parseFloat(s.stockAddedKg || 0), 0);
                    const bagSizes = type.bagSizes.split(',').map(s => s.trim());

                    return (
                      <tr key={type.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2 font-medium">{type.name}</td>
                        <td className="px-3 py-2">
                          <div className="flex flex-wrap gap-2">
                            {bagSizes.map(size => {
                              const stockForSize = typeStocks.find(s => parseFloat(s.bagSizeKg) === parseFloat(size));
                              const bags = stockForSize ? stockForSize.bagsAdded : 0;
                              return (
                                <span
                                  key={size}
                                  className={`inline-flex items-center px-2 py-1 rounded text-sm ${
                                    bags > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-400'
                                  }`}
                                >
                                  <span className="font-medium">{size}kg:</span>
                                  <span className="ml-1 font-bold">{bags}</span>
                                  <span className="ml-0.5 text-xs">bags</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-medium">
                          {totalKg > 0 ? `${totalKg.toFixed(0)}kg` : '-'}
                        </td>
                        <td className={`px-3 py-2 text-right font-bold ${(availableStock[type.id] || 0) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {(availableStock[type.id] || 0).toFixed(0)}kg
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default FertilizerManagementPage;
