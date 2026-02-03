import { useState } from 'react';
import { getCollectionsByDate, saveCollection, deleteCollection } from '../services/collectionService';

export const useCollections = (initialDate = new Date().toISOString().split('T')[0]) => {
  const [collections, setCollections] = useState({});
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});

  const fetchCollections = async (date = selectedDate) => {
    setLoading(true);
    try {
      const data = await getCollectionsByDate(date);
      const collectionsMap = {};
      data.forEach(col => {
        const customerId = col.customer.id;
        if (!collectionsMap[customerId]) {
          collectionsMap[customerId] = {};
        }
        // Store collections by grade for each customer
        collectionsMap[customerId][col.grade] = {
          id: col.id,
          weightKg: col.weightKg,
          notes: col.notes,
          grade: col.grade
        };
      });
      setCollections(collectionsMap);
    } catch (error) {
      console.error('Error fetching collections:', error);
      setCollections({});
    } finally {
      setLoading(false);
    }
  };

  const saveCollectionEntry = async (customerId, weight, grade = 'GRADE_2', date = selectedDate) => {
    const savingKey = `${customerId}_${grade}`;

    if (weight === '' || weight === '0') {
      const customerCollections = collections[customerId];
      const collection = customerCollections?.[grade];
      if (collection && collection.id) {
        try {
          await deleteCollection(collection.id);
          setCollections(prev => {
            const updated = { ...prev };
            if (updated[customerId]) {
              delete updated[customerId][grade];
              // Remove customer entry if no grades left
              if (Object.keys(updated[customerId]).length === 0) {
                delete updated[customerId];
              }
            }
            return updated;
          });
        } catch (error) {
          console.error('Error deleting collection:', error);
        }
      }
      return;
    }

    const weightValue = parseFloat(weight);
    if (isNaN(weightValue) || weightValue < 0) return;

    setSaving(prev => ({ ...prev, [savingKey]: true }));

    try {
      const saved = await saveCollection({
        customerId: customerId,
        collectionDate: date,
        weightKg: weightValue,
        grade: grade,
        ratePerKg: 0
      });

      setCollections(prev => ({
        ...prev,
        [customerId]: {
          ...prev[customerId],
          [grade]: {
            id: saved.id,
            weightKg: saved.weightKg,
            notes: saved.notes,
            grade: saved.grade
          }
        }
      }));
    } catch (error) {
      console.error('Error saving collection:', error);
    } finally {
      setSaving(prev => ({ ...prev, [savingKey]: false }));
    }
  };

  const quickAddCollection = async (formData) => {
    try {
      await saveCollection({
        ...formData,
        ratePerKg: 0
      });
      return { success: true };
    } catch (error) {
      console.error('Error adding collection:', error);
      return { success: false };
    }
  };

  const getTodayTotal = () => {
    let total = 0;
    Object.values(collections).forEach(customerCollections => {
      Object.values(customerCollections).forEach(col => {
        total += parseFloat(col.weightKg || 0);
      });
    });
    return total.toFixed(2);
  };

  const getGradeTotal = (grade) => {
    let total = 0;
    Object.values(collections).forEach(customerCollections => {
      if (customerCollections[grade]) {
        total += parseFloat(customerCollections[grade].weightKg || 0);
      }
    });
    return total.toFixed(2);
  };

  const getCollectedCount = () => {
    return Object.keys(collections).length;
  };

  return {
    collections,
    selectedDate,
    loading,
    saving,
    setSelectedDate,
    fetchCollections,
    saveCollectionEntry,
    quickAddCollection,
    getTodayTotal,
    getGradeTotal,
    getCollectedCount,
  };
};