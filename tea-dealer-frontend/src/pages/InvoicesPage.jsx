import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Search, FileText, Download, Eye, List, User, RefreshCw, Zap, ArrowUpDown, ArrowUp, ArrowDown, Trash2, Printer } from 'lucide-react';
import { useCustomerContext } from '../contexts/CustomerContext';
import {
  getCollectionsByBookNumberAndDateRange,
  getMonthlyTotals,
  getDeductionByCustomerAndPeriod,
  getInvoicesByPeriod,
  getInvoiceByCustomerAndPeriod,
  generateAllInvoices,
  regenerateInvoice,
  deleteInvoice
} from '../services/invoiceService';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import PrintableInvoice from '../components/invoices/PrintableInvoice';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const InvoicesPage = () => {
  const { customers } = useCustomerContext();
  const { toasts, showToast, removeToast } = useToast();

  const currentDate = new Date();
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [activeTab, setActiveTab] = useState('list');

  // Single invoice view state
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [currentInvoice, setCurrentInvoice] = useState(null);
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(false);

  // List view state
  const [generatedInvoices, setGeneratedInvoices] = useState([]);
  const [invoiceSummaries, setInvoiceSummaries] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState(null);
  const [selectedInvoices, setSelectedInvoices] = useState(new Set());
  const [hideZeroNetPay, setHideZeroNetPay] = useState(false);
  const [hideZeroKg, setHideZeroKg] = useState(false);
  const [hideNotGenerated, setHideNotGenerated] = useState(false);
  const [listSearchTerm, setListSearchTerm] = useState('');
  const [sortField, setSortField] = useState('bookNumber');
  const [sortDirection, setSortDirection] = useState('asc');

  // Confirm dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: null
  });

  // Print state
  const [printInvoice, setPrintInvoice] = useState(null);

  // Load all invoices when in list view
  useEffect(() => {
    if (activeTab === 'list' && customers.length > 0) {
      loadInvoicesForPeriod();
    }
  }, [activeTab, customers, selectedYear, selectedMonth]);

  const loadInvoicesForPeriod = async () => {
    setLoadingList(true);
    setSelectedInvoices(new Set());

    try {
      // First, get all generated invoices for the period
      let invoices = [];
      try {
        invoices = await getInvoicesByPeriod(selectedYear, selectedMonth);
      } catch {
        invoices = [];
      }
      setGeneratedInvoices(invoices);

      // Create a map of generated invoices by customer ID
      const invoiceMap = new Map();
      invoices.forEach(inv => {
        invoiceMap.set(inv.customer.id, inv);
      });

      // Build summaries for all customers
      const summaries = customers.map(customer => {
        const invoice = invoiceMap.get(customer.id);

        if (invoice) {
          // Use data from generated invoice
          return {
            customer,
            invoice,
            isGenerated: true,
            totalKg: parseFloat(invoice.totalKg || 0),
            grade1Kg: parseFloat(invoice.grade1Kg || 0),
            grade2Kg: parseFloat(invoice.grade2Kg || 0),
            totalAmount: parseFloat(invoice.totalAmount || 0),
            totalDeductions: parseFloat(invoice.totalDeductions || 0),
            netAmount: parseFloat(invoice.netAmount || 0),
            status: invoice.status,
            generatedAt: invoice.generatedAt
          };
        } else {
          // Not generated yet
          return {
            customer,
            invoice: null,
            isGenerated: false,
            totalKg: 0,
            grade1Kg: 0,
            grade2Kg: 0,
            totalAmount: 0,
            totalDeductions: 0,
            netAmount: 0,
            status: null,
            generatedAt: null
          };
        }
      });

      setInvoiceSummaries(summaries);
    } catch (error) {
      console.error('Error loading invoices:', error);
      showToast('Error loading invoices', 'error');
    } finally {
      setLoadingList(false);
    }
  };

  // Generate all invoices
  const handleGenerateAll = async () => {
    setGenerating(true);
    try {
      const result = await generateAllInvoices(selectedYear, selectedMonth);
      showToast(`Generated ${result.generated} invoices successfully`, 'success');
      await loadInvoicesForPeriod();
    } catch (error) {
      console.error('Error generating invoices:', error);
      showToast('Error generating invoices', 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Regenerate single invoice
  const handleRegenerateInvoice = async (customerId) => {
    setRegeneratingId(customerId);
    try {
      await regenerateInvoice(customerId, selectedYear, selectedMonth);
      showToast('Invoice regenerated successfully', 'success');
      await loadInvoicesForPeriod();
    } catch (error) {
      console.error('Error regenerating invoice:', error);
      showToast('Error regenerating invoice', 'error');
    } finally {
      setRegeneratingId(null);
    }
  };

  // Delete single invoice
  const handleDeleteInvoice = (invoiceId, customerName) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Invoice',
      message: `Are you sure you want to delete the invoice for ${customerName}? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          await deleteInvoice(invoiceId);
          showToast('Invoice deleted successfully', 'success');
          await loadInvoicesForPeriod();
        } catch (error) {
          console.error('Error deleting invoice:', error);
          showToast('Error deleting invoice', 'error');
        }
      }
    });
  };

  // Bulk delete selected invoices
  const handleBulkDelete = () => {
    if (selectedInvoices.size === 0) {
      showToast('Please select at least one invoice', 'error');
      return;
    }
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Multiple Invoices',
      message: `Are you sure you want to delete ${selectedInvoices.size} invoice(s)? This action cannot be undone.`,
      onConfirm: async () => {
        try {
          const deletePromises = [];
          invoiceSummaries.forEach(summary => {
            if (selectedInvoices.has(summary.customer.id) && summary.invoice?.id) {
              deletePromises.push(deleteInvoice(summary.invoice.id));
            }
          });
          await Promise.all(deletePromises);
          showToast(`${selectedInvoices.size} invoice(s) deleted successfully`, 'success');
          setSelectedInvoices(new Set());
          await loadInvoicesForPeriod();
        } catch (error) {
          console.error('Error deleting invoices:', error);
          showToast('Error deleting some invoices', 'error');
          await loadInvoicesForPeriod();
        }
      }
    });
  };

  // Close confirm dialog
  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
  };

  // Filter, search and sort summaries
  const filteredSummaries = useMemo(() => {
    let filtered = invoiceSummaries;

    if (hideZeroNetPay) {
      filtered = filtered.filter(s => s.netAmount !== 0);
    }
    if (hideZeroKg) {
      filtered = filtered.filter(s => s.totalKg > 0);
    }
    if (hideNotGenerated) {
      filtered = filtered.filter(s => s.isGenerated);
    }

    if (listSearchTerm) {
      const search = listSearchTerm.toLowerCase();
      filtered = filtered.filter(s =>
        s.customer.bookNumber.toLowerCase().includes(search) ||
        s.customer.growerNameEnglish.toLowerCase().includes(search) ||
        s.customer.growerNameSinhala?.toLowerCase().includes(search)
      );
    }

    // Sort the filtered results
    filtered = [...filtered].sort((a, b) => {
      let aVal, bVal;

      switch (sortField) {
        case 'bookNumber':
          aVal = parseInt(a.customer.bookNumber) || a.customer.bookNumber;
          bVal = parseInt(b.customer.bookNumber) || b.customer.bookNumber;
          break;
        case 'customerName':
          aVal = a.customer.growerNameEnglish.toLowerCase();
          bVal = b.customer.growerNameEnglish.toLowerCase();
          break;
        case 'status':
          aVal = a.isGenerated ? 1 : 0;
          bVal = b.isGenerated ? 1 : 0;
          break;
        case 'totalKg':
          aVal = a.totalKg;
          bVal = b.totalKg;
          break;
        case 'netAmount':
          aVal = a.netAmount;
          bVal = b.netAmount;
          break;
        default:
          aVal = parseInt(a.customer.bookNumber) || a.customer.bookNumber;
          bVal = parseInt(b.customer.bookNumber) || b.customer.bookNumber;
      }

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [invoiceSummaries, hideZeroNetPay, hideZeroKg, hideNotGenerated, listSearchTerm, sortField, sortDirection]);

  // Handle sort column click
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort icon component
  const SortIcon = ({ field }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-gray-400" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="w-3 h-3 text-green-600" />
      : <ArrowDown className="w-3 h-3 text-green-600" />;
  };

  const generatedCount = invoiceSummaries.filter(s => s.isGenerated).length;

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedInvoices(new Set(filteredSummaries.filter(s => s.isGenerated).map(s => s.customer.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const toggleInvoiceSelection = (customerId, isGenerated) => {
    if (!isGenerated) return;
    const newSelected = new Set(selectedInvoices);
    if (newSelected.has(customerId)) {
      newSelected.delete(customerId);
    } else {
      newSelected.add(customerId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleViewInvoice = (customer) => {
    setSelectedCustomer(customer);
    setActiveTab('single');
  };

  const handleDownloadInvoice = (customer) => {
    showToast(`Download invoice for ${customer.growerNameEnglish} - PDF feature coming soon`, 'info');
  };

  const handleBulkDownload = () => {
    if (selectedInvoices.size === 0) {
      showToast('Please select at least one invoice', 'error');
      return;
    }
    showToast(`Downloading ${selectedInvoices.size} invoices - PDF feature coming soon`, 'info');
  };

  // Single view setup
  useEffect(() => {
    if (activeTab === 'single' && customers.length > 0 && !selectedCustomer) {
      setSelectedCustomer(customers[0]);
    }
  }, [customers, selectedCustomer, activeTab]);

  const filteredCustomers = useMemo(() => {
    if (!searchTerm) return customers;
    const search = searchTerm.toLowerCase();
    return customers.filter(c =>
      c.bookNumber.toLowerCase().includes(search) ||
      c.growerNameEnglish.toLowerCase().includes(search) ||
      c.growerNameSinhala?.toLowerCase().includes(search)
    );
  }, [customers, searchTerm]);

  const handlePreviousCustomer = () => {
    if (!selectedCustomer || filteredCustomers.length === 0) return;
    const currentIndex = filteredCustomers.findIndex(c => c.id === selectedCustomer.id);
    const prevIndex = currentIndex > 0 ? currentIndex - 1 : filteredCustomers.length - 1;
    setSelectedCustomer(filteredCustomers[prevIndex]);
  };

  const handleNextCustomer = () => {
    if (!selectedCustomer || filteredCustomers.length === 0) return;
    const currentIndex = filteredCustomers.findIndex(c => c.id === selectedCustomer.id);
    const nextIndex = currentIndex < filteredCustomers.length - 1 ? currentIndex + 1 : 0;
    setSelectedCustomer(filteredCustomers[nextIndex]);
  };

  // Load invoice data for single view
  useEffect(() => {
    if (activeTab === 'single' && selectedCustomer) {
      loadSingleInvoice();
    } else if (activeTab === 'single') {
      setCurrentInvoice(null);
      setCollections([]);
    }
  }, [selectedCustomer, selectedYear, selectedMonth, activeTab]);

  const loadSingleInvoice = async () => {
    setLoading(true);
    try {
      // Try to load generated invoice first
      let invoice = null;
      try {
        invoice = await getInvoiceByCustomerAndPeriod(selectedCustomer.id, selectedYear, selectedMonth);
      } catch {
        invoice = null;
      }

      setCurrentInvoice(invoice);

      // Also load collections for the date breakdown
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

      try {
        const collectionsData = await getCollectionsByBookNumberAndDateRange(selectedCustomer.bookNumber, startDate, endDate);
        setCollections(collectionsData || []);
      } catch {
        setCollections([]);
      }
    } catch (error) {
      console.error('Error loading invoice:', error);
      showToast('Error loading invoice data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerateSingleInvoice = async () => {
    if (!selectedCustomer) return;
    setLoading(true);
    try {
      await regenerateInvoice(selectedCustomer.id, selectedYear, selectedMonth);
      showToast('Invoice regenerated successfully', 'success');
      await loadSingleInvoice();
    } catch (error) {
      console.error('Error regenerating invoice:', error);
      showToast('Error regenerating invoice', 'error');
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

  // Group collections by date for single view
  const collectionsByDate = useMemo(() => {
    const grouped = {};
    collections.forEach(col => {
      const date = col.collectionDate;
      if (!grouped[date]) {
        grouped[date] = { grade1: 0, grade2: 0 };
      }
      if (col.grade === 'GRADE_1') {
        grouped[date].grade1 = parseFloat(col.weightKg || 0);
      } else {
        grouped[date].grade2 = parseFloat(col.weightKg || 0);
      }
    });
    return grouped;
  }, [collections]);

  const sortedDates = Object.keys(collectionsByDate).sort();

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.getDate().toString().padStart(2, '0');
  };

  const allSelected = filteredSummaries.filter(s => s.isGenerated).length > 0 &&
    selectedInvoices.size === filteredSummaries.filter(s => s.isGenerated).length;
  const someSelected = selectedInvoices.size > 0 &&
    selectedInvoices.size < filteredSummaries.filter(s => s.isGenerated).length;

  return (
    <div className="p-3">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => {
          if (confirmDialog.onConfirm) confirmDialog.onConfirm();
          closeConfirmDialog();
        }}
        onClose={closeConfirmDialog}
      />

      <div className="bg-white rounded-lg shadow-lg p-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-4">
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
                {MONTHS_SHORT[selectedMonth - 1]}
              </span>
              <button onClick={() => handleMonthChange(1)} className="p-0.5 hover:bg-gray-200 rounded">
                <ChevronRight className="w-3 h-3 text-gray-600" />
              </button>
            </div>

            {/* Generated count badge */}
            {activeTab === 'list' && !loadingList && (
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                generatedCount === customers.length
                  ? 'bg-green-100 text-green-700'
                  : generatedCount > 0
                    ? 'bg-yellow-100 text-yellow-700'
                    : 'bg-gray-100 text-gray-600'
              }`}>
                {generatedCount}/{customers.length} Generated
              </span>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setActiveTab('list')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'list'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <List className="w-4 h-4" />
                All Invoices
              </button>
              <button
                onClick={() => setActiveTab('single')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === 'single'
                    ? 'bg-white text-green-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                <User className="w-4 h-4" />
                Single Invoice
              </button>
            </div>
          </div>
        </div>

        {/* List View Tab */}
        {activeTab === 'list' && (
          <div>
            {/* Actions Bar */}
            <div className="flex items-center justify-between gap-4 mb-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search customer..."
                    value={listSearchTerm}
                    onChange={(e) => setListSearchTerm(e.target.value)}
                    className="pl-8 pr-3 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-green-500 outline-none w-56"
                  />
                </div>

                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideZeroNetPay}
                    onChange={(e) => setHideZeroNetPay(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  Hide Rs.0
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideZeroKg}
                    onChange={(e) => setHideZeroKg(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  Hide 0kg
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hideNotGenerated}
                    onChange={(e) => setHideNotGenerated(e.target.checked)}
                    className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                  />
                  Generated Only
                </label>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleGenerateAll}
                  disabled={generating}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                >
                  <Zap className={`w-4 h-4 ${generating ? 'animate-pulse' : ''}`} />
                  {generating ? 'Generating...' : 'Generate All'}
                </button>
                <button
                  onClick={handleBulkDownload}
                  disabled={selectedInvoices.size === 0}
                  className="flex items-center gap-2 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Download ({selectedInvoices.size})
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={selectedInvoices.size === 0}
                  className="flex items-center gap-2 px-4 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete ({selectedInvoices.size})
                </button>
              </div>
            </div>

            {/* Invoice List Table */}
            {loadingList ? (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading invoices...</div>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left border-b w-10">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = someSelected; }}
                          onChange={(e) => handleSelectAll(e.target.checked)}
                          className="rounded border-gray-300 text-green-600 focus:ring-green-500"
                        />
                      </th>
                      <th
                        className="px-3 py-2 text-left text-gray-600 font-medium border-b cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('bookNumber')}
                      >
                        <div className="flex items-center gap-1">
                          Book No
                          <SortIcon field="bookNumber" />
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-left text-gray-600 font-medium border-b cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('customerName')}
                      >
                        <div className="flex items-center gap-1">
                          Customer Name
                          <SortIcon field="customerName" />
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-center text-gray-600 font-medium border-b cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('status')}
                      >
                        <div className="flex items-center justify-center gap-1">
                          Status
                          <SortIcon field="status" />
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-right text-gray-600 font-medium border-b cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('totalKg')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Total Kg
                          <SortIcon field="totalKg" />
                        </div>
                      </th>
                      <th
                        className="px-3 py-2 text-right text-gray-600 font-medium border-b cursor-pointer hover:bg-gray-100 select-none"
                        onClick={() => handleSort('netAmount')}
                      >
                        <div className="flex items-center justify-end gap-1">
                          Net Amount
                          <SortIcon field="netAmount" />
                        </div>
                      </th>
                      <th className="px-3 py-2 text-center text-gray-600 font-medium border-b">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSummaries.length > 0 ? (
                      filteredSummaries.map((summary) => (
                        <tr key={summary.customer.id} className="border-b border-gray-100 last:border-b-0 hover:bg-gray-50">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedInvoices.has(summary.customer.id)}
                              onChange={() => toggleInvoiceSelection(summary.customer.id, summary.isGenerated)}
                              disabled={!summary.isGenerated}
                              className="rounded border-gray-300 text-green-600 focus:ring-green-500 disabled:opacity-30"
                            />
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-800">{summary.customer.bookNumber}</td>
                          <td className="px-3 py-2 text-gray-700">
                            {summary.customer.growerNameEnglish}
                            {summary.customer.growerNameSinhala && (
                              <span className="text-gray-400 ml-1">({summary.customer.growerNameSinhala})</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center">
                            {summary.isGenerated ? (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                Generated
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs font-medium">
                                Not Generated
                              </span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right text-gray-700">
                            {summary.isGenerated ? (
                              <>
                                {summary.totalKg.toFixed(2)} kg
                                <span className="text-xs text-gray-400 block">
                                  G1: {summary.grade1Kg.toFixed(1)} | G2: {summary.grade2Kg.toFixed(1)}
                                </span>
                              </>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </td>
                          <td className={`px-3 py-2 text-right font-semibold ${
                            !summary.isGenerated ? 'text-gray-400' :
                            summary.netAmount > 0 ? 'text-green-700' :
                            summary.netAmount < 0 ? 'text-orange-600' : 'text-gray-500'
                          }`}>
                            {summary.isGenerated ? `Rs. ${summary.netAmount.toFixed(2)}` : '-'}
                          </td>
                          <td className="px-3 py-2">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleViewInvoice(summary.customer)}
                                className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                title="View Invoice"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleRegenerateInvoice(summary.customer.id)}
                                disabled={regeneratingId === summary.customer.id}
                                className="p-1.5 text-orange-600 hover:bg-orange-50 rounded transition-colors disabled:opacity-50"
                                title={summary.isGenerated ? "Regenerate Invoice" : "Generate Invoice"}
                              >
                                <RefreshCw className={`w-4 h-4 ${regeneratingId === summary.customer.id ? 'animate-spin' : ''}`} />
                              </button>
                              {summary.isGenerated && (
                                <>
                                  <button
                                    onClick={() => setPrintInvoice(summary.invoice)}
                                    className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                    title="Print Invoice"
                                  >
                                    <Printer className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDownloadInvoice(summary.customer)}
                                    className="p-1.5 text-green-600 hover:bg-green-50 rounded transition-colors"
                                    title="Download Invoice"
                                  >
                                    <Download className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteInvoice(summary.invoice.id, summary.customer.growerNameEnglish)}
                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                    title="Delete Invoice"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="px-3 py-8 text-center text-gray-500">
                          {invoiceSummaries.length === 0 ? 'No customers found' : 'No invoices match the filters'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* Summary Stats */}
            {!loadingList && filteredSummaries.length > 0 && (
              <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
                <span>Showing {filteredSummaries.length} of {invoiceSummaries.length} invoices</span>
                <div className="flex items-center gap-4">
                  <span>Total Kg: <strong>{filteredSummaries.filter(s => s.isGenerated).reduce((sum, s) => sum + s.totalKg, 0).toFixed(2)}</strong></span>
                  <span>Total Net: <strong className="text-green-700">Rs. {filteredSummaries.filter(s => s.isGenerated).reduce((sum, s) => sum + s.netAmount, 0).toFixed(2)}</strong></span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Single Invoice View */}
        {activeTab === 'single' && (
          <>
            {/* Customer Navigation */}
            <div className="flex items-center gap-2 mb-4">
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative flex-1">
                <div
                  onClick={() => setShowCustomerDropdown(!showCustomerDropdown)}
                  className="px-2 py-1.5 bg-gray-50 border border-gray-300 rounded text-sm cursor-pointer hover:bg-gray-100"
                >
                  {selectedCustomer ? (
                    <span className="text-gray-800">{selectedCustomer.bookNumber} - {selectedCustomer.growerNameEnglish}</span>
                  ) : (
                    <span className="text-gray-400">No customer selected</span>
                  )}
                </div>
                {showCustomerDropdown && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCustomerDropdown(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto z-20">
                      {customers.map(customer => (
                        <div
                          key={customer.id}
                          onClick={() => {
                            setSelectedCustomer(customer);
                            setShowCustomerDropdown(false);
                          }}
                          className={`px-3 py-2 hover:bg-green-50 cursor-pointer text-sm border-b border-gray-100 ${
                            selectedCustomer?.id === customer.id ? 'bg-green-100' : ''
                          }`}
                        >
                          <div className="font-medium text-gray-800">{customer.bookNumber} - {customer.growerNameEnglish}</div>
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

            {/* Invoice Content */}
            {selectedCustomer && !loading && (
              <div className="border border-gray-300 rounded-lg p-4">
                {/* Invoice Status & Actions */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {currentInvoice ? (
                      <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                        Generated
                      </span>
                    ) : (
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm font-medium">
                        Not Generated
                      </span>
                    )}
                    {currentInvoice?.generatedAt && (
                      <span className="text-xs text-gray-500">
                        {new Date(currentInvoice.generatedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {currentInvoice && (
                      <button
                        onClick={() => setPrintInvoice(currentInvoice)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm font-medium"
                      >
                        <Printer className="w-4 h-4" />
                        Print
                      </button>
                    )}
                    <button
                      onClick={handleRegenerateSingleInvoice}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 text-sm font-medium"
                    >
                      <RefreshCw className="w-4 h-4" />
                      {currentInvoice ? 'Regenerate' : 'Generate'}
                    </button>
                  </div>
                </div>

                {currentInvoice ? (
                  <>
                    {/* Customer Info Row */}
                    <div className="flex items-center gap-6 mb-3 pb-2 border-b border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-500">Book:</span>
                        <span className="text-lg font-bold text-green-700">{currentInvoice.bookNumber}</span>
                      </div>
                      <div className="text-lg font-semibold text-gray-800">{currentInvoice.customerName}</div>
                      {currentInvoice.customerNameSinhala && (
                        <div className="text-lg text-gray-600">{currentInvoice.customerNameSinhala}</div>
                      )}
                      <div className="ml-auto text-gray-500">{MONTHS[selectedMonth - 1]} {selectedYear}</div>
                    </div>

                    {/* Two Column Layout */}
                    <div className="flex gap-4 mb-3">
                      {/* Left Half: Rates & Amounts Table */}
                      <div className="flex-1">
                        <table className="w-full border border-gray-200 rounded overflow-hidden">
                          <thead className="bg-green-50">
                            <tr>
                              <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b">Grade</th>
                              <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Kg</th>
                              <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Rate</th>
                              <th className="px-3 py-2 text-right text-gray-700 font-semibold border-b">Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className="border-b">
                              <td className="px-3 py-2"><span className="inline-flex items-center gap-2"><span className="w-2 h-2 bg-amber-500 rounded-full"></span>Grade 1</span></td>
                              <td className="px-3 py-2 text-right">{parseFloat(currentInvoice.grade1Kg || 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right">{parseFloat(currentInvoice.grade1Rate || 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-semibold">{parseFloat(currentInvoice.grade1Amount || 0).toFixed(2)}</td>
                            </tr>
                            <tr className="border-b">
                              <td className="px-3 py-2"><span className="inline-flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full"></span>Grade 2</span></td>
                              <td className="px-3 py-2 text-right">{parseFloat(currentInvoice.grade2Kg || 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right">{parseFloat(currentInvoice.grade2Rate || 0).toFixed(2)}</td>
                              <td className="px-3 py-2 text-right font-semibold">{parseFloat(currentInvoice.grade2Amount || 0).toFixed(2)}</td>
                            </tr>
                            <tr className="border-b bg-gray-50">
                              <td className="px-3 py-2 text-gray-600">Total Collected</td>
                              <td className="px-3 py-2 text-right font-medium">{parseFloat(currentInvoice.totalKg || 0).toFixed(2)}</td>
                              <td className="px-3 py-2"></td>
                              <td className="px-3 py-2"></td>
                            </tr>
                            <tr className="border-b bg-orange-50">
                              <td className="px-3 py-2 text-orange-700">Supply Ded. ({parseFloat(currentInvoice.supplyDeductionPercentage || 0).toFixed(1)}%)</td>
                              <td className="px-3 py-2 text-right text-orange-700">-{parseFloat(currentInvoice.supplyDeductionKg || 0).toFixed(2)}</td>
                              <td className="px-3 py-2"></td>
                              <td className="px-3 py-2"></td>
                            </tr>
                            <tr className="bg-blue-50">
                              <td className="px-3 py-2 font-bold text-blue-800">Payable</td>
                              <td className="px-3 py-2 text-right font-bold text-blue-800">{parseFloat(currentInvoice.payableKg || 0).toFixed(2)}</td>
                              <td className="px-3 py-2"></td>
                              <td className="px-3 py-2 text-right font-bold text-blue-800">{parseFloat(currentInvoice.totalAmount || 0).toFixed(2)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Right Half: Collections with Dates */}
                      <div className="flex-1">
                        <div className="border border-gray-200 rounded h-full">
                          <div className="bg-green-50 px-3 py-2 border-b font-semibold text-gray-700">
                            Collections ({sortedDates.length} days)
                          </div>
                          <div className="p-2 max-h-40 overflow-y-auto">
                            {sortedDates.length > 0 ? (
                              <div className="flex flex-wrap gap-2">
                                {sortedDates.map(dateStr => {
                                  const col = collectionsByDate[dateStr];
                                  const totalKg = (col?.grade1 || 0) + (col?.grade2 || 0);
                                  const day = new Date(dateStr).getDate();
                                  return (
                                    <div
                                      key={dateStr}
                                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-green-100 border border-green-300 rounded"
                                      title={`G1: ${col.grade1}kg, G2: ${col.grade2}kg`}
                                    >
                                      <span className="text-gray-600 font-medium">{day}:</span>
                                      <span className="font-bold text-green-700">{totalKg.toFixed(1)}kg</span>
                                    </div>
                                  );
                                })}
                              </div>
                            ) : (
                              <div className="text-center text-gray-400 py-4">No collections this month</div>
                            )}
                          </div>
                          <div className="px-3 py-2 border-t bg-gray-50 text-right">
                            <span className="text-gray-600">Total:</span>
                            <span className="ml-2 font-bold text-green-700">{parseFloat(currentInvoice.totalKg || 0).toFixed(2)} kg</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Deductions Table */}
                    <div className="mb-3">
                      <table className="w-full border border-gray-200 rounded overflow-hidden">
                        <thead className="bg-red-50">
                          <tr>
                            <th className="px-3 py-2 text-left text-gray-700 font-semibold border-b" colSpan="2">Deductions</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td colSpan="2" className="p-0">
                              <div className="flex flex-wrap">
                                {currentInvoice.lastMonthArrears > 0 && (
                                  <div className="flex justify-between px-3 py-1.5 border-r border-b w-1/3"><span className="text-gray-600">Arrears</span><span className="font-medium">{parseFloat(currentInvoice.lastMonthArrears).toFixed(2)}</span></div>
                                )}
                                {currentInvoice.advanceAmount > 0 && (
                                  <div className="flex justify-between px-3 py-1.5 border-r border-b w-1/3"><span className="text-gray-600">Advance</span><span className="font-medium">{parseFloat(currentInvoice.advanceAmount).toFixed(2)}</span></div>
                                )}
                                {currentInvoice.loanAmount > 0 && (
                                  <div className="flex justify-between px-3 py-1.5 border-r border-b w-1/3"><span className="text-gray-600">Loan</span><span className="font-medium">{parseFloat(currentInvoice.loanAmount).toFixed(2)}</span></div>
                                )}
                                {currentInvoice.fertilizer1Amount > 0 && (
                                  <div className="flex justify-between px-3 py-1.5 border-r border-b w-1/3"><span className="text-gray-600">Fertilizer 1</span><span className="font-medium">{parseFloat(currentInvoice.fertilizer1Amount).toFixed(2)}</span></div>
                                )}
                                {currentInvoice.fertilizer2Amount > 0 && (
                                  <div className="flex justify-between px-3 py-1.5 border-r border-b w-1/3"><span className="text-gray-600">Fertilizer 2</span><span className="font-medium">{parseFloat(currentInvoice.fertilizer2Amount).toFixed(2)}</span></div>
                                )}
                                {currentInvoice.teaPacketsTotal > 0 && (
                                  <div className="flex justify-between px-3 py-1.5 border-r border-b w-1/3"><span className="text-gray-600">Tea Packets</span><span className="font-medium">{parseFloat(currentInvoice.teaPacketsTotal).toFixed(2)}</span></div>
                                )}
                                {currentInvoice.agrochemicalsAmount > 0 && (
                                  <div className="flex justify-between px-3 py-1.5 border-r border-b w-1/3"><span className="text-gray-600">Agrochemicals</span><span className="font-medium">{parseFloat(currentInvoice.agrochemicalsAmount).toFixed(2)}</span></div>
                                )}
                                {currentInvoice.transportDeduction > 0 && (
                                  <div className="flex justify-between px-3 py-1.5 border-r border-b w-1/3"><span className="text-gray-600">Transport</span><span className="font-medium">{parseFloat(currentInvoice.transportDeduction).toFixed(2)}</span></div>
                                )}
                                {currentInvoice.stampFee > 0 && (
                                  <div className="flex justify-between px-3 py-1.5 border-r border-b w-1/3"><span className="text-gray-600">Stamp Fee</span><span className="font-medium">{parseFloat(currentInvoice.stampFee).toFixed(2)}</span></div>
                                )}
                                {currentInvoice.otherDeductions > 0 && (
                                  <div className="flex justify-between px-3 py-1.5 border-r border-b w-1/3"><span className="text-gray-600">Other</span><span className="font-medium">{parseFloat(currentInvoice.otherDeductions).toFixed(2)}</span></div>
                                )}
                                {parseFloat(currentInvoice.totalDeductions || 0) === 0 && (
                                  <div className="px-3 py-2 text-gray-400 w-full text-center">No deductions</div>
                                )}
                              </div>
                            </td>
                          </tr>
                          <tr className="bg-red-100">
                            <td className="px-3 py-2 font-bold text-red-700">Total Deductions</td>
                            <td className="px-3 py-2 text-right font-bold text-red-700">Rs. {parseFloat(currentInvoice.totalDeductions || 0).toFixed(2)}</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Net Amount */}
                    <div className={`px-4 py-3 rounded-lg flex justify-between items-center ${parseFloat(currentInvoice.netAmount || 0) >= 0 ? 'bg-gradient-to-r from-green-500 to-emerald-600' : 'bg-gradient-to-r from-orange-500 to-red-500'}`}>
                      <span className="text-white text-lg font-semibold">
                        {parseFloat(currentInvoice.netAmount || 0) >= 0 ? 'Net Pay' : 'Balance Due'}
                      </span>
                      <span className="text-white text-2xl font-bold">
                        Rs. {Math.abs(parseFloat(currentInvoice.netAmount || 0)).toFixed(2)}
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">Invoice not generated for this period</p>
                    <button
                      onClick={handleRegenerateSingleInvoice}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      Generate Invoice
                    </button>
                  </div>
                )}
              </div>
            )}

            {loading && (
              <div className="text-center py-8">
                <div className="text-gray-500">Loading invoice...</div>
              </div>
            )}

            {!selectedCustomer && !loading && (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-700 mb-2">Select a Customer</h3>
                <p className="text-gray-500 text-sm">Choose a customer to view their invoice</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Printable Invoice Modal */}
      <PrintableInvoice
        isOpen={!!printInvoice}
        onClose={() => setPrintInvoice(null)}
        invoice={printInvoice}
      />
    </div>
  );
};

export default InvoicesPage;
