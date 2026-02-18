import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Trash2, Package, Truck, Search, Leaf, Coffee, AlertTriangle } from 'lucide-react';
import { useCustomerContext } from '../contexts/CustomerContext';
import {
  getFertilizerTypes,
  getStockByPeriod,
  addStock,
  deleteStock,
  getAvailableStock,
  getAvailableBagsByTypeAndSize,
  getSuppliesByPeriod,
  recordSupply,
  deleteSupply
} from '../services/fertilizerService';
import {
  getTeaPacketStock,
  addTeaPacketStock,
  deleteTeaPacketStock,
  getTeaPacketSupplies,
  recordTeaPacketSupply,
  deleteTeaPacketSupply,
  getActiveTeaPacketTypes,
  getAvailablePacketsByTypeAndWeight
} from '../services/teaPacketService';
import { getPageVisibilitySettings } from '../services/settingsService';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const StockManagementPage = () => {
  const { customers } = useCustomerContext();
  const { toasts, showToast, removeToast } = useToast();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [mainTab, setMainTab] = useState(null); // 'fertilizer' or 'teaPackets'
  const [activeTab, setActiveTab] = useState('supply');

  // Tab visibility settings
  const [tabVisibility, setTabVisibility] = useState({
    fertilizerTabEnabled: true,
    teaPacketsTabEnabled: true,
  });

  // Fertilizer types state
  const [fertilizerTypes, setFertilizerTypes] = useState([]);

  // Stock state
  const [stockData, setStockData] = useState([]);
  const [availableStock, setAvailableStock] = useState({});
  const [availableBagsBySize, setAvailableBagsBySize] = useState({}); // { "typeId-bagSize": availableBags }
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

  // Tea Packet state
  const [teaPacketTypes, setTeaPacketTypes] = useState([]);
  const [teaPacketStock, setTeaPacketStock] = useState({ totalPackets: 0, availablePackets: 0, stockList: [] });
  const [teaPacketSupplies, setTeaPacketSupplies] = useState([]);
  const [availablePacketsByWeight, setAvailablePacketsByWeight] = useState({}); // { "typeId-weight": availablePackets }
  const [teaStockForm, setTeaStockForm] = useState({ teaPacketTypeId: '', packetWeightGrams: '', packetsCount: '', notes: '' });
  const [teaSupplyForm, setTeaSupplyForm] = useState({
    teaPacketTypeId: '',
    packetWeightGrams: '',
    supplyDate: new Date().toISOString().split('T')[0],
    packetsCount: '1',
    notes: ''
  });
  const [teaCustomerSearch, setTeaCustomerSearch] = useState('');
  const [showTeaCustomerDropdown, setShowTeaCustomerDropdown] = useState(false);
  const [selectedTeaCustomer, setSelectedTeaCustomer] = useState(null);

  // Confirm dialog
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const [loading, setLoading] = useState(false);

  // Load tab visibility settings
  useEffect(() => {
    const loadTabVisibility = async () => {
      try {
        const settings = await getPageVisibilitySettings();
        setTabVisibility({
          fertilizerTabEnabled: settings.fertilizerTabEnabled,
          teaPacketsTabEnabled: settings.teaPacketsTabEnabled,
        });
        // Auto-select first enabled tab
        if (settings.fertilizerTabEnabled) {
          setMainTab('fertilizer');
        } else if (settings.teaPacketsTabEnabled) {
          setMainTab('teaPackets');
        }
      } catch (e) {
        console.error('Error loading tab visibility settings:', e);
        setMainTab('fertilizer'); // Default to fertilizer on error
      }
    };
    loadTabVisibility();
  }, []);

  // Load fertilizer types
  useEffect(() => {
    if (mainTab === 'fertilizer') {
      loadFertilizerTypes();
    }
  }, [mainTab]);

  // Load tea packet types
  useEffect(() => {
    if (mainTab === 'teaPackets') {
      loadTeaPacketTypes();
    }
  }, [mainTab]);

  // Load stock and supplies when period changes
  useEffect(() => {
    if (mainTab === 'fertilizer') {
      loadStockData();
      loadSupplies();
    } else {
      loadTeaPacketData();
    }
  }, [selectedYear, selectedMonth, mainTab]);

  // Load available stock for each type
  useEffect(() => {
    if (fertilizerTypes.length > 0 && mainTab === 'fertilizer') {
      loadAvailableStock();
      loadAvailableBagsBySize();
    }
  }, [fertilizerTypes, selectedYear, selectedMonth, supplies, stockData, mainTab]);

  // Load available packets for each type and weight
  useEffect(() => {
    if (teaPacketTypes.length > 0 && mainTab === 'teaPackets') {
      loadAvailablePacketsByWeight();
    }
  }, [teaPacketTypes, selectedYear, selectedMonth, teaPacketSupplies, teaPacketStock, mainTab]);

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

  const loadAvailableBagsBySize = async () => {
    const bagsMap = {};
    for (const type of fertilizerTypes) {
      const bagSizes = type.bagSizes?.split(',').map(s => s.trim()) || [];
      for (const size of bagSizes) {
        try {
          const result = await getAvailableBagsByTypeAndSize(type.id, size, selectedYear, selectedMonth);
          bagsMap[`${type.id}-${size}`] = result.availableBags;
        } catch (error) {
          bagsMap[`${type.id}-${size}`] = 0;
        }
      }
    }
    setAvailableBagsBySize(bagsMap);
  };

  const loadSupplies = async () => {
    try {
      const data = await getSuppliesByPeriod(selectedYear, selectedMonth);
      setSupplies(data || []);
    } catch (error) {
      console.error('Error loading supplies:', error);
    }
  };

  const loadTeaPacketTypes = async () => {
    try {
      const types = await getActiveTeaPacketTypes();
      setTeaPacketTypes(types || []);
    } catch (error) {
      console.error('Error loading tea packet types:', error);
    }
  };

  // Tea Packet functions
  const loadTeaPacketData = async () => {
    try {
      const [stock, suppliesData] = await Promise.all([
        getTeaPacketStock(selectedYear, selectedMonth),
        getTeaPacketSupplies(selectedYear, selectedMonth)
      ]);
      setTeaPacketStock(stock || { totalPackets: 0, availablePackets: 0, stockList: [] });
      setTeaPacketSupplies(suppliesData || []);
    } catch (error) {
      console.error('Error loading tea packet data:', error);
    }
  };

  const loadAvailablePacketsByWeight = async () => {
    const packetsMap = {};
    for (const type of teaPacketTypes) {
      const weights = type.packetWeights?.split(',').map(w => w.trim()) || [];
      for (const weight of weights) {
        try {
          const result = await getAvailablePacketsByTypeAndWeight(type.id, weight, selectedYear, selectedMonth);
          packetsMap[`${type.id}-${weight}`] = result.availablePackets;
        } catch (error) {
          packetsMap[`${type.id}-${weight}`] = 0;
        }
      }
    }
    setAvailablePacketsByWeight(packetsMap);
  };

  const handleAddTeaStock = async () => {
    if (!teaStockForm.teaPacketTypeId || !teaStockForm.packetWeightGrams || !teaStockForm.packetsCount || parseInt(teaStockForm.packetsCount) <= 0) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    try {
      await addTeaPacketStock({
        teaPacketTypeId: parseInt(teaStockForm.teaPacketTypeId),
        year: selectedYear,
        month: selectedMonth,
        packetWeightGrams: parseFloat(teaStockForm.packetWeightGrams),
        packetsCount: parseInt(teaStockForm.packetsCount),
        notes: teaStockForm.notes
      });
      showToast('Tea packet stock added successfully', 'success');
      setTeaStockForm({ teaPacketTypeId: teaStockForm.teaPacketTypeId, packetWeightGrams: '', packetsCount: '', notes: '' });
      loadTeaPacketData();
    } catch (error) {
      showToast('Error adding tea packet stock', 'error');
    }
  };

  const handleRecordTeaSupply = async () => {
    if (!selectedTeaCustomer || !teaSupplyForm.packetsCount || parseInt(teaSupplyForm.packetsCount) <= 0) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    const requestedPackets = parseInt(teaSupplyForm.packetsCount);

    // Check stock availability if type and weight are selected
    if (teaSupplyForm.teaPacketTypeId && teaSupplyForm.packetWeightGrams) {
      const availablePackets = getAvailablePacketsForSupply();
      if (availablePackets !== null && availablePackets < requestedPackets) {
        const type = teaPacketTypes.find(t => t.id === parseInt(teaSupplyForm.teaPacketTypeId));
        if (availablePackets === 0) {
          showToast(`No stock available for ${type?.name} (${teaSupplyForm.packetWeightGrams}g packets)`, 'warning');
          return;
        } else {
          showToast(`Insufficient stock! Only ${availablePackets} packets available for ${type?.name} (${teaSupplyForm.packetWeightGrams}g)`, 'warning');
          return;
        }
      }
    }

    try {
      await recordTeaPacketSupply({
        customerId: selectedTeaCustomer.id,
        teaPacketTypeId: teaSupplyForm.teaPacketTypeId || null,
        packetWeightGrams: teaSupplyForm.packetWeightGrams || null,
        supplyDate: teaSupplyForm.supplyDate,
        packetsCount: requestedPackets,
        notes: teaSupplyForm.notes
      });
      showToast('Tea packet supply recorded successfully', 'success');
      setTeaSupplyForm({
        teaPacketTypeId: teaSupplyForm.teaPacketTypeId, // Keep the selected type
        packetWeightGrams: teaSupplyForm.packetWeightGrams, // Keep the selected weight
        supplyDate: new Date().toISOString().split('T')[0],
        packetsCount: '1',
        notes: ''
      });
      setSelectedTeaCustomer(null);
      setTeaCustomerSearch('');
      loadTeaPacketData();
    } catch (error) {
      showToast('Error recording tea packet supply', 'error');
    }
  };

  // Get packet weights for selected tea type
  const getSelectedTeaTypeWeights = (typeId) => {
    const type = teaPacketTypes.find(t => t.id === parseInt(typeId));
    if (!type) return [];
    return type.packetWeights.split(',').map(w => w.trim());
  };

  const handleDeleteTeaSupply = (supply) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Tea Packet Supply',
      message: `Delete supply of ${supply.packetsCount} packets to ${supply.customer?.growerNameEnglish}?`,
      onConfirm: async () => {
        try {
          await deleteTeaPacketSupply(supply.id);
          showToast('Tea packet supply deleted', 'success');
          loadTeaPacketData();
        } catch (error) {
          showToast('Error deleting supply', 'error');
        }
      }
    });
  };

  const handleDeleteTeaStock = (stock) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Tea Packet Stock',
      message: `Delete stock of ${stock.packetsAdded} packets (${stock.teaPacketType?.name} - ${stock.packetWeightGrams}g)?`,
      onConfirm: async () => {
        try {
          await deleteTeaPacketStock(stock.id);
          showToast('Tea packet stock deleted', 'success');
          loadTeaPacketData();
        } catch (error) {
          showToast('Error deleting stock', 'error');
        }
      }
    });
  };

  // Fertilizer Stock handlers
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

  // Get available bags for selected fertilizer type and size
  const getAvailableBagsForSupply = () => {
    if (!supplyForm.fertilizerTypeId || !supplyForm.bagSizeKg) return null;
    return availableBagsBySize[`${supplyForm.fertilizerTypeId}-${supplyForm.bagSizeKg}`] || 0;
  };

  // Get available packets for selected tea type and weight
  const getAvailablePacketsForSupply = () => {
    if (!teaSupplyForm.teaPacketTypeId || !teaSupplyForm.packetWeightGrams) return null;
    return availablePacketsByWeight[`${teaSupplyForm.teaPacketTypeId}-${teaSupplyForm.packetWeightGrams}`] || 0;
  };

  // Supply handlers
  const handleRecordSupply = async () => {
    if (!selectedCustomer || !supplyForm.fertilizerTypeId || !supplyForm.bagSizeKg || !supplyForm.bagsCount) {
      showToast('Please fill in all required fields', 'warning');
      return;
    }

    const requestedBags = parseInt(supplyForm.bagsCount);
    const availableBags = getAvailableBagsForSupply();

    // Check stock availability
    if (availableBags !== null && availableBags < requestedBags) {
      const type = fertilizerTypes.find(t => t.id === parseInt(supplyForm.fertilizerTypeId));
      if (availableBags === 0) {
        showToast(`No stock available for ${type?.name} (${supplyForm.bagSizeKg}kg bags)`, 'warning');
        return;
      } else {
        showToast(`Insufficient stock! Only ${availableBags} bags available for ${type?.name} (${supplyForm.bagSizeKg}kg)`, 'warning');
        return;
      }
    }

    try {
      await recordSupply({
        customerId: selectedCustomer.id,
        fertilizerTypeId: supplyForm.fertilizerTypeId,
        supplyDate: supplyForm.supplyDate,
        bagSizeKg: supplyForm.bagSizeKg,
        bagsCount: requestedBags,
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

  const handleDeleteStock = (stock) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Fertilizer Stock',
      message: `Delete stock of ${stock.bagsAdded} bags (${stock.fertilizerType?.name} - ${stock.bagSizeKg}kg)?`,
      onConfirm: async () => {
        try {
          await deleteStock(stock.id);
          showToast('Fertilizer stock deleted', 'success');
          loadStockData();
          loadAvailableStock();
        } catch (error) {
          showToast('Error deleting stock', 'error');
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
    const search = mainTab === 'fertilizer' ? customerSearch : teaCustomerSearch;
    if (!search) return customers.slice(0, 10);
    const searchLower = search.toLowerCase();
    return customers.filter(c =>
      c.bookNumber.toLowerCase().includes(searchLower) ||
      c.growerNameEnglish.toLowerCase().includes(searchLower) ||
      c.growerNameSinhala?.toLowerCase().includes(searchLower)
    ).slice(0, 10);
  }, [customers, customerSearch, teaCustomerSearch, mainTab]);

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
            <h1 className="text-xl font-bold text-gray-800">Stock Management</h1>
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

          {/* Main Tabs - Fertilizer / Tea Packets */}
          {(tabVisibility.fertilizerTabEnabled || tabVisibility.teaPacketsTabEnabled) && (
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              {tabVisibility.fertilizerTabEnabled && (
                <button
                  onClick={() => { setMainTab('fertilizer'); setActiveTab('supply'); }}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${mainTab === 'fertilizer' ? 'bg-green-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  <Leaf className="w-4 h-4 inline mr-1" /> Fertilizer
                </button>
              )}
              {tabVisibility.teaPacketsTabEnabled && (
                <button
                  onClick={() => { setMainTab('teaPackets'); setActiveTab('supply'); }}
                  className={`px-4 py-1.5 rounded text-sm font-medium transition-colors ${mainTab === 'teaPackets' ? 'bg-amber-600 text-white shadow-sm' : 'text-gray-600 hover:text-gray-800'}`}
                >
                  <Coffee className="w-4 h-4 inline mr-1" /> Tea Packets
                </button>
              )}
            </div>
          )}
        </div>

        {/* No tabs enabled message */}
        {!tabVisibility.fertilizerTabEnabled && !tabVisibility.teaPacketsTabEnabled && (
          <div className="text-center py-12 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p className="text-lg font-medium">No stock tabs enabled</p>
            <p className="text-sm">Enable Fertilizer or Tea Packets tabs in Configurations → App Settings</p>
          </div>
        )}

        {/* Loading state */}
        {mainTab === null && (tabVisibility.fertilizerTabEnabled || tabVisibility.teaPacketsTabEnabled) && (
          <div className="text-center py-8 text-gray-500">
            Loading...
          </div>
        )}

        {/* Fertilizer Section */}
        {mainTab === 'fertilizer' && tabVisibility.fertilizerTabEnabled && (
          <>
            {/* Sub Tabs */}
            <div className="flex items-center gap-1 mb-4">
              <button
                onClick={() => setActiveTab('supply')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'supply' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Truck className="w-4 h-4 inline mr-1" /> Supply
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'stock' ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Package className="w-4 h-4 inline mr-1" /> Stock
              </button>
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

                  {/* Stock Availability Warning */}
                  {supplyForm.fertilizerTypeId && supplyForm.bagSizeKg && (
                    <div className="mt-3">
                      {(() => {
                        const availableBags = getAvailableBagsForSupply();
                        const requestedBags = parseInt(supplyForm.bagsCount) || 0;
                        const type = fertilizerTypes.find(t => t.id === parseInt(supplyForm.fertilizerTypeId));

                        if (availableBags === 0) {
                          return (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700">
                              <AlertTriangle className="w-5 h-5" />
                              <span className="font-medium">No stock available for {type?.name} ({supplyForm.bagSizeKg}kg bags)</span>
                            </div>
                          );
                        } else if (availableBags < requestedBags) {
                          return (
                            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800">
                              <AlertTriangle className="w-5 h-5" />
                              <span className="font-medium">Insufficient stock! Only {availableBags} bags available (requesting {requestedBags})</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                              <Package className="w-4 h-4" />
                              <span>Available: <span className="font-bold">{availableBags}</span> bags of {supplyForm.bagSizeKg}kg</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}

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
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-green-800 mb-3">Add Fertilizer Stock for {MONTHS[selectedMonth - 1]} {selectedYear}</h3>
                  <div className="grid grid-cols-5 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Fertilizer Type</label>
                      <select
                        value={stockForm.fertilizerTypeId}
                        onChange={(e) => setStockForm({ ...stockForm, fertilizerTypeId: e.target.value, bagSizeKg: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <input
                        type="text"
                        value={stockForm.notes}
                        onChange={(e) => setStockForm({ ...stockForm, notes: e.target.value })}
                        placeholder="Optional"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleAddStock} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                        <Plus className="w-4 h-4" /> Add Stock
                      </button>
                    </div>
                  </div>
                  {stockForm.bagSizeKg && stockForm.bagsCount && (
                    <div className="mt-2 text-green-700 font-medium">
                      Total: {parseFloat(stockForm.bagSizeKg) * parseInt(stockForm.bagsCount || 0)}kg
                    </div>
                  )}
                </div>

                {/* Stock Records Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Fertilizer Type</th>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Bag Size</th>
                        <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Bags</th>
                        <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Total (kg)</th>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Notes</th>
                        <th className="px-3 py-2 text-center text-gray-700 font-semibold border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockData.length > 0 ? stockData.map(stock => (
                        <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{stock.fertilizerType?.name}</td>
                          <td className="px-3 py-2">{stock.bagSizeKg}kg</td>
                          <td className="px-3 py-2 text-right font-semibold">{stock.bagsAdded}</td>
                          <td className="px-3 py-2 text-right font-semibold text-green-700">{stock.stockAddedKg}kg</td>
                          <td className="px-3 py-2 text-gray-500 text-sm">{stock.notes || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => handleDeleteStock(stock)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="px-3 py-8 text-center text-gray-500">No fertilizer stock records for this month</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Stock Summary by Type */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <div className="bg-gray-50 px-3 py-2 border-b">
                    <h4 className="font-semibold text-gray-700">Summary by Type & Size (Stock / Available)</h4>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Fertilizer Type</th>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Stock & Available by Bag Size</th>
                        <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Total Added</th>
                        <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Total Available</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fertilizerTypes.filter(t => t.active).map(type => {
                        const typeStocks = stockData.filter(s => s.fertilizerType?.id === type.id);
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
                                  const availableBags = availableBagsBySize[`${type.id}-${size}`] || 0;
                                  return (
                                    <div key={size} className="flex flex-col items-center px-2 py-1 rounded bg-gray-50 border border-gray-200">
                                      <span className="font-medium text-gray-700">{size}kg</span>
                                      <div className="flex items-center gap-1 text-sm">
                                        <span className={bags > 0 ? 'text-green-700' : 'text-gray-400'}>{bags}</span>
                                        <span className="text-gray-400">/</span>
                                        <span className={availableBags > 0 ? 'text-blue-700 font-bold' : 'text-red-600 font-bold'}>{availableBags}</span>
                                      </div>
                                      <span className="text-xs text-gray-400">stock/avail</span>
                                    </div>
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

                {/* Overall Stock Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Overall Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-500">Total Stock This Month</div>
                      <div className="text-2xl font-bold text-green-700">
                        {stockData.reduce((sum, s) => sum + parseFloat(s.stockAddedKg || 0), 0).toFixed(0)}kg
                      </div>
                      <div className="text-xs text-gray-400">
                        {stockData.reduce((sum, s) => sum + (s.bagsAdded || 0), 0)} bags
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-500">Supplied This Month</div>
                      <div className="text-2xl font-bold text-blue-700">
                        {supplies.reduce((sum, s) => sum + parseFloat(s.quantityKg || 0), 0).toFixed(0)}kg
                      </div>
                      <div className="text-xs text-gray-400">
                        {supplies.reduce((sum, s) => sum + (s.bagsCount || 0), 0)} bags
                      </div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-500">Total Available (All Types)</div>
                      <div className={`text-2xl font-bold ${Object.values(availableStock).reduce((a, b) => a + b, 0) > 0 ? 'text-green-700' : 'text-red-700'}`}>
                        {Object.values(availableStock).reduce((a, b) => a + b, 0).toFixed(0)}kg
                      </div>
                      <div className="text-xs text-gray-400">across all fertilizer types</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {/* Tea Packets Section */}
        {mainTab === 'teaPackets' && tabVisibility.teaPacketsTabEnabled && (
          <>
            {/* Sub Tabs */}
            <div className="flex items-center gap-1 mb-4">
              <button
                onClick={() => setActiveTab('supply')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'supply' ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Truck className="w-4 h-4 inline mr-1" /> Supply
              </button>
              <button
                onClick={() => setActiveTab('stock')}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${activeTab === 'stock' ? 'bg-amber-100 text-amber-700' : 'text-gray-600 hover:bg-gray-100'}`}
              >
                <Package className="w-4 h-4 inline mr-1" /> Stock
              </button>
            </div>

            {/* Tea Packet Stock Summary */}
            <div className="flex gap-4 mb-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                <span className="text-amber-700 font-medium">Total Stock:</span>
                <span className="ml-2 font-bold text-amber-800">{teaPacketStock.totalPackets || 0} packets</span>
              </div>
              <div className={`border rounded-lg px-4 py-2 ${(teaPacketStock.availablePackets || 0) > 0 ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                <span className={`font-medium ${(teaPacketStock.availablePackets || 0) > 0 ? 'text-green-700' : 'text-red-700'}`}>Available:</span>
                <span className={`ml-2 font-bold ${(teaPacketStock.availablePackets || 0) > 0 ? 'text-green-800' : 'text-red-800'}`}>{teaPacketStock.availablePackets || 0} packets</span>
              </div>
            </div>

            {/* Tea Packet Supply Tab */}
            {activeTab === 'supply' && (
              <div>
                {/* Supply Form */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <div className="grid grid-cols-7 gap-3">
                    {/* Customer Search */}
                    <div className="col-span-2 relative">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Customer</label>
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          value={selectedTeaCustomer ? `${selectedTeaCustomer.bookNumber} - ${selectedTeaCustomer.growerNameEnglish}` : teaCustomerSearch}
                          onChange={(e) => { setTeaCustomerSearch(e.target.value); setSelectedTeaCustomer(null); }}
                          onFocus={() => setShowTeaCustomerDropdown(true)}
                          onBlur={() => setTimeout(() => setShowTeaCustomerDropdown(false), 200)}
                          placeholder="Search customer..."
                          className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                        />
                        {showTeaCustomerDropdown && filteredCustomers.length > 0 && !selectedTeaCustomer && (
                          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-48 overflow-y-auto z-20">
                            {filteredCustomers.map(customer => (
                              <div
                                key={customer.id}
                                onMouseDown={(e) => { e.preventDefault(); setSelectedTeaCustomer(customer); setShowTeaCustomerDropdown(false); }}
                                className="px-3 py-2 hover:bg-amber-50 cursor-pointer border-b border-gray-100"
                              >
                                <span className="font-medium">{customer.bookNumber}</span> - {customer.growerNameEnglish}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tea Packet Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                      <select
                        value={teaSupplyForm.teaPacketTypeId}
                        onChange={(e) => setTeaSupplyForm({ ...teaSupplyForm, teaPacketTypeId: e.target.value, packetWeightGrams: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                      >
                        <option value="">Select type</option>
                        {teaPacketTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Packet Weight */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Weight</label>
                      <select
                        value={teaSupplyForm.packetWeightGrams}
                        onChange={(e) => setTeaSupplyForm({ ...teaSupplyForm, packetWeightGrams: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                        disabled={!teaSupplyForm.teaPacketTypeId}
                      >
                        <option value="">Select weight</option>
                        {getSelectedTeaTypeWeights(teaSupplyForm.teaPacketTypeId).map(weight => (
                          <option key={weight} value={weight}>{weight}g</option>
                        ))}
                      </select>
                    </div>

                    {/* Packets Count */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Packets</label>
                      <input
                        type="number"
                        min="1"
                        value={teaSupplyForm.packetsCount}
                        onChange={(e) => setTeaSupplyForm({ ...teaSupplyForm, packetsCount: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    {/* Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                      <input
                        type="date"
                        value={teaSupplyForm.supplyDate}
                        onChange={(e) => setTeaSupplyForm({ ...teaSupplyForm, supplyDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>

                    {/* Record Button */}
                    <div className="flex items-end">
                      <button
                        onClick={handleRecordTeaSupply}
                        className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700"
                      >
                        <Plus className="w-4 h-4" /> Record
                      </button>
                    </div>
                  </div>

                  {/* Total weight display and Notes */}
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-amber-200">
                    <div>
                      <label className="text-sm text-gray-600 mr-2">Notes:</label>
                      <input
                        type="text"
                        value={teaSupplyForm.notes}
                        onChange={(e) => setTeaSupplyForm({ ...teaSupplyForm, notes: e.target.value })}
                        className="px-2 py-1 border border-gray-300 rounded text-sm w-64"
                        placeholder="Optional notes..."
                      />
                    </div>
                    {teaSupplyForm.packetWeightGrams && teaSupplyForm.packetsCount && (
                      <div className="text-lg font-bold text-amber-700">
                        Total: {parseFloat(teaSupplyForm.packetWeightGrams) * parseInt(teaSupplyForm.packetsCount || 0)}g
                      </div>
                    )}
                  </div>

                  {/* Stock Availability Warning */}
                  {teaSupplyForm.teaPacketTypeId && teaSupplyForm.packetWeightGrams && (
                    <div className="mt-3">
                      {(() => {
                        const availablePackets = getAvailablePacketsForSupply();
                        const requestedPackets = parseInt(teaSupplyForm.packetsCount) || 0;
                        const type = teaPacketTypes.find(t => t.id === parseInt(teaSupplyForm.teaPacketTypeId));

                        if (availablePackets === 0) {
                          return (
                            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 border border-red-300 rounded-lg text-red-700">
                              <AlertTriangle className="w-5 h-5" />
                              <span className="font-medium">No stock available for {type?.name} ({teaSupplyForm.packetWeightGrams}g packets)</span>
                            </div>
                          );
                        } else if (availablePackets < requestedPackets) {
                          return (
                            <div className="flex items-center gap-2 px-3 py-2 bg-yellow-100 border border-yellow-300 rounded-lg text-yellow-800">
                              <AlertTriangle className="w-5 h-5" />
                              <span className="font-medium">Insufficient stock! Only {availablePackets} packets available (requesting {requestedPackets})</span>
                            </div>
                          );
                        } else {
                          return (
                            <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700">
                              <Package className="w-4 h-4" />
                              <span>Available: <span className="font-bold">{availablePackets}</span> packets of {teaSupplyForm.packetWeightGrams}g</span>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </div>

                {/* Tea Packet Supply Records Table */}
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
                      {teaPacketSupplies.length > 0 ? teaPacketSupplies.map(supply => (
                        <tr key={supply.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2">{new Date(supply.supplyDate).toLocaleDateString()}</td>
                          <td className="px-3 py-2">
                            <span className="font-medium">{supply.customer?.bookNumber}</span>
                            <span className="text-gray-500 ml-1">- {supply.customer?.growerNameEnglish}</span>
                          </td>
                          <td className="px-3 py-2">{supply.teaPacketType?.name || '-'}</td>
                          <td className="px-3 py-2 text-right font-semibold">
                            {supply.packetWeightGrams ? (
                              <>
                                {supply.packetsCount} × {supply.packetWeightGrams}g = <span className="text-amber-700">{supply.totalWeightGrams}g</span>
                              </>
                            ) : (
                              <span className="text-amber-700">{supply.packetsCount} packets</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-gray-500 text-sm">{supply.notes || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => handleDeleteTeaSupply(supply)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="px-3 py-8 text-center text-gray-500">No tea packet supply records for this month</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Tea Packet Stock Tab */}
            {activeTab === 'stock' && (
              <div>
                {/* Add Stock Form */}
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                  <h3 className="font-semibold text-amber-800 mb-3">Add Tea Packet Stock for {MONTHS[selectedMonth - 1]} {selectedYear}</h3>
                  <div className="grid grid-cols-5 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tea Packet Type</label>
                      <select
                        value={teaStockForm.teaPacketTypeId}
                        onChange={(e) => setTeaStockForm({ ...teaStockForm, teaPacketTypeId: e.target.value, packetWeightGrams: '' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                      >
                        <option value="">Select type</option>
                        {teaPacketTypes.map(type => (
                          <option key={type.id} value={type.id}>{type.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Packet Weight</label>
                      <select
                        value={teaStockForm.packetWeightGrams}
                        onChange={(e) => setTeaStockForm({ ...teaStockForm, packetWeightGrams: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                        disabled={!teaStockForm.teaPacketTypeId}
                      >
                        <option value="">Select weight</option>
                        {getSelectedTeaTypeWeights(teaStockForm.teaPacketTypeId).map(weight => (
                          <option key={weight} value={weight}>{weight}g</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Number of Packets</label>
                      <input
                        type="number"
                        min="1"
                        value={teaStockForm.packetsCount}
                        onChange={(e) => setTeaStockForm({ ...teaStockForm, packetsCount: e.target.value })}
                        placeholder="e.g., 100"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                      <input
                        type="text"
                        value={teaStockForm.notes}
                        onChange={(e) => setTeaStockForm({ ...teaStockForm, notes: e.target.value })}
                        placeholder="Optional"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-amber-500 outline-none"
                      />
                    </div>
                    <div className="flex items-end">
                      <button onClick={handleAddTeaStock} className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2 rounded hover:bg-amber-700">
                        <Plus className="w-4 h-4" /> Add Stock
                      </button>
                    </div>
                  </div>
                  {teaStockForm.packetWeightGrams && teaStockForm.packetsCount && (
                    <div className="mt-2 text-amber-700 font-medium">
                      Total Weight: {parseFloat(teaStockForm.packetWeightGrams) * parseInt(teaStockForm.packetsCount || 0)}g
                    </div>
                  )}
                </div>

                {/* Stock Records Table */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Tea Packet Type</th>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Weight</th>
                        <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Packets</th>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Notes</th>
                        <th className="px-3 py-2 text-center text-gray-700 font-semibold border-b">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(teaPacketStock.stockList || []).length > 0 ? (teaPacketStock.stockList || []).map(stock => (
                        <tr key={stock.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="px-3 py-2 font-medium">{stock.teaPacketType?.name}</td>
                          <td className="px-3 py-2">{stock.packetWeightGrams}g</td>
                          <td className="px-3 py-2 text-right font-semibold text-amber-700">{stock.packetsAdded}</td>
                          <td className="px-3 py-2 text-gray-500 text-sm">{stock.notes || '-'}</td>
                          <td className="px-3 py-2 text-center">
                            <button onClick={() => handleDeleteTeaStock(stock)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="5" className="px-3 py-8 text-center text-gray-500">No tea packet stock records for this month</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Stock Summary by Type */}
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <div className="bg-gray-50 px-3 py-2 border-b">
                    <h4 className="font-semibold text-gray-700">Summary by Type & Weight (Stock / Available)</h4>
                  </div>
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Tea Packet Type</th>
                        <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Stock & Available by Weight</th>
                        <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Total This Month</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teaPacketTypes.map(type => {
                        const typeStocks = (teaPacketStock.stockList || []).filter(s => s.teaPacketType?.id === type.id);
                        const totalPackets = typeStocks.reduce((sum, s) => sum + (s.packetsAdded || 0), 0);
                        const weights = type.packetWeights?.split(',').map(w => w.trim()) || [];

                        return (
                          <tr key={type.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-3 py-2 font-medium">{type.name}</td>
                            <td className="px-3 py-2">
                              <div className="flex flex-wrap gap-2">
                                {weights.map(weight => {
                                  const stockForWeight = typeStocks.find(s => parseFloat(s.packetWeightGrams) === parseFloat(weight));
                                  const packets = stockForWeight ? stockForWeight.packetsAdded : 0;
                                  const availablePackets = availablePacketsByWeight[`${type.id}-${weight}`] || 0;
                                  return (
                                    <div key={weight} className="flex flex-col items-center px-2 py-1 rounded bg-gray-50 border border-gray-200">
                                      <span className="font-medium text-gray-700">{weight}g</span>
                                      <div className="flex items-center gap-1 text-sm">
                                        <span className={packets > 0 ? 'text-amber-700' : 'text-gray-400'}>{packets}</span>
                                        <span className="text-gray-400">/</span>
                                        <span className={availablePackets > 0 ? 'text-blue-700 font-bold' : 'text-red-600 font-bold'}>{availablePackets}</span>
                                      </div>
                                      <span className="text-xs text-gray-400">stock/avail</span>
                                    </div>
                                  );
                                })}
                              </div>
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {totalPackets > 0 ? `${totalPackets} packets` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Overall Stock Summary */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-700 mb-3">Overall Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-500">Total Stock (All Time)</div>
                      <div className="text-2xl font-bold text-amber-700">{teaPacketStock.totalPackets || 0}</div>
                      <div className="text-xs text-gray-400">packets</div>
                    </div>
                    <div className="bg-white rounded-lg p-4 border border-gray-200">
                      <div className="text-sm text-gray-500">Supplied (All Time)</div>
                      <div className="text-2xl font-bold text-blue-700">{(teaPacketStock.totalPackets || 0) - (teaPacketStock.availablePackets || 0)}</div>
                      <div className="text-xs text-gray-400">packets</div>
                    </div>
                    <div className={`bg-white rounded-lg p-4 border ${(teaPacketStock.availablePackets || 0) > 0 ? 'border-green-200' : 'border-red-200'}`}>
                      <div className="text-sm text-gray-500">Available</div>
                      <div className={`text-2xl font-bold ${(teaPacketStock.availablePackets || 0) > 0 ? 'text-green-700' : 'text-red-700'}`}>{teaPacketStock.availablePackets || 0}</div>
                      <div className="text-xs text-gray-400">packets</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default StockManagementPage;
