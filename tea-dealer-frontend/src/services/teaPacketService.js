import { apiCall } from './api';

// Tea Packet Types
export const getTeaPacketTypes = async () => {
  return await apiCall('/tea-packets/types');
};

export const getActiveTeaPacketTypes = async () => {
  return await apiCall('/tea-packets/types/active');
};

export const createTeaPacketType = async (typeData) => {
  return await apiCall('/tea-packets/types', {
    method: 'POST',
    body: JSON.stringify(typeData),
  });
};

export const updateTeaPacketType = async (id, typeData) => {
  return await apiCall(`/tea-packets/types/${id}`, {
    method: 'PUT',
    body: JSON.stringify(typeData),
  });
};

export const deleteTeaPacketType = async (id) => {
  return await apiCall(`/tea-packets/types/${id}`, {
    method: 'DELETE',
  });
};

// Tea Packet Stock
export const getTeaPacketStock = async (year, month) => {
  return await apiCall(`/tea-packets/stock/${year}/${month}`);
};

export const addTeaPacketStock = async (stockData) => {
  return await apiCall('/tea-packets/stock', {
    method: 'POST',
    body: JSON.stringify(stockData),
  });
};

export const deleteTeaPacketStock = async (id) => {
  return await apiCall(`/tea-packets/stock/${id}`, {
    method: 'DELETE',
  });
};

export const getAvailablePacketsByTypeAndWeight = async (typeId, packetWeightGrams, year, month) => {
  return await apiCall(`/tea-packets/stock/available/${typeId}/${packetWeightGrams}/${year}/${month}`);
};

// Tea Packet Supply
export const getTeaPacketSupplies = async (year, month) => {
  return await apiCall(`/tea-packets/supply/${year}/${month}`);
};

export const getTeaPacketSuppliesByCustomer = async (customerId, year, month) => {
  return await apiCall(`/tea-packets/supply/customer/${customerId}/${year}/${month}`);
};

export const recordTeaPacketSupply = async (supplyData) => {
  return await apiCall('/tea-packets/supply', {
    method: 'POST',
    body: JSON.stringify(supplyData),
  });
};

export const deleteTeaPacketSupply = async (id) => {
  return await apiCall(`/tea-packets/supply/${id}`, {
    method: 'DELETE',
  });
};

export const getCustomerTeaPacketTotal = async (customerId, year, month) => {
  return await apiCall(`/tea-packets/supply/customer/${customerId}/total/${year}/${month}`);
};
