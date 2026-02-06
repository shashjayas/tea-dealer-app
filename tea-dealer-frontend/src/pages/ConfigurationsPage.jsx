import React, { useState, useRef, useEffect } from 'react';
import { Settings, FileText, Upload, Trash2, Save, Eye, EyeOff, GripVertical } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';

const STORAGE_KEY = 'invoice_template_config';

const AVAILABLE_FIELDS = [
  { id: 'bookNumber', label: 'Book Number', sampleValue: '001' },
  { id: 'customerName', label: 'Customer Name (English)', sampleValue: 'John Doe' },
  { id: 'customerNameSinhala', label: 'Customer Name (Sinhala)', sampleValue: 'ජෝන් ඩෝ' },
  { id: 'month', label: 'Month', sampleValue: 'January' },
  { id: 'year', label: 'Year', sampleValue: '2025' },
  { id: 'grade1Kg', label: 'Grade 1 Kg', sampleValue: '150.50' },
  { id: 'grade2Kg', label: 'Grade 2 Kg', sampleValue: '75.25' },
  { id: 'totalKg', label: 'Total Kg', sampleValue: '225.75' },
  { id: 'grade1Rate', label: 'Grade 1 Rate', sampleValue: '120.00' },
  { id: 'grade2Rate', label: 'Grade 2 Rate', sampleValue: '100.00' },
  { id: 'grade1Amount', label: 'Grade 1 Amount', sampleValue: '18,060.00' },
  { id: 'grade2Amount', label: 'Grade 2 Amount', sampleValue: '7,525.00' },
  { id: 'totalAmount', label: 'Total Amount', sampleValue: '25,585.00' },
  { id: 'totalDeductions', label: 'Total Deductions', sampleValue: '5,000.00' },
  { id: 'netAmount', label: 'Net Amount', sampleValue: '20,585.00' },
  { id: 'advance', label: 'Advance', sampleValue: '2,000.00' },
  { id: 'loan', label: 'Loan', sampleValue: '1,500.00' },
  { id: 'fertilizer1', label: 'Fertilizer 1', sampleValue: '500.00' },
  { id: 'fertilizer2', label: 'Fertilizer 2', sampleValue: '300.00' },
  { id: 'teaPackets', label: 'Tea Packets', sampleValue: '200.00' },
  { id: 'transport', label: 'Transport', sampleValue: '250.00' },
  { id: 'stampFee', label: 'Stamp Fee', sampleValue: '50.00' },
  { id: 'otherDeductions', label: 'Other Deductions', sampleValue: '200.00' },
  { id: 'arrears', label: 'Arrears (Last Month)', sampleValue: '0.00' },
  { id: 'agrochemicals', label: 'Agrochemicals', sampleValue: '0.00' },
];

