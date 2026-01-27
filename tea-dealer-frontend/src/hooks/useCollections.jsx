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
        collectionsMap[col.customer.id] = {
          id: col.id,
          weightKg: col.weightKg,
          notes: col.notes
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

  const saveCollectionEntry = async (customerId, weight, date = selectedDate) => {
    if (weight === '' || weight === '0') {
      const collection = collections[customerId];
      if (collection && collection.id) {
        try {
          await deleteCollection(collection.id);
          setCollections(prev => {
            const updated = { ...prev };
            delete updated[customerId];
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

    setSaving(prev => ({ ...prev, [customerId]: true }));

    try {
      const saved = await saveCollection({
        customerId: customerId,
        collectionDate: date,
        weightKg: weightValue,
        ratePerKg: 0
      });

      setCollections(prev => ({
        ...prev,
        [customerId]: {
          id: saved.id,
          weightKg: saved.weightKg,
          notes: saved.notes
        }
      }));
    } catch (error) {
      console.error('Error saving collection:', error);
    } finally {
      setSaving(prev => ({ ...prev, [customerId]: false }));
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
    return Object.values(collections).reduce((sum, col) => sum + parseFloat(col.weightKg || 0), 0).toFixed(2);
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
    getCollectedCount,
  };
};