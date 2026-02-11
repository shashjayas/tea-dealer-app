import React, { useState, useRef, useEffect } from 'react';
import { FileText, Upload, Trash2, Save, Eye, EyeOff, GripVertical, Leaf, Plus, Edit2, X, Palette, Image as ImageIcon, Users } from 'lucide-react';
import { useToast } from '../hooks/useToast';
import Toast from '../components/common/Toast';
import ConfirmDialog from '../components/common/ConfirmDialog';
import {
  getFertilizerTypes,
  createFertilizerType,
  updateFertilizerType,
  deleteFertilizerType
} from '../services/fertilizerService';
import {
  getLoginBackground,
  saveLoginBackground as saveLoginBgToDb,
  clearLoginBackground as clearLoginBgFromDb,
  getDealerInfo,
  saveDealerInfo
} from '../services/settingsService';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
  ROLES
} from '../services/userService';

const STORAGE_KEY = 'invoice_template_config';
const CACHE_KEY = 'login_background_cache';

// Generate day fields for 1-31
const DAY_FIELDS = Array.from({ length: 31 }, (_, i) => ({
  id: `day${String(i + 1).padStart(2, '0')}`,
  label: `Day ${String(i + 1).padStart(2, '0')}`,
  sampleValue: i % 3 === 0 ? '45' : '-'
}));

