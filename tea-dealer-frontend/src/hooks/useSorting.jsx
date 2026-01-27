import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

export const useSorting = (data, initialKey = 'bookNumber', initialDirection = 'asc') => {
  const [sortConfig, setSortConfig] = useState({ 
    key: initialKey, 
    direction: initialDirection 
  });

  const sortedData = useMemo(() => {
    if (!sortConfig.key) return data;

    const sorted = [...data].sort((a, b) => {
      const aVal = a[sortConfig.key] || '';
      const bVal = b[sortConfig.key] || '';

      // Alphanumeric sorting (natural sort for book numbers like TB1, TB2, TB10, TB89)
      const compareResult = aVal.toString().localeCompare(
        bVal.toString(), 
        undefined, 
        { numeric: true, sensitivity: 'base' }
      );

      return sortConfig.direction === 'asc' ? compareResult : -compareResult;
    });

    return sorted;
  }, [data, sortConfig]);

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="w-4 h-4 opacity-40" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="w-4 h-4" /> 
      : <ArrowDown className="w-4 h-4" />;
  };

  return {
    sortedData,
    sortConfig,
    handleSort,
    SortIcon,
  };
};