import { useState } from 'react';
import { getRatesByYear, getRateByYearAndMonth, saveRate, deleteRate } from '../services/rateService';

export const useRates = () => {
  const [rates, setRates] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchRatesByYear = async (year = selectedYear) => {
    setLoading(true);
    try {
      const data = await getRatesByYear(year);
      const ratesMap = {};
      data.forEach(rate => {
        ratesMap[rate.month] = rate;
      });
      setRates(ratesMap);
    } catch (error) {
      console.error('Error fetching rates:', error);
      setRates({});
    } finally {
      setLoading(false);
    }
  };

  const fetchRateByMonth = async (year = selectedYear, month = selectedMonth) => {
    setLoading(true);
    try {
      const data = await getRateByYearAndMonth(year, month);
      setRates(prev => ({
        ...prev,
        [month]: data
      }));
      return data;
    } catch (error) {
      console.error('Error fetching rate:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const saveMonthlyRate = async (rateData) => {
    setSaving(true);
    try {
      const saved = await saveRate(rateData);
      setRates(prev => ({
        ...prev,
        [saved.month]: saved
      }));
      return { success: true, data: saved };
    } catch (error) {
      console.error('Error saving rate:', error);
      return { success: false, error: error.message };
    } finally {
      setSaving(false);
    }
  };

  const deleteMonthlyRate = async (id, month) => {
    try {
      await deleteRate(id);
      setRates(prev => {
        const updated = { ...prev };
        delete updated[month];
        return updated;
      });
      return { success: true };
    } catch (error) {
      console.error('Error deleting rate:', error);
      return { success: false, error: error.message };
    }
  };

  const getCurrentRate = (month = selectedMonth) => {
    return rates[month] || null;
  };

  return {
    rates,
    selectedYear,
    selectedMonth,
    loading,
    saving,
    setSelectedYear,
    setSelectedMonth,
    fetchRatesByYear,
    fetchRateByMonth,
    saveMonthlyRate,
    deleteMonthlyRate,
    getCurrentRate,
  };
};
