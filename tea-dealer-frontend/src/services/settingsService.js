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

// Setting keys
export const SETTING_KEYS = {
  LOGIN_BACKGROUND: 'login_background',
  THEME_COLOR: 'theme_color',
  DEALER_NAME: 'dealer_name',
  REGISTRATION_NUMBER: 'registration_number',
  DEALER_ADDRESS: 'dealer_address',
  AUTO_ARREARS_CARRY_FORWARD: 'auto_arrears_carry_forward',
  STAMP_FEE_MODE: 'stamp_fee_mode',
  STAMP_FEE_NET_PAY_THRESHOLD: 'stamp_fee_net_pay_threshold',
  STAMP_FEE_SUPPLY_KG_THRESHOLD: 'stamp_fee_supply_kg_threshold',
  INVOICE_INCLUDE_GRAPHICS: 'invoice_include_graphics',
  INVOICE_PAGE_SIZE: 'invoice_page_size',
  INVOICE_TEMPLATE_IMAGE: 'invoice_template_image',
  INVOICE_TEMPLATE_FIELDS: 'invoice_template_fields',
  INVOICE_TEMPLATE_SIZE: 'invoice_template_size',
  INVOICE_TEMPLATE_FONT_SIZE: 'invoice_template_font_size',
  INVOICE_TEMPLATE_FONT_FAMILY: 'invoice_template_font_family',
  // Page visibility settings
  PAGE_STOCK_ENABLED: 'page_stock_enabled',
  PAGE_DEDUCTIONS_ENABLED: 'page_deductions_enabled',
  PAGE_INVOICES_ENABLED: 'page_invoices_enabled',
  PAGE_REPORTS_ENABLED: 'page_reports_enabled',
  // Stock page tab visibility
  STOCK_TAB_FERTILIZER_ENABLED: 'stock_tab_fertilizer_enabled',
  STOCK_TAB_TEA_PACKETS_ENABLED: 'stock_tab_tea_packets_enabled',
  // Deduction rounding mode
  DEDUCTION_ROUNDING_MODE: 'deduction_rounding_mode',
  // Language preference
  LANGUAGE: 'language',
  // Special notes for invoices
  SPECIAL_NOTE_1_ENABLED: 'special_note_1_enabled',
  SPECIAL_NOTE_1_TEXT: 'special_note_1_text',
  SPECIAL_NOTE_2_ENABLED: 'special_note_2_enabled',
  SPECIAL_NOTE_2_TEXT: 'special_note_2_text',
};

// Deduction rounding mode options
export const DEDUCTION_ROUNDING_MODES = {
  HALF_UP: 'half_up',                   // Round to nearest, .5 rounds up (default)
  INCLUDE_DECIMALS: 'include_decimals', // Keep 2 decimal places as-is
  CEILING: 'ceiling',                   // Round to next integer (always up)
  FLOOR: 'floor',                       // Exclude decimals (truncate/always down)
};

