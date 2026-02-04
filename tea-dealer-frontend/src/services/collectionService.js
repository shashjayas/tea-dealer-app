import { apiCall } from './api';

export const getCollectionsByDate = async (date) => {
  return await apiCall(`/collections/date/${date}`);
};

export const saveCollection = async (collectionData) => {
  return await apiCall('/collections', {
    method: 'POST',
    body: JSON.stringify(collectionData),
  });
};

export const deleteCollection = async (id) => {
  return await apiCall(`/collections/${id}`, {
    method: 'DELETE',
  });
};

export const getCollectionsByCustomer = async (customerId) => {
  return await apiCall(`/collections/customer/${customerId}`);
};

export const getCollectionsByDateRange = async (startDate, endDate) => {
  return await apiCall(`/collections/date-range?startDate=${startDate}&endDate=${endDate}`);
};