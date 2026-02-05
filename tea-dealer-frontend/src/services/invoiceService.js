import { apiCall } from './api';

// Legacy endpoints (for real-time data)
export const getCollectionsByBookNumberAndDateRange = async (bookNumber, startDate, endDate) => {
  return await apiCall(`/collections/book-number/${bookNumber}/date-range?startDate=${startDate}&endDate=${endDate}`);
};

export const getMonthlyTotals = async (customerId, year, month) => {
  return await apiCall(`/deductions/calculate/${customerId}/${year}/${month}`);
};

export const getDeductionByCustomerAndPeriod = async (customerId, year, month) => {
  return await apiCall(`/deductions/customer/${customerId}/period/${year}/${month}`);
};

// Invoice generation endpoints
export const getInvoicesByPeriod = async (year, month) => {
  return await apiCall(`/invoices/period/${year}/${month}`);
};

export const getInvoiceByCustomerAndPeriod = async (customerId, year, month) => {
  return await apiCall(`/invoices/customer/${customerId}/period/${year}/${month}`);
};

export const getInvoiceCountByPeriod = async (year, month) => {
  return await apiCall(`/invoices/count/${year}/${month}`);
};

export const generateInvoice = async (customerId, year, month) => {
  return await apiCall(`/invoices/generate/${customerId}/${year}/${month}`, {
    method: 'POST',
  });
};

export const generateAllInvoices = async (year, month) => {
  return await apiCall(`/invoices/generate-all/${year}/${month}`, {
    method: 'POST',
  });
};

export const regenerateInvoice = async (customerId, year, month) => {
  return await apiCall(`/invoices/regenerate/${customerId}/${year}/${month}`, {
    method: 'POST',
  });
};

export const updateInvoiceStatus = async (id, status) => {
  return await apiCall(`/invoices/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  });
};

export const deleteInvoice = async (id) => {
  return await apiCall(`/invoices/${id}`, {
    method: 'DELETE',
  });
};
