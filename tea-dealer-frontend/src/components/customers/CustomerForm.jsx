import React from 'react';
import { Save, XCircle } from 'lucide-react';

const CustomerForm = ({ formData, onChange, onSubmit, onCancel, loading, isEditing }) => {
  const isBookNumberEmpty = !formData.bookNumber?.trim();
  const isNameEnglishEmpty = !formData.growerNameEnglish?.trim();
  const isFormValid = !isBookNumberEmpty && !isNameEnglishEmpty;

  const handleSubmit = () => {
    if (isFormValid) {
      onSubmit();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-3 text-white flex justify-between items-center rounded-t-xl">
          <h3 className="text-lg font-bold">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button onClick={onCancel} className="hover:bg-white/20 p-1.5 rounded-lg">
            <XCircle className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Book Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.bookNumber}
                onChange={(e) => onChange({ ...formData, bookNumber: e.target.value })}
                className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm ${
                  isBookNumberEmpty ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="TB001"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Route</label>
              <input
                type="text"
                value={formData.route}
                onChange={(e) => onChange({ ...formData, route: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
                placeholder="Route A"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Contact Number</label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => onChange({ ...formData, contactNumber: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Grower Name (Sinhala)</label>
              <input
                type="text"
                value={formData.growerNameSinhala}
                onChange={(e) => onChange({ ...formData, growerNameSinhala: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Grower Name (English) <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.growerNameEnglish}
                onChange={(e) => onChange({ ...formData, growerNameEnglish: e.target.value })}
                className={`w-full px-3 py-1.5 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm ${
                  isNameEnglishEmpty ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">NIC Number</label>
              <input
                type="text"
                value={formData.nic}
                onChange={(e) => onChange({ ...formData, nic: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Land Name</label>
              <input
                type="text"
                value={formData.landName}
                onChange={(e) => onChange({ ...formData, landName: e.target.value })}
                className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => onChange({ ...formData, address: e.target.value })}
              className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-sm"
              rows="2"
            />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-2 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
            <button onClick={onCancel} className="px-4 py-2 border text-gray-700 rounded-lg hover:bg-gray-50 text-sm">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;
