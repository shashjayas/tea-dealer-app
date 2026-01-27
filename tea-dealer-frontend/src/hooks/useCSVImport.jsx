import { useState } from 'react';

export const useCSVImport = () => {
  const [importFile, setImportFile] = useState(null);
  const [importPreview, setImportPreview] = useState([]);
  const [importErrors, setImportErrors] = useState([]);

  const downloadTemplate = () => {
    const csv = 'BookNumber,GrowerNameSinhala,GrowerNameEnglish,Address,NIC,LandName,ContactNumber,Route\nTB001,සරත් සිල්වා,Sarath Silva,"Kandy Road, Matale",852456789V,Green Valley,0771234567,Route A\nTB002,නිමල් පෙරේරා,Nimal Perera,"Main Street, Colombo",901234567V,Hill Side,0772345678,Route B';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'customer_template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Proper CSV parser that handles quoted fields with commas
  const parseCSVLine = (line) => {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          // Escaped quote
          current += '"';
          i++;
        } else {
          // Toggle quote mode
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  };

  const processFile = (file) => {
    if (!file || file.type !== 'text/csv') {
      setImportErrors(['Please select a valid CSV file']);
      return;
    }

    setImportFile(file);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n').filter(l => l.trim());
      
      if (lines.length < 2) {
        setImportErrors(['CSV file is empty or contains no data rows']);
        return;
      }

      const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
      const preview = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const vals = parseCSVLine(lines[i]);
        
        const customer = {
          bookNumber: vals[headers.findIndex(h => h.includes('book'))] || '',
          growerNameSinhala: vals[headers.findIndex(h => h.includes('sinhala'))] || '',
          growerNameEnglish: vals[headers.findIndex(h => h.includes('english'))] || '',
          address: vals[headers.findIndex(h => h.includes('address'))] || '',
          nic: vals[headers.findIndex(h => h.includes('nic'))] || '',
          landName: vals[headers.findIndex(h => h.includes('land'))] || '',
          contactNumber: vals[headers.findIndex(h => h.includes('contact') || h.includes('phone'))] || '',
          route: vals[headers.findIndex(h => h.includes('route'))] || ''
        };

        if (!customer.bookNumber || !customer.growerNameEnglish || !customer.route) {
          errors.push(`Row ${i + 1}: Missing required fields (BookNumber, GrowerNameEnglish, or Route)`);
        } else {
          preview.push(customer);
        }
      }

      setImportPreview(preview);
      setImportErrors(errors);
    };

    reader.onerror = () => {
      setImportErrors(['Failed to read CSV file. Please try again.']);
    };

    reader.readAsText(file);
  };

  const resetImport = () => {
    setImportFile(null);
    setImportPreview([]);
    setImportErrors([]);
  };

  return {
    importFile,
    importPreview,
    importErrors,
    downloadTemplate,
    processFile,
    resetImport,
  };
};