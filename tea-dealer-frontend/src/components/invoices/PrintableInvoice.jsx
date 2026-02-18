import React, { useRef, useEffect, useState } from 'react';
import { X, Printer } from 'lucide-react';

const STORAGE_KEY = 'invoice_template_config';

const PrintableInvoice = ({ isOpen, onClose, invoice, collections = [] }) => {
  const printRef = useRef(null);
  const [config, setConfig] = useState(null);

  // Load template configuration
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Set defaults for global font settings
        if (!parsed.globalFontFamily) {
          parsed.globalFontFamily = "'Courier New', Courier, monospace";
        }
        setConfig(parsed);
      } catch (e) {
        console.error('Error loading template config:', e);
      }
    }
  }, []);

  // Build collections by date map
  const collectionsByDate = {};
  if (invoice && collections.length > 0) {
    collections.forEach(col => {
      collectionsByDate[col.collectionDate] = col;
    });
  }

  // Get kg for a specific day
  const getKgForDay = (day) => {
    if (!invoice) return '-';
    const year = invoice.year;
    const month = invoice.month;
    const lastDay = new Date(year, month, 0).getDate();
    if (day > lastDay) return '';

    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const col = collectionsByDate[dateStr];
    if (!col) return '-';
    const total = (col.grade1 || 0) + (col.grade2 || 0);
    return total > 0 ? total.toFixed(0) : '-';
  };

  // Map invoice data to field values
  const getFieldValue = (fieldId) => {
    if (!invoice) return '';

    // Check if it's a day field (day01 - day31)
    if (fieldId.startsWith('day')) {
      const dayNum = parseInt(fieldId.replace('day', ''), 10);
      if (dayNum >= 1 && dayNum <= 31) {
        return getKgForDay(dayNum);
      }
    }

    const fieldMap = {
      bookNumber: invoice.bookNumber || '',
      customerName: invoice.customerName || '',
      customerNameSinhala: invoice.customerNameSinhala || '',
      month: invoice.month ? getMonthName(invoice.month) : '',
      year: invoice.year?.toString() || '',
      grade1Kg: formatNumber(invoice.grade1Kg),
      grade2Kg: formatNumber(invoice.grade2Kg),
      totalKg: formatNumber(invoice.totalKg),
      supplyDeductionKg: formatKg(invoice.supplyDeductionKg),
      supplyDeductionPercent: invoice.supplyDeductionPercentage ? parseFloat(invoice.supplyDeductionPercentage).toFixed(1) : '',
      payableKg: formatKg(invoice.payableKg),
      grade1Rate: formatNumber(invoice.grade1Rate),
      grade2Rate: formatNumber(invoice.grade2Rate),
      grade1Amount: formatNumber(invoice.grade1Amount),
      grade2Amount: formatNumber(invoice.grade2Amount),
      totalAmount: formatNumber(invoice.totalAmount),
      totalDeductions: formatNumber(invoice.totalDeductions),
      netAmount: formatNumber(invoice.netAmount),
      advance: formatNumber(invoice.advanceAmount),
      loan: formatNumber(invoice.loanAmount),
      fertilizer1: formatNumber(invoice.fertilizer1Amount),
      fertilizer2: formatNumber(invoice.fertilizer2Amount),
      teaPackets: formatNumber(invoice.teaPacketsTotal),
      transport: formatNumber(invoice.transportDeduction),
      stampFee: formatNumber(invoice.stampFee),
      otherDeductions: formatNumber(invoice.otherDeductions),
      arrears: formatNumber(invoice.lastMonthArrears),
      agrochemicals: formatNumber(invoice.agrochemicalsAmount),
    };

    return fieldMap[fieldId] || '';
  };

  const formatNumber = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Format kg values - always show as integers (no decimals)
  const formatKg = (value) => {
    if (value === null || value === undefined || value === '') return '';
    const num = parseFloat(value);
    if (isNaN(num)) return '';
    return Math.round(num).toString();
  };

  const getMonthName = (monthNum) => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June',
                    'July', 'August', 'September', 'October', 'November', 'December'];
    return months[monthNum - 1] || '';
  };

  const handlePrint = () => {
    const printContent = printRef.current;
    if (!printContent) return;

    const fontFamily = config?.globalFontFamily || "'Courier New', Courier, monospace";
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice - ${invoice?.bookNumber || ''}</title>
          <style>
            @page {
              size: A4;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              font-family: ${fontFamily};
            }
            .print-container {
              position: relative;
              width: 210mm;
              height: 297mm;
              overflow: hidden;
            }
            .template-bg {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              object-fit: contain;
              opacity: 0;
            }
            .field {
              position: absolute;
              white-space: nowrap;
            }
            @media print {
              .template-bg {
                opacity: 0 !important;
              }
            }
          </style>
        </head>
        <body>
          ${printContent.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  if (!isOpen) return null;

  if (!config || !config.fields || config.fields.length === 0) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">Print Invoice</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">No template configured yet.</p>
            <p className="text-sm text-gray-500">Please set up your invoice template in the Template Editor first.</p>
          </div>
          <button
            onClick={onClose}
            className="w-full py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Print Preview</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              <Printer className="w-4 h-4" />
              Print
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 rounded-lg">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Preview Content */}
        <div className="flex-1 overflow-auto p-4 bg-gray-100">
          <div
            ref={printRef}
            className="print-container relative mx-auto bg-white shadow-lg"
            style={{
              width: Math.min(config.templateSize?.width || 800, 700),
              height: config.templateSize
                ? (Math.min(config.templateSize.width, 700) / config.templateSize.width) * config.templateSize.height
                : 900,
              backgroundImage: config.templateImage ? `url(${config.templateImage})` : 'none',
              backgroundSize: 'contain',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'center'
            }}
          >
            {/* Render fields at their positions */}
            {config.fields.map(field => {
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
                  className="field absolute"
                  style={{
                    left: `${field.x}%`,
                    top: `${field.y}%`,
                    fontSize: `${field.fontSize || 12}px`,
                    fontWeight: field.fontWeight || 'normal',
                    textAlign: field.align || 'left',
                    fontFamily: config.globalFontFamily || "'Courier New', Courier, monospace",
                    transform: getTransform()
                  }}
                >
                  {getFieldValue(field.id)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Info */}
        <div className="px-4 py-2 border-t border-gray-200 bg-gray-50 text-xs text-gray-500">
          Note: The template background is shown here for reference but will not print. Only the values will be printed on your pre-printed form.
        </div>
      </div>
    </div>
  );
};

export default PrintableInvoice;
