import { apiCall } from './api';

export const getUsers = async () => {
  return await apiCall('/users');
};

export const getUserById = async (id) => {
  return await apiCall(`/users/${id}`);
};

export const createUser = async (userData) => {
  return await apiCall('/users', {
    method: 'POST',
    body: JSON.stringify(userData),
  });
};

export const updateUser = async (id, userData) => {
  return await apiCall(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(userData),
  });
};

export const deleteUser = async (id, currentUserId) => {
  return await apiCall(`/users/${id}`, {
    method: 'DELETE',
    headers: {
      'X-Current-User-Id': currentUserId,
    },
  });
};

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DEALER: 'DEALER',
};

export const isSuperAdmin = (user) => {
  return user?.role === ROLES.SUPER_ADMIN;
};
