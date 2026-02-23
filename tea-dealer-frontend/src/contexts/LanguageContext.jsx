import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { getLanguage, saveLanguage, LANGUAGES } from '../services/settingsService';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const { i18n } = useTranslation();
  const [currentLanguage, setCurrentLanguage] = useState(LANGUAGES.ENGLISH);
  const [loading, setLoading] = useState(true);

  // Load language preference from database on mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const savedLang = await getLanguage();
        if (savedLang && (savedLang === LANGUAGES.ENGLISH || savedLang === LANGUAGES.SINHALA)) {
          setCurrentLanguage(savedLang);
          i18n.changeLanguage(savedLang);
        }
      } catch (error) {
        console.error('Error loading language preference:', error);
      } finally {
        setLoading(false);
      }
    };
    loadLanguage();
  }, [i18n]);

  // Change language and persist to database
  const changeLanguage = async (lang) => {
    try {
      await saveLanguage(lang);
      setCurrentLanguage(lang);
      i18n.changeLanguage(lang);
    } catch (error) {
      console.error('Error saving language preference:', error);
    }
  };

  // Toggle between English and Sinhala
  const toggleLanguage = () => {
    const newLang = currentLanguage === LANGUAGES.ENGLISH ? LANGUAGES.SINHALA : LANGUAGES.ENGLISH;
    changeLanguage(newLang);
  };

  return (
    <LanguageContext.Provider value={{
      currentLanguage,
      changeLanguage,
      toggleLanguage,
      loading,
      isEnglish: currentLanguage === LANGUAGES.ENGLISH,
      isSinhala: currentLanguage === LANGUAGES.SINHALA
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
