import { TrendingUp, Users, Package, DollarSign, MinusCircle, FileText, Eye, Settings, Leaf } from 'lucide-react';

// Role constants
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  DEALER: 'DEALER',
};

export const menuItems = [
  { label: 'Dashboard', icon: TrendingUp, page: 'dashboard' },
  { label: 'Manage Customers', icon: Users, page: 'customers' },
  { label: 'Daily Collection', icon: Package, page: 'collections' },
  { label: 'Manage Rates', icon: DollarSign, page: 'rates' },
  { label: 'Add Deductions', icon: MinusCircle, page: 'deductions' },
  { label: 'Fertilizer', icon: Leaf, page: 'fertilizer' },
  { label: 'Invoices', icon: FileText, page: 'invoices' },
  { label: 'View Reports', icon: Eye, page: 'reports' },
  { label: 'Configurations', icon: Settings, page: 'configurations', requiredRole: ROLES.SUPER_ADMIN },
];