import React, { useState } from 'react';
import { Plus, Upload } from 'lucide-react';
import { useCustomerContext } from '../contexts/CustomerContext';
import { useSorting } from '../hooks/useSorting';
import { useCSVImport } from '../hooks/useCSVImport';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';
import CustomerSearchBar from '../components/customers/CustomerSearchBar';
import CustomerTable from '../components/customers/CustomerTable';
import CustomerForm from '../components/customers/CustomerForm';
import CustomerImportModal from '../components/customers/CustomerImportModal';

const CustomerManagementPage = () => {
  const { customers, loading, addCustomer, editCustomer, removeCustomer } = useCustomerContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({
    bookNumber: '', growerNameSinhala: '', growerNameEnglish: '',
    address: '', nic: '', landName: '', contactNumber: '', route: ''
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
      showToast(editingCustomer ? 'Customer updated successfully' : 'Customer added successfully', 'success');
      resetForm();
      setShowForm(false);
    } else {
      showToast('Failed to save customer', 'error');
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
      route: customer.route
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      const result = await removeCustomer(id);
      if (result.success) {
        showToast('Customer deleted successfully', 'success');
      } else {
        showToast('Failed to delete customer', 'error');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      bookNumber: '', growerNameSinhala: '', growerNameEnglish: '',
      address: '', nic: '', landName: '', contactNumber: '', route: ''
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
      showToast('No valid customers to import', 'warning');
      return;
    }

    let success = 0;
    let fail = 0;

    for (const customer of importPreview) {
      const result = await addCustomer(customer);
      if (result.success) success++;
      else fail++;
    }

    if (success > 0) {
      showToast(`Successfully imported ${success} customer(s)${fail > 0 ? `. Failed: ${fail}` : ''}`, 'success', 5000);
      setShowImport(false);
      resetImport();
    } else {
      showToast(`Import failed. ${fail} customer(s) could not be imported`, 'error');
    }
  };

  const handleCloseImport = () => {
    setShowImport(false);
    resetImport();
  };

  return (
    <div className="p-6">
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

      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customer Management</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Upload className="w-5 h-5" />
            Import CSV
          </button>
          <button
            onClick={() => {
              resetForm();
              setShowForm(true);
            }}
            className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700"
          >
            <Plus className="w-5 h-5" />
            Add Customer
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
          onClose={handleCloseImport}
          loading={loading}
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

      <div className="mt-4 text-sm text-gray-600">
        Showing {sortedData.length} of {customers.length} customers
      </div>
    </div>
  );
};

export default CustomerManagementPage;