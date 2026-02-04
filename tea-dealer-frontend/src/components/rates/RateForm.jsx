import React from 'react';
import { Save, Trash2 } from 'lucide-react';

const RateForm = ({ formData, onChange, onSave, saving, isEditing }) => {
  return (
    <div className="bg-white rounded-xl shadow-lg p-6">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tea Packet Price */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tea Packet Price (Rs.)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.teaPacketPrice || ''}
              onChange={(e) => onChange({ ...formData, teaPacketPrice: e.target.value })}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="0.00"
            />
            {formData.teaPacketPrice && (
              <button
                onClick={() => onChange({ ...formData, teaPacketPrice: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear field"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Transport Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transport (%)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.transportPercentage || ''}
              onChange={(e) => onChange({ ...formData, transportPercentage: e.target.value })}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="0.00"
            />
            {formData.transportPercentage && (
              <button
                onClick={() => onChange({ ...formData, transportPercentage: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear field"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Stamp Fee */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Stamp Fee (Rs.)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.stampFee || ''}
              onChange={(e) => onChange({ ...formData, stampFee: e.target.value })}
              className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              placeholder="0.00"
            />
            {formData.stampFee && (
              <button
                onClick={() => onChange({ ...formData, stampFee: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear field"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Grade 1 Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade 1 Rate (Rs./kg)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.grade1Rate || ''}
              onChange={(e) => onChange({ ...formData, grade1Rate: e.target.value })}
              className="w-full px-4 py-2 pr-10 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-amber-50"
              placeholder="0.00"
            />
            {formData.grade1Rate && (
              <button
                onClick={() => onChange({ ...formData, grade1Rate: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear field"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Grade 2 Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grade 2 Rate (Rs./kg)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.grade2Rate || ''}
              onChange={(e) => onChange({ ...formData, grade2Rate: e.target.value })}
              className="w-full px-4 py-2 pr-10 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-green-50"
              placeholder="0.00"
            />
            {formData.grade2Rate && (
              <button
                onClick={() => onChange({ ...formData, grade2Rate: '' })}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear field"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          onClick={onSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? 'Saving...' : 'Save Rates'}
        </button>
      </div>
    </div>
  );
};

export default RateForm;
