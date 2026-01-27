import React from 'react';
import { Save, XCircle } from 'lucide-react';

const CustomerForm = ({ formData, onChange, onSubmit, onCancel, loading, isEditing }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white flex justify-between items-center sticky top-0">
          <h3 className="text-xl font-bold">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h3>
          <button onClick={onCancel} className="hover:bg-white/20 p-2 rounded-lg">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Book Number *</label>
              <input
                type="text"
                value={formData.bookNumber}
                onChange={(e) => onChange({ ...formData, bookNumber: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="TB001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Route *</label>
              <input
                type="text"
                value={formData.route}
                onChange={(e) => onChange({ ...formData, route: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Route A"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grower Name (Sinhala) *</label>
            <input
              type="text"
              value={formData.growerNameSinhala}
              onChange={(e) => onChange({ ...formData, growerNameSinhala: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grower Name (English) *</label>
            <input
              type="text"
              value={formData.growerNameEnglish}
              onChange={(e) => onChange({ ...formData, growerNameEnglish: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
            <textarea
              value={formData.address}
              onChange={(e) => onChange({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              rows="3"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">NIC Number</label>
              <input
                type="text"
                value={formData.nic}
                onChange={(e) => onChange({ ...formData, nic: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
              <input
                type="text"
                value={formData.contactNumber}
                onChange={(e) => onChange({ ...formData, contactNumber: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Land Name</label>
            <input
              type="text"
              value={formData.landName}
              onChange={(e) => onChange({ ...formData, landName: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>
          <div className="flex gap-3">
            <button
              onClick={onSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50"
            >
              <Save className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Customer'}
            </button>
            <button onClick={onCancel} className="px-6 py-3 border text-gray-700 rounded-lg hover:bg-gray-50">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerForm;