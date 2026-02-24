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

// PDF Download - use dynamic hostname for network access
const getApiBaseUrl = () => {
  const host = window.location.hostname;
  return `http://${host}:8080/api`;
};

export const downloadInvoicePdf = async (invoiceId, filename) => {
  const API_BASE_URL = getApiBaseUrl();
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/invoices/${invoiceId}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Try to get error message from response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to download invoice PDF');
    }
    throw new Error(`Failed to download invoice PDF: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();

  // Verify we got a PDF
  if (blob.type && !blob.type.includes('pdf')) {
    throw new Error('Server returned invalid response (not a PDF)');
  }

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
  const API_BASE_URL = getApiBaseUrl();
  const token = localStorage.getItem('token');

  const response = await fetch(`${API_BASE_URL}/invoices/customer/${customerId}/period/${year}/${month}/pdf`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    // Try to get error message from response
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to download invoice PDF');
    }
    throw new Error(`Failed to download invoice PDF: ${response.status} ${response.statusText}`);
  }

  const blob = await response.blob();

  // Verify we got a PDF
  if (blob.type && !blob.type.includes('pdf')) {
    throw new Error('Server returned invalid response (not a PDF)');
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || 'invoice.pdf';
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
};
