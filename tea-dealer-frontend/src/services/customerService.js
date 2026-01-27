import { apiCall } from './api';

export const getCustomers = async () => {
  return await apiCall('/customers');
};

export const createCustomer = async (customerData) => {
  return await apiCall('/customers', {
    method: 'POST',
    body: JSON.stringify(customerData),
  });
};

export const updateCustomer = async (id, customerData) => {
  return await apiCall(`/customers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(customerData),
  });
};

export const deleteCustomer = async (id) => {
  return await apiCall(`/customers/${id}`, {
    method: 'DELETE',
  });
};