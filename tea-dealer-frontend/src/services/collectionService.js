import { apiCall } from './api';

export const getCollectionsByDate = async (date) => {
  return await apiCall(`/collections/date/${date}`);
};

export const saveCollection = async (collectionData) => {
  return await apiCall('/collections', {
    method: 'POST',
    body: JSON.stringify(collectionData),
  });
};

export const deleteCollection = async (id) => {
  return await apiCall(`/collections/${id}`, {
    method: 'DELETE',
  });
};