// Stamp fee mode options
export const STAMP_FEE_MODES = {
  INCLUDE_ALL: 'include_all',
  EXCLUDE_NO_SUPPLY: 'exclude_no_supply',
  EXCLUDE_NET_PAY_ABOVE: 'exclude_net_pay_above',
  EXCLUDE_SUPPLY_MORE_THAN: 'exclude_supply_more_than',
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

// Auto arrears carry-forward helpers
export const getAutoArrearsEnabled = async () => {
  const value = await getSettingValue(SETTING_KEYS.AUTO_ARREARS_CARRY_FORWARD);
  return value === 'true';
};

export const saveAutoArrearsEnabled = async (enabled) => {
  return await saveSetting(SETTING_KEYS.AUTO_ARREARS_CARRY_FORWARD, enabled ? 'true' : 'false');
};

// Stamp fee settings helpers
export const getStampFeeSettings = async () => {
  const [mode, netPayThreshold, supplyKgThreshold] = await Promise.all([
    getSettingValue(SETTING_KEYS.STAMP_FEE_MODE),
    getSettingValue(SETTING_KEYS.STAMP_FEE_NET_PAY_THRESHOLD),
    getSettingValue(SETTING_KEYS.STAMP_FEE_SUPPLY_KG_THRESHOLD),
  ]);
  return {
    mode: mode || STAMP_FEE_MODES.INCLUDE_ALL,
    netPayThreshold: netPayThreshold ? parseFloat(netPayThreshold) : 0,
    supplyKgThreshold: supplyKgThreshold ? parseFloat(supplyKgThreshold) : 0,
  };
};

export const saveStampFeeSettings = async (mode, netPayThreshold, supplyKgThreshold) => {
  await Promise.all([
    saveSetting(SETTING_KEYS.STAMP_FEE_MODE, mode || STAMP_FEE_MODES.INCLUDE_ALL),
    saveSetting(SETTING_KEYS.STAMP_FEE_NET_PAY_THRESHOLD, (netPayThreshold || 0).toString()),
    saveSetting(SETTING_KEYS.STAMP_FEE_SUPPLY_KG_THRESHOLD, (supplyKgThreshold || 0).toString()),
  ]);
};

// Invoice PDF settings
export const PAGE_SIZE_OPTIONS = {
  A5: 'A5',
  A4: 'A4',
  A6: 'A6',
  LETTER: 'LETTER',
};

export const getInvoicePdfSettings = async () => {
  const [includeGraphics, pageSize] = await Promise.all([
    getSettingValue(SETTING_KEYS.INVOICE_INCLUDE_GRAPHICS),
    getSettingValue(SETTING_KEYS.INVOICE_PAGE_SIZE),
  ]);
  return {
    includeGraphics: includeGraphics === 'true',
    pageSize: pageSize || PAGE_SIZE_OPTIONS.A5,
  };
};

export const saveInvoicePdfSettings = async (includeGraphics, pageSize) => {
  await Promise.all([
    saveSetting(SETTING_KEYS.INVOICE_INCLUDE_GRAPHICS, includeGraphics ? 'true' : 'false'),
    saveSetting(SETTING_KEYS.INVOICE_PAGE_SIZE, pageSize || PAGE_SIZE_OPTIONS.A5),
  ]);
};

// Invoice template configuration helpers
export const getInvoiceTemplateConfig = async () => {
  const [templateImage, fieldsJson, sizeJson, fontSize, fontFamily] = await Promise.all([
    getSettingValue(SETTING_KEYS.INVOICE_TEMPLATE_IMAGE),
    getSettingValue(SETTING_KEYS.INVOICE_TEMPLATE_FIELDS),
    getSettingValue(SETTING_KEYS.INVOICE_TEMPLATE_SIZE),
    getSettingValue(SETTING_KEYS.INVOICE_TEMPLATE_FONT_SIZE),
    getSettingValue(SETTING_KEYS.INVOICE_TEMPLATE_FONT_FAMILY),
  ]);

  return {
    templateImage: templateImage || null,
    fields: fieldsJson ? JSON.parse(fieldsJson) : [],
    templateSize: sizeJson ? JSON.parse(sizeJson) : { width: 800, height: 1000 },
    globalFontSize: fontSize ? parseInt(fontSize) : 12,
    globalFontFamily: fontFamily || "'Courier New', Courier, monospace",
  };
};

export const saveInvoiceTemplateConfig = async (config) => {
  await Promise.all([
    config.templateImage
      ? saveSetting(SETTING_KEYS.INVOICE_TEMPLATE_IMAGE, config.templateImage)
      : deleteSetting(SETTING_KEYS.INVOICE_TEMPLATE_IMAGE),
    saveSetting(SETTING_KEYS.INVOICE_TEMPLATE_FIELDS, JSON.stringify(config.fields || [])),
    saveSetting(SETTING_KEYS.INVOICE_TEMPLATE_SIZE, JSON.stringify(config.templateSize || { width: 800, height: 1000 })),
    saveSetting(SETTING_KEYS.INVOICE_TEMPLATE_FONT_SIZE, (config.globalFontSize || 12).toString()),
    saveSetting(SETTING_KEYS.INVOICE_TEMPLATE_FONT_FAMILY, config.globalFontFamily || "'Courier New', Courier, monospace"),
  ]);
};

export const clearInvoiceTemplate = async () => {
  await Promise.all([
    deleteSetting(SETTING_KEYS.INVOICE_TEMPLATE_IMAGE),
    deleteSetting(SETTING_KEYS.INVOICE_TEMPLATE_FIELDS),
    deleteSetting(SETTING_KEYS.INVOICE_TEMPLATE_SIZE),
    deleteSetting(SETTING_KEYS.INVOICE_TEMPLATE_FONT_SIZE),
    deleteSetting(SETTING_KEYS.INVOICE_TEMPLATE_FONT_FAMILY),
  ]);
};

// Page visibility settings helpers
export const getPageVisibilitySettings = async () => {
  const [stockEnabled, deductionsEnabled, invoicesEnabled, reportsEnabled, fertilizerTabEnabled, teaPacketsTabEnabled] = await Promise.all([
    getSettingValue(SETTING_KEYS.PAGE_STOCK_ENABLED),
    getSettingValue(SETTING_KEYS.PAGE_DEDUCTIONS_ENABLED),
    getSettingValue(SETTING_KEYS.PAGE_INVOICES_ENABLED),
    getSettingValue(SETTING_KEYS.PAGE_REPORTS_ENABLED),
    getSettingValue(SETTING_KEYS.STOCK_TAB_FERTILIZER_ENABLED),
    getSettingValue(SETTING_KEYS.STOCK_TAB_TEA_PACKETS_ENABLED),
  ]);
  return {
    stockEnabled: stockEnabled !== 'false', // Default to true
    deductionsEnabled: deductionsEnabled !== 'false', // Default to true
    invoicesEnabled: invoicesEnabled !== 'false', // Default to true
    reportsEnabled: reportsEnabled !== 'false', // Default to true
    fertilizerTabEnabled: fertilizerTabEnabled !== 'false', // Default to true
    teaPacketsTabEnabled: teaPacketsTabEnabled !== 'false', // Default to true
  };
};

export const savePageVisibilitySettings = async (settings) => {
  await Promise.all([
    saveSetting(SETTING_KEYS.PAGE_STOCK_ENABLED, settings.stockEnabled ? 'true' : 'false'),
    saveSetting(SETTING_KEYS.PAGE_DEDUCTIONS_ENABLED, settings.deductionsEnabled ? 'true' : 'false'),
    saveSetting(SETTING_KEYS.PAGE_INVOICES_ENABLED, settings.invoicesEnabled ? 'true' : 'false'),
    saveSetting(SETTING_KEYS.PAGE_REPORTS_ENABLED, settings.reportsEnabled ? 'true' : 'false'),
    saveSetting(SETTING_KEYS.STOCK_TAB_FERTILIZER_ENABLED, settings.fertilizerTabEnabled ? 'true' : 'false'),
    saveSetting(SETTING_KEYS.STOCK_TAB_TEA_PACKETS_ENABLED, settings.teaPacketsTabEnabled ? 'true' : 'false'),
  ]);
};

// Deduction rounding mode helpers
export const getDeductionRoundingMode = async () => {
  const value = await getSettingValue(SETTING_KEYS.DEDUCTION_ROUNDING_MODE);
  return value || DEDUCTION_ROUNDING_MODES.HALF_UP; // Default to half_up
};

export const saveDeductionRoundingMode = async (mode) => {
  return await saveSetting(SETTING_KEYS.DEDUCTION_ROUNDING_MODE, mode || DEDUCTION_ROUNDING_MODES.HALF_UP);
};

// Language preference helpers
export const LANGUAGES = {
  ENGLISH: 'en',
  SINHALA: 'si',
};

export const getLanguage = async () => {
  const value = await getSettingValue(SETTING_KEYS.LANGUAGE);
  return value || LANGUAGES.ENGLISH; // Default to English
};

export const saveLanguage = async (language) => {
  return await saveSetting(SETTING_KEYS.LANGUAGE, language || LANGUAGES.ENGLISH);
};

// Special notes helpers
export const getSpecialNotes = async () => {
  const [note1Enabled, note1Text, note2Enabled, note2Text] = await Promise.all([
    getSettingValue(SETTING_KEYS.SPECIAL_NOTE_1_ENABLED),
    getSettingValue(SETTING_KEYS.SPECIAL_NOTE_1_TEXT),
    getSettingValue(SETTING_KEYS.SPECIAL_NOTE_2_ENABLED),
    getSettingValue(SETTING_KEYS.SPECIAL_NOTE_2_TEXT),
  ]);
  return {
    note1Enabled: note1Enabled === 'true',
    note1Text: note1Text || '',
    note2Enabled: note2Enabled === 'true',
    note2Text: note2Text || '',
  };
};

export const saveSpecialNotes = async (notes) => {
  await Promise.all([
    saveSetting(SETTING_KEYS.SPECIAL_NOTE_1_ENABLED, notes.note1Enabled ? 'true' : 'false'),
    saveSetting(SETTING_KEYS.SPECIAL_NOTE_1_TEXT, notes.note1Text || ''),
    saveSetting(SETTING_KEYS.SPECIAL_NOTE_2_ENABLED, notes.note2Enabled ? 'true' : 'false'),
    saveSetting(SETTING_KEYS.SPECIAL_NOTE_2_TEXT, notes.note2Text || ''),
  ]);
};
