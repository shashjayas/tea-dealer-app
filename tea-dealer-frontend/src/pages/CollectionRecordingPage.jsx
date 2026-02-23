import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCustomerContext } from '../contexts/CustomerContext';
import { useCollections } from '../hooks/useCollections';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';
import CollectionStats from '../components/collections/CollectionStats';
import CollectionTable from '../components/collections/CollectionTable';
import QuickAddModal from '../components/collections/QuickAddModal';
import CollectionSummary from '../components/collections/CollectionSummary';

const CollectionRecordingPage = () => {
  const { t } = useTranslation();
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
    getGradeTotal,
    getCollectedCount,
  } = useCollections();

  const { toasts, showToast, removeToast } = useToast();

  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [quickAddForm, setQuickAddForm] = useState({
    customerId: '',
    collectionDate: new Date().toISOString().split('T')[0],
    weightKg: '',
    grade: 'GRADE_2',
    notes: ''
  });

  useEffect(() => {
    fetchCollections(selectedDate);
  }, [selectedDate]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
  };

  const handleWeightChange = async (customerId, weight, grade = 'GRADE_2') => {
    await saveCollectionEntry(customerId, weight, grade, selectedDate);
  };

  const handleQuickAdd = async () => {
    if (!quickAddForm.customerId || !quickAddForm.weightKg) {
      showToast(t('collections.selectCustomerAndWeight'), 'warning');
      return;
    }

    const result = await quickAddCollection(quickAddForm);

    if (result.success) {
      showToast(t('toast.collectionAddedSuccess'), 'success');
      setShowQuickAdd(false);
      setQuickAddForm({
        customerId: '',
        collectionDate: new Date().toISOString().split('T')[0],
        weightKg: '',
        grade: 'GRADE_2',
        notes: ''
      });
      if (quickAddForm.collectionDate === selectedDate) {
        fetchCollections(selectedDate);
      }
    } else {
      showToast(t('toast.collectionAddFailed'), 'error');
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

      <CollectionStats
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        totalWeight={getTodayTotal()}
        grade1Total={getGradeTotal('GRADE_1')}
        grade2Total={getGradeTotal('GRADE_2')}
        collectedCount={getCollectedCount()}
        totalCustomers={customers.length}
        onQuickAdd={() => setShowQuickAdd(true)}
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
        grade1Total={getGradeTotal('GRADE_1')}
        grade2Total={getGradeTotal('GRADE_2')}
        collectedCount={getCollectedCount()}
      />
    </div>
  );
};

export default CollectionRecordingPage;