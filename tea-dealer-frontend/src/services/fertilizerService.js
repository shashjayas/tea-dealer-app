import { apiCall } from './api';

// Fertilizer Types
export const getFertilizerTypes = async () => {
  return await apiCall('/fertilizer/types');
};

export const getActiveFertilizerTypes = async () => {
  return await apiCall('/fertilizer/types/active');
};

export const createFertilizerType = async (typeData) => {
  return await apiCall('/fertilizer/types', {
    method: 'POST',
    body: JSON.stringify(typeData),
  });
};

export const updateFertilizerType = async (id, typeData) => {
  return await apiCall(`/fertilizer/types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(typeData),
  });
};

export const deleteFertilizerType = async (id) => {
  return await apiCall(`/fertilizer/types/${id}`, {
    method: 'DELETE',
  });
};

// Fertilizer Stock
export const getStockByPeriod = async (year, month) => {
  return await apiCall(`/fertilizer/stock/${year}/${month}`);
};

export const getAvailableStock = async (typeId, year, month) => {
  return await apiCall(`/fertilizer/stock/available/${typeId}/${year}/${month}`);
};

export const addStock = async (stockData) => {
  return await apiCall('/fertilizer/stock', {
    method: 'POST',
    body: JSON.stringify(stockData),
  });
};

export const deleteStock = async (id) => {
  return await apiCall(`/fertilizer/stock/${id}`, {
    method: 'DELETE',
  });
};

export const getAvailableBagsByTypeAndSize = async (typeId, bagSizeKg, year, month) => {
  return await apiCall(`/fertilizer/stock/available/${typeId}/${bagSizeKg}/${year}/${month}`);
};

// Fertilizer Supply
export const getSuppliesByPeriod = async (year, month) => {
  return await apiCall(`/fertilizer/supply/${year}/${month}`);
};

export const getSuppliesByCustomer = async (customerId) => {
  return await apiCall(`/fertilizer/supply/customer/${customerId}`);
};

export const recordSupply = async (supplyData) => {
  return await apiCall('/fertilizer/supply', {
    method: 'POST',
    body: JSON.stringify(supplyData),
  });
};

export const deleteSupply = async (id) => {
  return await apiCall(`/fertilizer/supply/${id}`, {
    method: 'DELETE',
  });
};

export const getCustomerTypeTotal = async (customerId, typeId) => {
  return await apiCall(`/fertilizer/supply/customer/${customerId}/type/${typeId}/total`);
};
