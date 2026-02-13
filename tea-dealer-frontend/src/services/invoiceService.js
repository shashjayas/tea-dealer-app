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

// PDF Download
export const downloadInvoicePdf = async (invoiceId, filename) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download invoice PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'invoice.pdf';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};

export const downloadInvoicePdfByPeriod = async (customerId, year, month, filename) => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/invoices/customer/${customerId}/period/${year}/${month}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to download invoice PDF');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'invoice.pdf';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
