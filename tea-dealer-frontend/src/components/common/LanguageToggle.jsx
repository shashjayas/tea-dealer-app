import React from 'react';
import { Globe } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';

const LanguageToggle = ({ compact = false }) => {
  const { currentLanguage, toggleLanguage, loading } = useLanguage();

  if (loading) return null;

  if (compact) {
    return (
      <button
        onClick={toggleLanguage}
        className="flex items-center gap-1.5 px-2 py-1.5 bg-green-700 hover:bg-green-800 rounded-lg text-sm font-medium transition-colors text-white"
        title={currentLanguage === 'en' ? 'Switch to Sinhala' : 'Switch to English'}
      >
        <Globe className="w-4 h-4" />
        <span>{currentLanguage === 'en' ? 'සිං' : 'EN'}</span>
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-500" />
      <div className="flex">
        <button
          onClick={() => currentLanguage !== 'en' && toggleLanguage()}
          className={`px-3 py-1 rounded-l-lg text-sm font-medium transition-colors ${
            currentLanguage === 'en'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          EN
        </button>
        <button
          onClick={() => currentLanguage !== 'si' && toggleLanguage()}
          className={`px-3 py-1 rounded-r-lg text-sm font-medium transition-colors ${
            currentLanguage === 'si'
              ? 'bg-green-600 text-white'
              : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
          }`}
        >
          සිං
        </button>
      </div>
    </div>
  );
};

export default LanguageToggle;
