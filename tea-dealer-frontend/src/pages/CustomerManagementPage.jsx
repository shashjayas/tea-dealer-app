import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { getCollectionsByDate } from '../services/collectionService';
import { useCustomerContext } from '../contexts/CustomerContext';
import { useSorting } from '../hooks/useSorting';
import { useCSVImport } from '../hooks/useCSVImport';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';
import CustomerSearchBar from '../components/customers/CustomerSearchBar';
import CustomerTable from '../components/customers/CustomerTable';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerImportModal from '../components/customers/CustomerImportModal';
import ConfirmDialog from '../components/common/ConfirmDialog';
import { getCollectionsByCustomer } from '../services/collectionService';

const CustomerManagementPage = () => {
  const { t } = useTranslation();
  const { customers, loading, addCustomer, editCustomer, removeCustomer } = useCustomerContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, customerId: null, hasCollections: false });
  const [formData, setFormData] = useState({
    bookNumber: '', growerNameSinhala: '', growerNameEnglish: '',
    address: '', nic: '', landName: '', contactNumber: '', route: '',
    transportExempt: false
  });

  const { importFile, importPreview, importErrors, downloadTemplate, processFile, resetImport } = useCSVImport();
  const { toasts, showToast, removeToast } = useToast();

  const filteredCustomers = customers.filter(customer =>
    customer.growerNameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.bookNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.route.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const { sortedData, handleSort, SortIcon } = useSorting(filteredCustomers);

  const handleSubmit = async () => {
    const result = editingCustomer
      ? await editCustomer(editingCustomer.id, formData)
      : await addCustomer(formData);

    if (result.success) {
      showToast(editingCustomer ? t('toast.customerUpdatedSuccess') : t('toast.customerAddedSuccess'), 'success');
      resetForm();
      setShowForm(false);
    } else {
      showToast(t('toast.customerSaveFailed'), 'error');
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      bookNumber: customer.bookNumber,
      growerNameSinhala: customer.growerNameSinhala,
      growerNameEnglish: customer.growerNameEnglish,
      address: customer.address,
      nic: customer.nic,
      landName: customer.landName,
      contactNumber: customer.contactNumber,
      route: customer.route,
      transportExempt: customer.transportExempt || false
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    try {
      // Check if customer has any collections
      const collections = await getCollectionsByCustomer(id);
      if (collections && collections.length > 0) {
        showToast(t('customers.cannotDeleteWithCollections'), 'warning');
        return;
      }

      setConfirmDialog({ isOpen: true, customerId: id });
    } catch (error) {
      console.error('Error checking collections:', error);
      // If error (e.g. network), fallback to allow delete attempt, backend will handle FK constraint if any
      setConfirmDialog({ isOpen: true, customerId: id });
    }
  };

  const confirmDelete = async () => {
    const result = await removeCustomer(confirmDialog.customerId);
    if (result.success) {
      showToast(t('toast.customerDeletedSuccess'), 'success');
    } else {
      showToast(t('toast.customerDeleteFailed'), 'error');
    }
    setConfirmDialog({ isOpen: false, customerId: null });
  };

  const resetForm = () => {
    setFormData({
      bookNumber: '', growerNameSinhala: '', growerNameEnglish: '',
      address: '', nic: '', landName: '', contactNumber: '', route: '',
      transportExempt: false
    });
    setEditingCustomer(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleImport = async () => {
    if (importPreview.length === 0) {
      showToast(t('toast.noValidCustomers'), 'warning');
      return;
    }

    setImportLoading(true); // Use separate loading state
    let success = 0;
    let fail = 0;

    for (const customer of importPreview) {
      try {
        const result = await addCustomer(customer);
        if (result.success) success++;
        else fail++;
      } catch (error) {
        console.error('Import error:', error);
        fail++;
      }
    }

    setImportLoading(false); // Stop loading

    if (success > 0) {
      showToast(
        t('toast.importSuccess', { count: success }) + (fail > 0 ? `. Failed: ${fail}` : ''),
        'success',
        5000
      );
      setShowImport(false);
      resetImport();
    } else {
      showToast(t('toast.importFailed'), 'error');
    }
  };

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

      <div className="flex justify-end items-center mb-2">
        <div className="flex gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-5 h-5" />
            {t('customers.importCSV')}
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700"
          >
            <Plus className="w-5 h-5" />
            {t('customers.addCustomer')}
          </button>
        </div>
      </div>

      <CustomerSearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {showImport && (
        <CustomerImportModal
          importFile={importFile}
          importPreview={importPreview}
          importErrors={importErrors}
          onFileChange={handleFileChange}
          onDownloadTemplate={downloadTemplate}
          onImport={handleImport}
          onClose={() => {
            setShowImport(false);
            resetImport();
          }}
          loading={importLoading}
        />
      )}

      {showForm && (
        <CustomerForm
          formData={formData}
          onChange={setFormData}
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowForm(false);
            resetForm();
          }}
          loading={loading}
          isEditing={!!editingCustomer}
        />
      )}

      <CustomerTable
        customers={sortedData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onSort={handleSort}
        SortIcon={SortIcon}
      />

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, customerId: null })}
        onConfirm={confirmDelete}
        title={t('confirmDialog.deleteCustomerTitle')}
        message={t('customers.confirmDelete')}
      />

      <div className="mt-4 text-sm text-gray-600">
        {t('customers.showingOf', { count: sortedData.length, total: customers.length })}
      </div>
    </div>
  );
};

export default CustomerManagementPage;