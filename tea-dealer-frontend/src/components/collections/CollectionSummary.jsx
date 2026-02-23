import React from 'react';
import { useTranslation } from 'react-i18next';

const CollectionSummary = ({ totalWeight, grade1Total, grade2Total, collectedCount }) => {
  const { t } = useTranslation();

  return (
    <div className="mt-4 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-lg">
      <div className="flex justify-between items-center mb-3">
        <span className="text-lg font-bold">{t('collections.dailySummary')}</span>
        <div className="flex gap-8">
          <div>
            <span className="text-sm opacity-90">{t('collections.totalWeight')}: </span>
            <span className="text-xl font-bold">{totalWeight} {t('common.kg')}</span>
          </div>
          <div>
            <span className="text-sm opacity-90">{t('collections.customersCollected')}: </span>
            <span className="text-xl font-bold">{collectedCount}</span>
          </div>
        </div>
      </div>
      <div className="flex gap-6 pt-3 border-t border-white/20">
        <div className="flex-1 bg-white/10 rounded-lg p-3">
          <span className="text-xs opacity-90">{t('collections.grade1')}: </span>
          <span className="text-lg font-bold">{grade1Total} {t('common.kg')}</span>
        </div>
        <div className="flex-1 bg-white/20 rounded-lg p-3">
          <span className="text-xs opacity-90">{t('collections.grade2Default')}: </span>
          <span className="text-lg font-bold">{grade2Total} {t('common.kg')}</span>
        </div>
      </div>
    </div>
  );
};

export default CollectionSummary;
