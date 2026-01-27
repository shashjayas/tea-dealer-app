import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useCustomerContext } from '../contexts/CustomerContext';
import { useCollections } from '../hooks/useCollections';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';
import CollectionStats from '../components/collections/CollectionStats';
import CollectionTable from '../components/collections/CollectionTable';
import QuickAddModal from '../components/collections/QuickAddModal';
import CollectionSummary from '../components/collections/CollectionSummary';

const CollectionRecordingPage = () => {
  const { customers } = useCustomerContext();
  const {
    collections,
    selectedDate,
    saving,
    setSelectedDate,
    fetchCollections,
    saveCollectionEntry,
    quickAddCollection,
    getTodayTotal,
    getCollectedCount,
  } = useCollections();

  const { toasts, showToast, removeToast } = useToast();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    customerId: '',
    collectionDate: new Date().toISOString().split('T')[0],
    weightKg: '',
    notes: ''
  });

  useEffect(() => {
    fetchCollections(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleWeightChange = async (customerId, weight) => {
    await saveCollectionEntry(customerId, weight, selectedDate);
  };

  const handleQuickAdd = async () => {
    if (!quickAddForm.customerId || !quickAddForm.weightKg) {
      showToast('Please select customer and enter weight', 'warning');
      return;
    }

    const result = await quickAddCollection(quickAddForm);
    
    if (result.success) {
      showToast('Collection added successfully', 'success');
      setShowQuickAdd(false);
      setQuickAddForm({
        customerId: '',
        collectionDate: new Date().toISOString().split('T')[0],
        weightKg: '',
        notes: ''
      });
      if (quickAddForm.collectionDate === selectedDate) {
        fetchCollections(selectedDate);
      }
    } else {
      showToast('Failed to add collection', 'error');
    }
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
        <h2 className="text-2xl font-bold text-gray-800">Daily Collection Sheet</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowQuickAdd(true)}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            Quick Add
          </button>
        </div>
      </div>

      <CollectionStats
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        totalWeight={getTodayTotal()}
        collectedCount={getCollectedCount()}
        totalCustomers={customers.length}
      />

      {showQuickAdd && (
        <QuickAddModal
          customers={customers}
          formData={quickAddForm}
          onChange={setQuickAddForm}
          onSubmit={handleQuickAdd}
          onClose={() => setShowQuickAdd(false)}
        />
      )}

      <CollectionTable
        customers={customers}
        collections={collections}
        saving={saving}
        onWeightChange={handleWeightChange}
      />

      <CollectionSummary
        totalWeight={getTodayTotal()}
        collectedCount={getCollectedCount()}
      />
    </div>
  );
};

export default CollectionRecordingPage;