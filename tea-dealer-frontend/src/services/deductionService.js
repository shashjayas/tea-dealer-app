import { apiCall } from './api';

export const getDeductionByCustomerAndPeriod = async (customerId, year, month) => {
  try {
    return await apiCall(`/deductions/customer/${customerId}/period/${year}/${month}`);
  } catch (error) {
    // Return null if not found (404), otherwise rethrow
    if (error.message?.includes('Not Found') || error.message?.includes('404')) {
      return null;
    }
    throw error;
  }
};

export const calculateMonthlyTotals = async (customerId, year, month) => {
  return await apiCall(`/deductions/calculate/${customerId}/${year}/${month}`);
};

export const saveDeduction = async (deductionData) => {
  console.log('Saving deduction:', deductionData);
  const result = await apiCall('/deductions', {
    method: 'POST',
    body: JSON.stringify(deductionData),
  });
  console.log('Save result:', result);
  return result;
};

export const deleteDeduction = async (id) => {
  return await apiCall(`/deductions/${id}`, {
    method: 'DELETE',
  });
};

export const getDeductionsByPeriod = async (year, month) => {
  return await apiCall(`/deductions/period/${year}/${month}`);
};

export const getAutoArrears = async (customerId, year, month) => {
  return await apiCall(`/deductions/auto-arrears/${customerId}/${year}/${month}`);
};
