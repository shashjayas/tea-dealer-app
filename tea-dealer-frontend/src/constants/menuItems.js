import { TrendingUp, Users, Package, DollarSign, MinusCircle, Eye } from 'lucide-react';

export const menuItems = [
  { label: 'Dashboard', icon: TrendingUp, page: 'dashboard' },
  { label: 'Manage Customers', icon: Users, page: 'customers' },
  { label: 'Daily Collection', icon: Package, page: 'collections' },
  { label: 'Manage Rates', icon: DollarSign, page: 'rates' },
  { label: 'Add Deductions', icon: MinusCircle, page: 'deductions' },
  { label: 'View Reports', icon: Eye, page: 'reports' },
];