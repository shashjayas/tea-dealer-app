import React from 'react';
import { Save, Trash2 } from 'lucide-react';

const RateForm = ({ formData, onChange, onSave, saving, isEditing }) => {
  return (
    <div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {/* Tea Packet Price */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Tea Packet Price (Rs.)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.teaPacketPrice || ''}
              onChange={(e) => onChange({ ...formData, teaPacketPrice: e.target.value })}
              className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 outline-none text-sm"
              placeholder="0.00"
            />
            {formData.teaPacketPrice && (
              <button
                onClick={() => onChange({ ...formData, teaPacketPrice: '' })}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear field"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Transport Percentage */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Transport (%)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.transportPercentage || ''}
              onChange={(e) => onChange({ ...formData, transportPercentage: e.target.value })}
              className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 outline-none text-sm"
              placeholder="0.00"
            />
            {formData.transportPercentage && (
              <button
                onClick={() => onChange({ ...formData, transportPercentage: '' })}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear field"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Stamp Fee */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Stamp Fee (Rs.)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.stampFee || ''}
              onChange={(e) => onChange({ ...formData, stampFee: e.target.value })}
              className="w-full px-3 py-1.5 pr-8 border border-gray-300 rounded-md focus:ring-1 focus:ring-green-500 outline-none text-sm"
              placeholder="0.00"
            />
            {formData.stampFee && (
              <button
                onClick={() => onChange({ ...formData, stampFee: '' })}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear field"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Grade 1 Rate */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Grade 1 Rate (Rs./kg)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.grade1Rate || ''}
              onChange={(e) => onChange({ ...formData, grade1Rate: e.target.value })}
              className="w-full px-3 py-1.5 pr-8 border border-amber-300 rounded-md focus:ring-1 focus:ring-amber-500 outline-none bg-amber-50 text-sm"
              placeholder="0.00"
            />
            {formData.grade1Rate && (
              <button
                onClick={() => onChange({ ...formData, grade1Rate: '' })}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear field"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Grade 2 Rate */}
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Grade 2 Rate (Rs./kg)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={formData.grade2Rate || ''}
              onChange={(e) => onChange({ ...formData, grade2Rate: e.target.value })}
              className="w-full px-3 py-1.5 pr-8 border border-green-300 rounded-md focus:ring-1 focus:ring-green-500 outline-none bg-green-50 text-sm"
              placeholder="0.00"
            />
            {formData.grade2Rate && (
              <button
                onClick={() => onChange({ ...formData, grade2Rate: '' })}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                title="Clear field"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Save Button - aligned in grid */}
        <div className="flex items-end">
          <button
            onClick={onSave}
            disabled={saving}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-1.5 rounded-md hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50 text-sm font-medium"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RateForm;
