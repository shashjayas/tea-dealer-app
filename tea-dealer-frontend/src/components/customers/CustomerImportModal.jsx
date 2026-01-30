import React from 'react';
import { Upload, Download, FileText, XCircle, Loader2 } from 'lucide-react';

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
          <button 
            onClick={onClose} 
            className="hover:bg-white/20 p-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
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
              className="mt-3 flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              <Download className="w-4 h-4" />
              Download Template
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors">
            <input
              type="file"
              accept=".csv"
              onChange={onFileChange}
              className="hidden"
              id="csv-file"
              disabled={loading}
            />
            <label 
              htmlFor="csv-file" 
              className={`cursor-pointer flex flex-col items-center gap-3 ${loading ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}
            >
              <Upload className={`w-12 h-12 ${importFile ? 'text-blue-500' : 'text-gray-400'}`} />
              <p className="text-lg font-semibold text-gray-700">
                {importFile ? importFile.name : 'Click to upload CSV'}
              </p>
              {importFile && !loading && (
                <p className="text-xs text-gray-500">Click again to change file</p>
              )}
            </label>
          </div>

          {importErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-900 mb-2">⚠️ Errors Found:</h4>
              <ul className="text-sm text-red-700 max-h-32 overflow-y-auto space-y-1">
                {importErrors.map((err, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-red-500 mt-0.5">•</span>
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {importPreview.length > 0 && !loading && (
            <div>
              <h4 className="font-semibold text-gray-800 mb-3">
                Preview ({importPreview.length} customers)
              </h4>
              <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <div className="bg-gray-50 p-3 grid grid-cols-4 gap-2 text-sm font-semibold border-b sticky top-0">
                  <div>Book No.</div>
                  <div>English</div>
                  <div>Sinhala</div>
                  <div>Route</div>
                </div>
                {importPreview.slice(0, 10).map((c, i) => (
                  <div key={i} className="p-3 grid grid-cols-4 gap-2 text-sm border-b hover:bg-blue-50 transition-colors">
                    <div className="font-medium text-gray-900">{c.bookNumber}</div>
                    <div className="text-gray-700">{c.growerNameEnglish}</div>
                    <div className="text-gray-600">{c.growerNameSinhala}</div>
                    <div>
                      <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                        {c.route}
                      </span>
                    </div>
                  </div>
                ))}
                {importPreview.length > 10 && (
                  <div className="p-3 text-center text-sm text-gray-500 bg-gray-50">
                    ...and {importPreview.length - 10} more customers
                  </div>
                )}
              </div>
            </div>
          )}

          {loading && (
            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-300 rounded-lg p-8 shadow-lg">
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-800 mb-1">
                    Importing Customers...
                  </p>
                  <p className="text-sm text-gray-600">
                    Please wait while we process your file
                  </p>
                </div>
                <div className="flex space-x-2 mt-4">
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-3 h-3 bg-cyan-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={onImport}
              disabled={loading || importPreview.length === 0}
              className="flex-1 bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-cyan-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-5 h-5 animate-spin" />}
              {loading 
                ? 'Importing...' 
                : `Import ${importPreview.length} Customer${importPreview.length !== 1 ? 's' : ''}`
              }
            </button>
            <button
              onClick={onClose}
              disabled={loading}
              className="px-8 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
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