const AVAILABLE_FIELDS = [
  { id: 'bookNumber', label: 'Book Number', sampleValue: '001' },
  { id: 'customerName', label: 'Customer Name (English)', sampleValue: 'John Doe' },
  { id: 'customerNameSinhala', label: 'Customer Name (Sinhala)', sampleValue: 'ජෝන් ඩෝ' },
  { id: 'month', label: 'Month', sampleValue: 'January' },
  { id: 'year', label: 'Year', sampleValue: '2025' },
  // Daily collection fields
  ...DAY_FIELDS,
  { id: 'grade1Kg', label: 'Grade 1 Kg', sampleValue: '150.50' },
  { id: 'grade2Kg', label: 'Grade 2 Kg', sampleValue: '75.25' },
  { id: 'totalKg', label: 'Total Kg', sampleValue: '225.75' },
  { id: 'supplyDeductionKg', label: 'Supply Deduction Kg', sampleValue: '11.29' },
  { id: 'supplyDeductionPercent', label: 'Supply Deduction %', sampleValue: '5.0' },
  { id: 'payableKg', label: 'Payable Kg', sampleValue: '214.46' },
  { id: 'grade1Rate', label: 'Grade 1 Rate', sampleValue: '120.00' },
  { id: 'grade2Rate', label: 'Grade 2 Rate', sampleValue: '100.00' },
  { id: 'grade1Amount', label: 'Grade 1 Amount', sampleValue: '18,060.00' },
  { id: 'grade2Amount', label: 'Grade 2 Amount', sampleValue: '7,525.00' },
  { id: 'totalAmount', label: 'Gross Amount', sampleValue: '25,585.00' },
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

const ConfigurationsPage = ({ currentUser }) => {
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
  const [globalFontSize, setGlobalFontSize] = useState(12);
  const [globalFontFamily, setGlobalFontFamily] = useState("'Courier New', Courier, monospace");

  const templateRef = useRef(null);
  const fileInputRef = useRef(null);
  const containerRef = useRef(null);

  // Fertilizer Types State
  const [fertilizerTypes, setFertilizerTypes] = useState([]);
  const [showTypeForm, setShowTypeForm] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeForm, setTypeForm] = useState({ name: '', bagSizes: '', unit: 'kg', active: true });
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  // Theme Settings State
  const [loginBackground, setLoginBackground] = useState(null);
  const [dealerName, setDealerName] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState('');
  const [dealerAddress, setDealerAddress] = useState('');
  const themeFileInputRef = useRef(null);

  // User Management State
  const [users, setUsers] = useState([]);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [userForm, setUserForm] = useState({ username: '', password: '', email: '', role: 'DEALER' });

  // Load fertilizer types
  useEffect(() => {
    if (activeSection === 'fertilizerTypes') {
      loadFertilizerTypes();
    }
  }, [activeSection]);

  // Load theme settings from database
  useEffect(() => {
    const loadThemeSettings = async () => {
      try {
        const [bg, dealerInfo] = await Promise.all([
          getLoginBackground(),
          getDealerInfo()
        ]);
        if (bg) {
          setLoginBackground(bg);
        }
        if (dealerInfo) {
          setDealerName(dealerInfo.name || '');
          setRegistrationNumber(dealerInfo.regNumber || '');
          setDealerAddress(dealerInfo.address || '');
        }
      } catch (e) {
        console.error('Error loading theme settings:', e);
      }
    };
    if (activeSection === 'themeSettings') {
      loadThemeSettings();
    }
  }, [activeSection]);

  // Load users
  useEffect(() => {
    if (activeSection === 'userManagement') {
      loadUsers();
    }
  }, [activeSection]);

  const loadUsers = async () => {
    try {
      const userList = await getUsers();
      setUsers(userList || []);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Error loading users', 'error');
    }
  };

  const handleSaveUser = async () => {
    if (!userForm.username || (!editingUser && !userForm.password)) {
      showToast('Please fill in required fields', 'warning');
      return;
    }

    try {
      if (editingUser) {
        await updateUser(editingUser.id, userForm);
        showToast('User updated successfully', 'success');
      } else {
        await createUser(userForm);
        showToast('User created successfully', 'success');
      }
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ username: '', password: '', email: '', role: 'DEALER' });
      loadUsers();
    } catch (error) {
      showToast(error.message || 'Error saving user', 'error');
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setUserForm({
      username: user.username,
      password: '',
      email: user.email || '',
      role: user.role
    });
    setShowUserForm(true);
  };

  const handleDeleteUser = (user) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete User',
      message: `Are you sure you want to delete user "${user.username}"?`,
      onConfirm: async () => {
        try {
          await deleteUser(user.id, currentUser?.id);
          showToast('User deleted successfully', 'success');
          loadUsers();
        } catch (error) {
          showToast(error.message || 'Error deleting user', 'error');
        }
      }
    });
  };

  const loadFertilizerTypes = async () => {
    try {
      const types = await getFertilizerTypes();
      setFertilizerTypes(types || []);
    } catch (error) {
      console.error('Error loading fertilizer types:', error);
      showToast('Error loading fertilizer types', 'error');
    }
  };

  const handleSaveType = async () => {
    if (!typeForm.name || !typeForm.bagSizes) {
      showToast('Please fill in name and bag sizes', 'warning');
      return;
    }

    try {
      if (editingType) {
        await updateFertilizerType(editingType.id, typeForm);
        showToast('Fertilizer type updated', 'success');
      } else {
        await createFertilizerType(typeForm);
        showToast('Fertilizer type created', 'success');
      }
      setShowTypeForm(false);
      setEditingType(null);
      setTypeForm({ name: '', bagSizes: '', unit: 'kg', active: true });
      loadFertilizerTypes();
    } catch (error) {
      showToast('Error saving fertilizer type', 'error');
    }
  };

  const handleEditType = (type) => {
    setEditingType(type);
    setTypeForm({
      name: type.name,
      bagSizes: type.bagSizes,
      unit: type.unit || 'kg',
      active: type.active
    });
    setShowTypeForm(true);
  };

  const handleDeleteType = (type) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Delete Fertilizer Type',
      message: `Are you sure you want to delete "${type.name}"?`,
      onConfirm: async () => {
        try {
          await deleteFertilizerType(type.id);
          showToast('Fertilizer type deleted', 'success');
          loadFertilizerTypes();
        } catch (error) {
          showToast('Error deleting fertilizer type', 'error');
        }
      }
    });
  };

  // Theme Settings Handlers
  const handleLoginBgUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Image size should be less than 5MB', 'warning');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setLoginBackground(event.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveThemeSettings = async () => {
    try {
      const promises = [];

      if (loginBackground) {
        promises.push(saveLoginBgToDb(loginBackground));
        // Also save to localStorage cache for fast loading
        localStorage.setItem(CACHE_KEY, loginBackground);
      }

      // Save dealer info
      promises.push(saveDealerInfo(dealerName, registrationNumber, dealerAddress));

      await Promise.all(promises);
      showToast('Theme settings saved successfully', 'success');
    } catch (error) {
      console.error('Error saving theme settings:', error);
      showToast('Error saving theme settings', 'error');
    }
  };

  const clearLoginBackground = async () => {
    try {
      await clearLoginBgFromDb();
      // Also clear from localStorage cache
      localStorage.removeItem(CACHE_KEY);
      setLoginBackground(null);
      showToast('Login background removed', 'success');
    } catch (error) {
      console.error('Error removing login background:', error);
      showToast('Error removing login background', 'error');
    }
  };

  // Load saved configuration
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const config = JSON.parse(saved);
        setTemplateImage(config.templateImage || null);
        setTemplateSize(config.templateSize || { width: 800, height: 1000 });
        setPlacedFields(config.fields || []);
        setGlobalFontSize(config.globalFontSize || 12);
        setGlobalFontFamily(config.globalFontFamily || "'Courier New', Courier, monospace");
      } catch (e) {
        console.error('Error loading config:', e);
      }
    }
  }, []);

  // Keyboard navigation for selected field
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedField || !templateRef.current) return;

      const step = e.shiftKey ? 1 : 0.2; // Shift for larger steps
      let dx = 0, dy = 0;

      switch (e.key) {
        case 'ArrowUp': dy = -step; break;
        case 'ArrowDown': dy = step; break;
        case 'ArrowLeft': dx = -step; break;
        case 'ArrowRight': dx = step; break;
        case 'Delete':
        case 'Backspace':
          if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'SELECT') {
            removeField(selectedField);
          }
          return;
        default: return;
      }

      e.preventDefault();
      setPlacedFields(fields => fields.map(f => {
        if (f.id === selectedField) {
          return {
            ...f,
            x: Math.max(0, Math.min(100, f.x + dx)),
            y: Math.max(0, Math.min(100, f.y + dy))
          };
        }
        return f;
      }));
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedField]);

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
      fields: placedFields,
      globalFontSize,
      globalFontFamily
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    showToast('Template configuration saved successfully', 'success');
  };

  const applyGlobalFontSize = () => {
    setPlacedFields(fields => fields.map(f => ({ ...f, fontSize: globalFontSize })));
    showToast('Font size applied to all fields', 'success');
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
            <button
              onClick={() => setActiveSection('fertilizerTypes')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'fertilizerTypes'
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Leaf className="w-4 h-4" />
              Fertilizer Types
            </button>
            <button
              onClick={() => setActiveSection('themeSettings')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'themeSettings'
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Palette className="w-4 h-4" />
              Theme Settings
            </button>
            <button
              onClick={() => setActiveSection('userManagement')}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeSection === 'userManagement'
                  ? 'border-green-600 text-green-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              User Management
            </button>
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
                {/* Global Font Controls */}
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1">
                  <label className="text-xs text-gray-500">Font:</label>
                  <select
                    value={globalFontFamily}
                    onChange={(e) => setGlobalFontFamily(e.target.value)}
                    className="text-sm border-none outline-none bg-transparent"
                  >
                    <option value="'Courier New', Courier, monospace">Courier New</option>
                    <option value="Arial, sans-serif">Arial</option>
                    <option value="'Times New Roman', serif">Times New Roman</option>
                    <option value="Verdana, sans-serif">Verdana</option>
                    <option value="'Noto Sans Sinhala', sans-serif">Noto Sans Sinhala</option>
                  </select>
                </div>
                <div className="flex items-center gap-1 border border-gray-200 rounded-lg px-2 py-1">
                  <label className="text-xs text-gray-500">Size:</label>
                  <input
                    type="number"
                    value={globalFontSize}
                    onChange={(e) => setGlobalFontSize(parseInt(e.target.value) || 12)}
                    className="w-12 text-sm border-none outline-none bg-transparent"
                    min="8"
                    max="32"
                  />
                  <button
                    onClick={applyGlobalFontSize}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Apply All
                  </button>
                </div>
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
              <div className="flex-1" ref={containerRef} tabIndex={0}>
                {templateImage ? (
                  <div
                    ref={templateRef}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    onClick={(e) => {
                      // Only deselect if clicking directly on the template background
                      if (e.target === templateRef.current) {
                        setSelectedField(null);
                      }
                    }}
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
                      // Transform based on alignment: left=none, center=-50%, right=-100%
                      const getTransform = () => {
                        switch (field.align) {
                          case 'right': return 'translateX(-100%)';
                          case 'center': return 'translateX(-50%)';
                          default: return 'none'; // left
                        }
                      };
                      return (
                        <div
                          key={field.id}
                          tabIndex={0}
                          onMouseDown={(e) => handleFieldMouseDown(e, field)}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedField(field.id);
                          }}
                          onFocus={() => setSelectedField(field.id)}
                          className={`absolute cursor-grab select-none outline-none ${
                            selectedField === field.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                          }`}
                          style={{
                            left: `${field.x}%`,
                            top: `${field.y}%`,
                            fontSize: `${field.fontSize}px`,
                            fontWeight: field.fontWeight,
                            textAlign: field.align,
                            fontFamily: globalFontFamily,
                            transform: getTransform(),
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
              <br /><strong>Keyboard shortcuts:</strong> Arrow keys to move selected field (Shift+Arrow for larger steps), Delete to remove.
            </div>
          </div>
        )}

        {/* Fertilizer Types Section */}
        {activeSection === 'fertilizerTypes' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">Configure fertilizer types and their available bag sizes.</p>
              <button
                onClick={() => { setShowTypeForm(true); setEditingType(null); setTypeForm({ name: '', bagSizes: '', unit: 'kg', active: true }); }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" /> Add Fertilizer Type
              </button>
            </div>

            {/* Type Form Modal */}
            {showTypeForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-96">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{editingType ? 'Edit' : 'Add'} Fertilizer Type</h3>
                    <button onClick={() => setShowTypeForm(false)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                      <input
                        type="text"
                        value={typeForm.name}
                        onChange={(e) => setTypeForm({ ...typeForm, name: e.target.value })}
                        placeholder="e.g., Urea, TSP, MOP"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bag Sizes (comma separated)</label>
                      <input
                        type="text"
                        value={typeForm.bagSizes}
                        onChange={(e) => setTypeForm({ ...typeForm, bagSizes: e.target.value })}
                        placeholder="e.g., 25, 50"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                      />
                      <p className="text-xs text-gray-500 mt-1">Enter bag sizes in kg, separated by commas</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="typeActive"
                        checked={typeForm.active}
                        onChange={(e) => setTypeForm({ ...typeForm, active: e.target.checked })}
                        className="rounded border-gray-300 text-green-600"
                      />
                      <label htmlFor="typeActive" className="text-sm text-gray-700">Active</label>
                    </div>
                    <button onClick={handleSaveType} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Types Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border-b">Name</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border-b">Bag Sizes</th>
                    <th className="px-4 py-3 text-center text-gray-700 font-semibold border-b">Status</th>
                    <th className="px-4 py-3 text-center text-gray-700 font-semibold border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {fertilizerTypes.length > 0 ? fertilizerTypes.map(type => (
                    <tr key={type.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{type.name}</td>
                      <td className="px-4 py-3">
                        {type.bagSizes.split(',').map(s => (
                          <span key={s} className="inline-block bg-gray-100 px-2 py-0.5 rounded mr-1 text-sm">{s.trim()}kg</span>
                        ))}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${type.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {type.active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleEditType(type)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteType(type)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No fertilizer types defined. Add one to get started.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Theme Settings Section */}
        {activeSection === 'themeSettings' && (
          <div className="p-4">
            <p className="text-gray-600 mb-6">Customize the appearance of your application.</p>

            {/* Login Background */}
            <div className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-gray-600" />
                <h3 className="text-lg font-semibold text-gray-800">Login Page Background</h3>
              </div>

              <div className="flex gap-6">
                {/* Preview */}
                <div className="w-64 h-40 border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  {loginBackground ? (
                    <img
                      src={loginBackground}
                      alt="Login background preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center text-gray-400">
                      <ImageIcon className="w-8 h-8 mx-auto mb-1" />
                      <span className="text-sm">No image</span>
                    </div>
                  )}
                </div>

                {/* Controls */}
                <div className="flex-1">
                  <p className="text-sm text-gray-500 mb-3">
                    Upload an image to use as the login page background. Recommended size: 1920x1080 or larger.
                  </p>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={themeFileInputRef}
                      onChange={handleLoginBgUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      onClick={() => themeFileInputRef.current?.click()}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Image
                    </button>
                    {loginBackground && (
                      <button
                        onClick={clearLoginBackground}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 text-sm font-medium"
                      >
                        <Trash2 className="w-4 h-4" />
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Max file size: 5MB. Supported formats: JPG, PNG, WebP</p>
                </div>
              </div>
            </div>

            {/* Dealer Info Section */}
            <div className="border border-gray-200 rounded-lg p-4 mt-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Login Page Footer Info</h3>
              <p className="text-sm text-gray-500 mb-4">
                This information will be displayed in the footer of the login page.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dealer Name</label>
                  <input
                    type="text"
                    value={dealerName}
                    onChange={(e) => setDealerName(e.target.value)}
                    placeholder="e.g., ABC Tea Traders"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Registration Number</label>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g., REG-2024-001"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                  <input
                    type="text"
                    value={dealerAddress}
                    onChange={(e) => setDealerAddress(e.target.value)}
                    placeholder="e.g., No 10, Main Street, Colombo"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-1 focus:ring-green-500 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Save Button */}
            <div className="mt-6 pt-4 border-t border-gray-200">
              <button
                onClick={saveThemeSettings}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
              >
                <Save className="w-4 h-4" />
                Save Theme Settings
              </button>
            </div>
          </div>
        )}

        {/* User Management Section */}
        {activeSection === 'userManagement' && (
          <div className="p-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-gray-600">Manage user accounts and roles.</p>
              <button
                onClick={() => { setShowUserForm(true); setEditingUser(null); setUserForm({ username: '', password: '', email: '', role: 'DEALER' }); }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
              >
                <Plus className="w-4 h-4" /> Add User
              </button>
            </div>

            {/* User Form Modal */}
            {showUserForm && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-96">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">{editingUser ? 'Edit' : 'Add'} User</h3>
                    <button onClick={() => setShowUserForm(false)} className="text-gray-500 hover:text-gray-700">
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                      <input
                        type="text"
                        value={userForm.username}
                        onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                        placeholder="Enter username"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password {editingUser ? '(leave blank to keep current)' : '*'}
                      </label>
                      <input
                        type="password"
                        value={userForm.password}
                        onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                        placeholder={editingUser ? 'Enter new password' : 'Enter password'}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                      <input
                        type="email"
                        value={userForm.email}
                        onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                        placeholder="Enter email"
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                      <select
                        value={userForm.role}
                        onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:ring-1 focus:ring-green-500 outline-none"
                      >
                        <option value={ROLES.DEALER}>Tea Dealer</option>
                        <option value={ROLES.SUPER_ADMIN}>Super Admin</option>
                      </select>
                    </div>
                    <button onClick={handleSaveUser} className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
                      <Save className="w-4 h-4" /> Save
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Users Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border-b">Username</th>
                    <th className="px-4 py-3 text-left text-gray-700 font-semibold border-b">Email</th>
                    <th className="px-4 py-3 text-center text-gray-700 font-semibold border-b">Role</th>
                    <th className="px-4 py-3 text-center text-gray-700 font-semibold border-b">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length > 0 ? users.map(user => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{user.username}</td>
                      <td className="px-4 py-3 text-gray-600">{user.email || '-'}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'SUPER_ADMIN'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {user.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Tea Dealer'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => handleEditUser(user)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded mr-1">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteUser(user)} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-4 py-8 text-center text-gray-500">No users found. Add one to get started.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Confirm Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        onConfirm={() => { if (confirmDialog.onConfirm) confirmDialog.onConfirm(); setConfirmDialog({ isOpen: false }); }}
        onClose={() => setConfirmDialog({ isOpen: false })}
      />
    </div>
  );
};

export default ConfigurationsPage;
