import React, { createContext, useContext } from 'react';
import { useCustomers } from '../hooks/useCustomers';

const CustomerContext = createContext();

export const CustomerProvider = ({ children }) => {
  const customerData = useCustomers();
  return (
    <CustomerContext.Provider value={customerData}>
      {children}
    </CustomerContext.Provider>
  );
};

export const useCustomerContext = () => {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error('useCustomerContext must be used within CustomerProvider');
  }
  return context;
};