import { apiCall } from './api';

export const getDeductionByCustomerAndPeriod = async (customerId, year, month) => {
  return await apiCall(`/deductions/customer/${customerId}/period/${year}/${month}`);
};

export const calculateMonthlyTotals = async (customerId, year, month) => {
  return await apiCall(`/deductions/calculate/${customerId}/${year}/${month}`);
};

export const saveDeduction = async (deductionData) => {
  return await apiCall('/deductions', {
    method: 'POST',
    body: JSON.stringify(deductionData),
  });
};

export const deleteDeduction = async (id) => {
  return await apiCall(`/deductions/${id}`, {
    method: 'DELETE',
  });
};

export const getDeductionsByPeriod = async (year, month) => {
  return await apiCall(`/deductions/period/${year}/${month}`);
};
