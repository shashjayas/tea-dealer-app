import { apiCall } from './api';

export const loginUser = async (username, password) => {
  return await apiCall('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
};