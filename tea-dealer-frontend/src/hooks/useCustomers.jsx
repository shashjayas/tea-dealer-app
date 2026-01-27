import { useState, useEffect } from 'react';
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../services/customerService';

export const useCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
      setError(null);
    } catch (err) {
      setError('Error fetching customers');
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const addCustomer = async (customerData) => {
    setLoading(true);
    try {
      const newCustomer = await createCustomer(customerData);
      setCustomers(prev => [...prev, newCustomer]);
      setRefreshTrigger(prev => prev + 1);
      return { success: true };
    } catch (err) {
      console.error('Error creating customer:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const editCustomer = async (id, customerData) => {
    setLoading(true);
    try {
      const updatedCustomer = await updateCustomer(id, customerData);
      setCustomers(prev => 
        prev.map(customer => customer.id === id ? updatedCustomer : customer)
      );
      setRefreshTrigger(prev => prev + 1);
      return { success: true };
    } catch (err) {
      console.error('Error updating customer:', err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const removeCustomer = async (id) => {
    try {
      await deleteCustomer(id);
      setCustomers(prev => prev.filter(customer => customer.id !== id));
      setRefreshTrigger(prev => prev + 1);
      return { success: true };
    } catch (err) {
      console.error('Error deleting customer:', err);
      return { success: false, error: err.message };
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  return {
    customers,
    loading,
    error,
    refreshTrigger,
    fetchCustomers,
    addCustomer,
    editCustomer,
    removeCustomer,
  };
};