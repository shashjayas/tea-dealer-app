import { TrendingUp, Users, Package, DollarSign, MinusCircle, FileText, Eye, Settings, Warehouse } from 'lucide-react';

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DEALER: 'DEALER',
};

export const menuItems = [
  { labelKey: 'navigation.dashboard', icon: TrendingUp, page: 'dashboard' },
  { labelKey: 'navigation.customers', icon: Users, page: 'customers' },
  { labelKey: 'navigation.collections', icon: Package, page: 'collections' },
  { labelKey: 'navigation.rates', icon: DollarSign, page: 'rates' },
  { labelKey: 'navigation.deductions', icon: MinusCircle, page: 'deductions' },
  { labelKey: 'navigation.stock', icon: Warehouse, page: 'stock' },
  { labelKey: 'navigation.invoices', icon: FileText, page: 'invoices' },
  { labelKey: 'navigation.reports', icon: Eye, page: 'reports' },
  { labelKey: 'navigation.configurations', icon: Settings, page: 'configurations', requiredRole: ROLES.SUPER_ADMIN },
];