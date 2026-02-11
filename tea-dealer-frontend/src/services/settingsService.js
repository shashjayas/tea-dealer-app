import { apiCall } from './api';

export const getAllSettings = async () => {
  return await apiCall('/settings');
};

export const getSettingByKey = async (key) => {
  try {
    return await apiCall(`/settings/${key}`);
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};

export const getSettingValue = async (key) => {
  try {
    const result = await apiCall(`/settings/${key}/value`);
    return result?.value || null;
  } catch (error) {
    if (error.message.includes('404')) {
      return null;
    }
    throw error;
  }
};

export const saveSetting = async (key, value) => {
  return await apiCall('/settings', {
    method: 'POST',
    body: JSON.stringify({ key, value }),
  });
};

export const deleteSetting = async (key) => {
  return await apiCall(`/settings/${key}`, {
    method: 'DELETE',
  });
};

// Theme-specific helpers
export const SETTING_KEYS = {
  LOGIN_BACKGROUND: 'login_background',
  THEME_COLOR: 'theme_color',
  DEALER_NAME: 'dealer_name',
  REGISTRATION_NUMBER: 'registration_number',
  DEALER_ADDRESS: 'dealer_address',
};

export const getLoginBackground = async () => {
  return await getSettingValue(SETTING_KEYS.LOGIN_BACKGROUND);
};

export const saveLoginBackground = async (base64Image) => {
  return await saveSetting(SETTING_KEYS.LOGIN_BACKGROUND, base64Image);
};

export const clearLoginBackground = async () => {
  return await deleteSetting(SETTING_KEYS.LOGIN_BACKGROUND);
};

// Dealer info helpers
export const getDealerInfo = async () => {
  const [name, regNumber, address] = await Promise.all([
    getSettingValue(SETTING_KEYS.DEALER_NAME),
    getSettingValue(SETTING_KEYS.REGISTRATION_NUMBER),
    getSettingValue(SETTING_KEYS.DEALER_ADDRESS),
  ]);
  return { name, regNumber, address };
};

export const saveDealerInfo = async (name, regNumber, address) => {
  await Promise.all([
    saveSetting(SETTING_KEYS.DEALER_NAME, name || ''),
    saveSetting(SETTING_KEYS.REGISTRATION_NUMBER, regNumber || ''),
    saveSetting(SETTING_KEYS.DEALER_ADDRESS, address || ''),
  ]);
};
