import { apiCall } from './api';

export const getRatesByYear = async (year) => {
  return await apiCall(`/rates/year/${year}`);
};

export const getRateByYearAndMonth = async (year, month) => {
  return await apiCall(`/rates/${year}/${month}`);
};

export const saveRate = async (rateData) => {
  return await apiCall('/rates', {
    method: 'POST',
    body: JSON.stringify(rateData),
  });
};

export const updateRate = async (id, rateData) => {
  return await apiCall(`/rates/${id}`, {
    method: 'PUT',
    body: JSON.stringify(rateData),
  });
};

export const deleteRate = async (id) => {
  return await apiCall(`/rates/${id}`, {
    method: 'DELETE',
  });
};