const ConfigurationsPage = () => {
  const { toasts, showToast, removeToast } = useToast();
  const [activeSection, setActiveSection] = useState('invoiceTemplate');

  // Invoice Template Editor State
  const [templateImage, setTemplateImage] = useState(null);
  const [templateSize, setTemplateSize] = useState({ width: 800, height: 1000 });
  const [placedFields, setPlacedFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const templateRef = useRef(null);
  const fileInputRef = useRef(null);

  // Load saved configuration
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setTemplateImage(config.templateImage || null);
        setTemplateSize(config.templateSize || { width: 800, height: 1000 });
        setPlacedFields(config.fields || []);
      } catch (e) {
        console.error('Error loading config:', e);
      }
    }
  }, []);

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setTemplateSize({ width: img.width, height: img.height });
          setTemplateImage(event.target.result);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragStart = (e, field) => {
    e.dataTransfer.setData('fieldId', field.id);
    e.dataTransfer.setData('isNew', 'true');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const fieldId = e.dataTransfer.getData('fieldId');
    const isNew = e.dataTransfer.getData('isNew') === 'true';

    if (!templateRef.current) return;

    const rect = templateRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (isNew) {
      if (placedFields.find(f => f.id === fieldId)) {
        showToast('Field already placed on template', 'error');
        return;
      }

      const fieldInfo = AVAILABLE_FIELDS.find(f => f.id === fieldId);
      setPlacedFields([...placedFields, {
        id: fieldId,
        label: fieldInfo.label,
        x,
        y,
        fontSize: 12,
        fontWeight: 'normal',
        align: 'center'
      }]);
    }
  };

  const handleFieldMouseDown = (e, field) => {
    e.stopPropagation();
    setSelectedField(field.id);
    setIsDragging(true);

    const rect = templateRef.current.getBoundingClientRect();
    const fieldX = (field.x / 100) * rect.width;
    const fieldY = (field.y / 100) * rect.height;

    setDragOffset({
      x: e.clientX - rect.left - fieldX,
      y: e.clientY - rect.top - fieldY
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !selectedField || !templateRef.current) return;

    const rect = templateRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left - dragOffset.x) / rect.width) * 100;
    const y = ((e.clientY - rect.top - dragOffset.y) / rect.height) * 100;

    const clampedX = Math.max(0, Math.min(100, x));
    const clampedY = Math.max(0, Math.min(100, y));

    setPlacedFields(fields => fields.map(f =>
      f.id === selectedField ? { ...f, x: clampedX, y: clampedY } : f
    ));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, selectedField, dragOffset]);

  const updateFieldProperty = (fieldId, property, value) => {
    setPlacedFields(fields => fields.map(f =>
      f.id === fieldId ? { ...f, [property]: value } : f
    ));
  };

  const removeField = (fieldId) => {
    setPlacedFields(fields => fields.filter(f => f.id !== fieldId));
    if (selectedField === fieldId) setSelectedField(null);
  };

  const saveConfiguration = () => {
    const config = {
      templateImage,
      templateSize,
      fields: placedFields
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    showToast('Template configuration saved successfully', 'success');
  };

  const clearTemplate = () => {
    setTemplateImage(null);
    setPlacedFields([]);
    setSelectedField(null);
    localStorage.removeItem(STORAGE_KEY);
    showToast('Template cleared', 'success');
  };

  const selectedFieldData = placedFields.find(f => f.id === selectedField);
  const unusedFields = AVAILABLE_FIELDS.filter(f => !placedFields.find(p => p.id === f.id));

  return (
    <div className="p-3">
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          onClose={() => removeToast(toast.id)}
        />
      ))}

      <div className="bg-white rounded-lg shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-green-600" />
            <h1 className="text-lg font-bold text-gray-800">Configurations</h1>
          </div>
        </div>

        {/* Section Tabs */}
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 border-b border-gray-200">
            <button
              onClick={() => setActiveSection('invoiceTemplate')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'invoiceTemplate'
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Invoice Template
            </button>
            {/* Future configuration sections can be added here */}
          </div>
        </div>

        {/* Invoice Template Editor Section */}
        {activeSection === 'invoiceTemplate' && (
          <div className="p-4">
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  <Upload className="w-4 h-4" />
                  Upload Template
                </button>
                {templateImage && (
                  <button
                    onClick={clearTemplate}
                    className="flex items-center gap-2 px-3 py-1.5 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium ${
                    showPreview ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {showPreview ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  {showPreview ? 'Hide Preview' : 'Show Preview'}
                </button>
                <button
                  onClick={saveConfiguration}
                  disabled={!templateImage}
                  className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  <Save className="w-4 h-4" />
                  Save Configuration
                </button>
              </div>
            </div>

            <div className="flex gap-4">
              {/* Available Fields Panel */}
              <div className="w-56 flex-shrink-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-2">Available Fields</h3>
                <div className="border border-gray-200 rounded-lg max-h-[500px] overflow-y-auto">
                  {unusedFields.length > 0 ? (
                    unusedFields.map(field => (
                      <div
                        key={field.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, field)}
                        className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 last:border-b-0 cursor-grab hover:bg-gray-50 text-sm"
                      >
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-700">{field.label}</span>
                      </div>
                    ))
                  ) : (
                    <div className="px-3 py-4 text-center text-gray-500 text-sm">
                      All fields placed
                    </div>
                  )}
                </div>

                {/* Placed Fields */}
                {placedFields.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Placed Fields</h3>
                    <div className="border border-gray-200 rounded-lg max-h-[200px] overflow-y-auto">
                      {placedFields.map(field => (
                        <div
                          key={field.id}
                          onClick={() => setSelectedField(field.id)}
                          className={`flex items-center justify-between px-3 py-2 border-b border-gray-100 last:border-b-0 cursor-pointer text-sm ${
                            selectedField === field.id ? 'bg-green-50' : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-gray-700 truncate">{field.label}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removeField(field.id);
                            }}
                            className="p-1 text-red-500 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Template Canvas */}
              <div className="flex-1">
                {templateImage ? (
                  <div
                    ref={templateRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={() => setSelectedField(null)}
                    className="relative border border-gray-300 rounded-lg overflow-hidden mx-auto"
                    style={{
                      width: Math.min(templateSize.width, 600),
                      height: (Math.min(templateSize.width, 600) / templateSize.width) * templateSize.height,
                      backgroundImage: `url(${templateImage})`,
                      backgroundSize: 'contain',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      cursor: isDragging ? 'grabbing' : 'default'
                    }}
                  >
                    {placedFields.map(field => {
                      const fieldInfo = AVAILABLE_FIELDS.find(f => f.id === field.id);
                      return (
                        <div
                          key={field.id}
                          onMouseDown={(e) => handleFieldMouseDown(e, field)}
                          className={`absolute transform -translate-x-1/2 cursor-grab select-none ${
                            selectedField === field.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                          }`}
                          style={{
                            left: `${field.x}%`,
                            top: `${field.y}%`,
                            fontSize: `${field.fontSize}px`,
                            fontWeight: field.fontWeight,
                            textAlign: field.align,
                            fontFamily: "'Courier New', Courier, monospace",
                            backgroundColor: showPreview ? 'transparent' : 'rgba(255,255,255,0.9)',
                            padding: showPreview ? '0' : '2px 4px',
                            borderRadius: '2px',
                            whiteSpace: 'nowrap'
                          }}
                        >
                          {showPreview ? fieldInfo?.sampleValue : field.label}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[400px] border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                    <FileText className="w-12 h-12 text-gray-300 mb-3" />
                    <p className="text-gray-500 mb-2">No template uploaded</p>
                    <p className="text-sm text-gray-400">Upload your pre-printed invoice form image</p>
                  </div>
                )}
              </div>

              {/* Field Properties Panel */}
              {selectedFieldData && (
                <div className="w-52 flex-shrink-0">
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Field Properties</h3>
                  <div className="border border-gray-200 rounded-lg p-3 space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Field</label>
                      <div className="text-sm font-medium text-gray-800">{selectedFieldData.label}</div>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Font Size</label>
                      <input
                        type="number"
                        value={selectedFieldData.fontSize}
                        onChange={(e) => updateFieldProperty(selectedField, 'fontSize', parseInt(e.target.value) || 12)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                        min="8"
                        max="32"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Font Weight</label>
                      <select
                        value={selectedFieldData.fontWeight}
                        onChange={(e) => updateFieldProperty(selectedField, 'fontWeight', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="normal">Normal</option>
                        <option value="bold">Bold</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Alignment</label>
                      <select
                        value={selectedFieldData.align}
                        onChange={(e) => updateFieldProperty(selectedField, 'align', e.target.value)}
                        className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                      >
                        <option value="left">Left</option>
                        <option value="center">Center</option>
                        <option value="right">Right</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">X (%)</label>
                        <input
                          type="number"
                          value={selectedFieldData.x.toFixed(1)}
                          onChange={(e) => updateFieldProperty(selectedField, 'x', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-1">Y (%)</label>
                        <input
                          type="number"
                          value={selectedFieldData.y.toFixed(1)}
                          onChange={(e) => updateFieldProperty(selectedField, 'y', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => removeField(selectedField)}
                      className="w-full flex items-center justify-center gap-1 px-3 py-1.5 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove Field
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Help Text */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg text-sm text-blue-700">
              <strong>How to use:</strong> Upload your pre-printed invoice form image, then drag fields from the left panel onto the template.
              Position them where values should print. Click a field to adjust its properties. Save when done.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfigurationsPage;
