import React from 'react';
import { Upload, Download, FileText, XCircle } from 'lucide-react';

const CustomerImportModal = ({
  importFile,
  importPreview,
  importErrors,
  onFileChange,
  onDownloadTemplate,
  onImport,
  onClose,
  loading
}) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-cyan-600 p-6 text-white flex justify-between items-center">
          <h3 className="text-xl font-bold">Import Customers from CSV</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-2 rounded-lg">
            <XCircle className="w-6 h-6" />
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5" />
              CSV Format
            </h4>
            <p className="text-sm text-blue-800 mb-2">
              Required: BookNumber, GrowerNameEnglish, GrowerNameSinhala, Route
            </p>
            <button
              onClick={onDownloadTemplate}
              className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm"
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <input
              type="file"
              accept=".csv"
              onChange={onFileChange}
              className="hidden"
              id="csv-file"
            />
            <label htmlFor="csv-file" className="cursor-pointer flex flex-col items-center gap-3">
              <Upload className="w-12 h-12 text-gray-400" />
              <p className="text-lg font-semibold text-gray-700">
                {importFile ? importFile.name : 'Click to upload CSV'}
              </p>
            </label>
          </div>
          {importErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">Errors:</h4>
              <ul className="text-sm text-red-700">
                {importErrors.map((err, i) => (
                  <li key={i}>• {err}</li>
                ))}
              </ul>
            </div>
          )}
          {importPreview.length > 0 && (
            <div>
              <h4 className="font-semibold mb-3">Preview ({importPreview.length} customers)</h4>
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <div className="bg-gray-50 p-3 grid grid-cols-4 gap-2 text-sm font-semibold border-b">
                  <div>Book No.</div>
                  <div>English</div>
                  <div>Sinhala</div>
                  <div>Route</div>
                </div>
                {importPreview.slice(0, 10).map((c, i) => (
                  <div key={i} className="p-3 grid grid-cols-4 gap-2 text-sm border-b">
                    <div>{c.bookNumber}</div>
                    <div>{c.growerNameEnglish}</div>
                    <div>{c.growerNameSinhala}</div>
                    <div>{c.route}</div>
                  </div>
                ))}
                {importPreview.length > 10 && (
                  <div className="p-3 text-center text-sm text-gray-500">
                    ...and {importPreview.length - 10} more
                  </div>
                )}
              </div>
            </div>
          )}
          <div className="flex gap-3">
            <button
              onClick={onImport}
              disabled={loading || importPreview.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50"
            >
              {loading ? 'Importing...' : `Import ${importPreview.length} Customers`}
            </button>
            <button
              onClick={onClose}
              className="px-6 py-3 border text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerImportModal;