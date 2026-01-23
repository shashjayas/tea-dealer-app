import React, { useState, useEffect } from 'react';
import { Leaf, Users, DollarSign, TrendingUp, Package, MinusCircle, Eye, Menu, X, Plus, Edit, Trash2, Search, Save, XCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await response.json();
      if (data.success) {
        onLogin(data.user);
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Connection error. Please ensure backend is running on port 8080.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md relative">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-8 text-white text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-4">
              <Leaf className="w-12 h-12" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Tea Dealer Pro</h1>
            <p className="text-green-100">Manage your tea collections efficiently</p>
          </div>
          <div className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Enter username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                placeholder="Enter password"
              />
            </div>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="text-center text-sm text-gray-500">Default credentials: admin / admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomerManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [loading, setLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({ key: 'bookNumber', direction: 'asc' });
  const [formData, setFormData] = useState({
    bookNumber: '', growerNameSinhala: '', growerNameEnglish: '', address: '', nic: '', landName: '', contactNumber: '', route: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, []);

  useEffect(() => {
    let filtered = customers.filter(customer =>
      customer.growerNameEnglish.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.bookNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.route.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.key) {
      filtered.sort((a, b) => {
        let aVal = (a[sortConfig.key] || '').toString().toLowerCase();
        let bVal = (b[sortConfig.key] || '').toString().toLowerCase();
        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    setFilteredCustomers(filtered);
  }, [searchTerm, customers, sortConfig]);

  const handleSort = (key) => {
    setSortConfig({ key, direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc' });
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <ArrowUpDown className="w-4 h-4 opacity-40" />;
    return sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />;
  };

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:8080/api/customers');
      const data = await response.json();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const url = editingCustomer ? `http://localhost:8080/api/customers/${editingCustomer.id}` : 'http://localhost:8080/api/customers';
      const response = await fetch(url, {
        method: editingCustomer ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (response.ok) {
        fetchCustomers();
        resetForm();
        setShowForm(false);
      }
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      bookNumber: customer.bookNumber, growerNameSinhala: customer.growerNameSinhala,
      growerNameEnglish: customer.growerNameEnglish, address: customer.address,
      nic: customer.nic, landName: customer.landName, contactNumber: customer.contactNumber, route: customer.route
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await fetch(`http://localhost:8080/api/customers/${id}`, { method: 'DELETE' });
        fetchCustomers();
      } catch (error) {
        console.error('Error deleting customer:', error);
      }
    }
  };

  const resetForm = () => {
    setFormData({ bookNumber: '', growerNameSinhala: '', growerNameEnglish: '', address: '', nic: '', landName: '', contactNumber: '', route: '' });
    setEditingCustomer(null);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Customer Management</h2>
        <button onClick={() => { resetForm(); setShowForm(true); }} className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:from-green-700 hover:to-emerald-700">
          <Plus className="w-5 h-5" />Add Customer
        </button>
      </div>

      <div className="mb-6 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search by name, book number, or route..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
        />
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-6 text-white flex justify-between items-center sticky top-0">
              <h3 className="text-xl font-bold">{editingCustomer ? 'Edit Customer' : 'Add New Customer'}</h3>
              <button onClick={() => { setShowForm(false); resetForm(); }} className="hover:bg-white/20 p-2 rounded-lg">
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Book Number *</label>
                  <input type="text" value={formData.bookNumber} onChange={(e) => setFormData({ ...formData, bookNumber: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="TB001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Route *</label>
                  <input type="text" value={formData.route} onChange={(e) => setFormData({ ...formData, route: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" placeholder="Route A" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grower Name (Sinhala) *</label>
                <input type="text" value={formData.growerNameSinhala} onChange={(e) => setFormData({ ...formData, growerNameSinhala: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grower Name (English) *</label>
                <input type="text" value={formData.growerNameEnglish} onChange={(e) => setFormData({ ...formData, growerNameEnglish: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                <textarea value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" rows="3" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">NIC Number</label>
                  <input type="text" value={formData.nic} onChange={(e) => setFormData({ ...formData, nic: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
                  <input type="text" value={formData.contactNumber} onChange={(e) => setFormData({ ...formData, contactNumber: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Land Name</label>
                <input type="text" value={formData.landName} onChange={(e) => setFormData({ ...formData, landName: e.target.value })} className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleSubmit} disabled={loading} className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50">
                  <Save className="w-5 h-5" />{loading ? 'Saving...' : 'Save Customer'}
                </button>
                <button onClick={() => { setShowForm(false); resetForm(); }} className="px-6 py-3 border text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 grid grid-cols-6 gap-4 font-semibold text-sm">
          <div onClick={() => handleSort('bookNumber')} className="cursor-pointer hover:bg-green-700 p-2 rounded flex items-center gap-2">
            Book No. <SortIcon columnKey="bookNumber" />
          </div>
          <div onClick={() => handleSort('growerNameEnglish')} className="cursor-pointer hover:bg-green-700 p-2 rounded flex items-center gap-2">
            Name (English) <SortIcon columnKey="growerNameEnglish" />
          </div>
          <div onClick={() => handleSort('growerNameSinhala')} className="cursor-pointer hover:bg-green-700 p-2 rounded flex items-center gap-2">
            Name (Sinhala) <SortIcon columnKey="growerNameSinhala" />
          </div>
          <div onClick={() => handleSort('contactNumber')} className="cursor-pointer hover:bg-green-700 p-2 rounded flex items-center gap-2">
            Contact <SortIcon columnKey="contactNumber" />
          </div>
          <div onClick={() => handleSort('route')} className="cursor-pointer hover:bg-green-700 p-2 rounded flex items-center gap-2">
            Route <SortIcon columnKey="route" />
          </div>
          <div className="p-2">Actions</div>
        </div>
        <div className="divide-y">
          {filteredCustomers.length === 0 ? (
            <div className="p-8 text-center text-gray-500">No customers found</div>
          ) : (
            filteredCustomers.map((customer) => (
              <div key={customer.id} className="grid grid-cols-6 gap-4 p-4 hover:bg-green-50 items-center text-sm">
                <div className="font-medium text-gray-900">{customer.bookNumber}</div>
                <div className="text-gray-700">{customer.growerNameEnglish}</div>
                <div className="text-gray-700">{customer.growerNameSinhala}</div>
                <div className="text-gray-700">{customer.contactNumber || '-'}</div>
                <div><span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">{customer.route}</span></div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(customer)} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(customer.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">Showing {filteredCustomers.length} of {customers.length} customers</div>
    </div>
  );
};

const DashboardHome = ({ totalCustomers }) => {
  const stats = [
    { label: 'Total Customers', value: totalCustomers, icon: Users, color: 'from-green-500 to-emerald-500' },
    { label: "Today's Collection", value: '245 kg', icon: Package, color: 'from-teal-500 to-cyan-500' },
    { label: 'Monthly Revenue', value: 'Rs. 450,000', icon: DollarSign, color: 'from-emerald-500 to-green-500' },
    { label: 'Average Rate', value: 'Rs. 185/kg', icon: TrendingUp, color: 'from-green-600 to-teal-600' },
  ];

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition-all">
            <div className={`h-2 bg-gradient-to-r ${stat.color}`}></div>
            <div className="p-6">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-r ${stat.color} flex items-center justify-center mb-4`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-gray-600 text-sm font-medium mb-1">{stat.label}</h3>
              <p className="text-3xl font-bold text-gray-800">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-600" />Recent Collections
        </h2>
        <div className="space-y-4">
          {[1, 2, 3].map((item) => (
            <div key={item} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-green-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold">{item}</div>
                <div>
                  <p className="font-semibold text-gray-800">Farmer {item}</p>
                  <p className="text-sm text-gray-500">Collected today at 2:30 PM</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-bold text-green-700">45 kg</p>
                <p className="text-sm text-gray-500">@ Rs. 180/kg</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

const Dashboard = ({ user, onLogout }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [totalCustomers, setTotalCustomers] = useState(0);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const res = await fetch('http://localhost:8080/api/customers');
        const data = await res.json();
        setTotalCustomers(data.length);
      } catch (err) {
        console.error('Error:', err);
      }
    };
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [currentPage]);

  const menuItems = [
    { label: 'Dashboard', icon: TrendingUp, page: 'dashboard' },
    { label: 'Manage Customers', icon: Users, page: 'customers' },
    { label: 'Manage Rates', icon: DollarSign, page: 'rates' },
    { label: 'Add Deductions', icon: MinusCircle, page: 'deductions' },
    { label: 'View Collection', icon: Eye, page: 'collections' },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-300 bg-gradient-to-b from-green-700 to-emerald-800 text-white w-64 z-30`}>
        <div className="p-6 border-b border-green-600">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center"><Leaf className="w-7 h-7" /></div>
            <div>
              <h2 className="text-xl font-bold">Tea Dealer Pro</h2>
              <p className="text-green-200 text-xs">{user.email}</p>
            </div>
          </div>
        </div>
        <nav className="p-4 space-y-2">
          {menuItems.map((item, i) => (
            <button key={i} onClick={() => setCurrentPage(item.page)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all text-left ${currentPage === item.page ? 'bg-white/20' : 'hover:bg-white/10'}`}>
              <item.icon className="w-5 h-5" /><span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-green-600">
          <button onClick={onLogout} className="w-full px-4 py-3 bg-red-500 hover:bg-red-600 rounded-lg font-medium">Logout</button>
        </div>
      </div>

      <div className={`transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : ''}`}>
        <header className="bg-white shadow-sm sticky top-0 z-20">
          <div className="flex items-center justify-between px-6 py-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(!sidebarOpen)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
                {sidebarOpen ? <X /> : <Menu />}
              </button>
              <h1 className="text-2xl font-bold text-gray-800">
                {currentPage === 'dashboard' ? 'Dashboard' : currentPage === 'customers' ? 'Customer Management' : 'Coming Soon'}
              </h1>
            </div>
            <div className="text-sm text-gray-600">
              <span>Welcome back, </span><span className="font-semibold text-green-700">{user.username}</span>
            </div>
          </div>
        </header>

        <main className="p-6">
          {currentPage === 'dashboard' && <DashboardHome totalCustomers={totalCustomers} />}
          {currentPage === 'customers' && <CustomerManagement />}
          {currentPage !== 'dashboard' && currentPage !== 'customers' && (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🚧</div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Coming Soon</h2>
              <p className="text-gray-600">This feature is under development</p>
            </div>
          )}
        </main>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)}></div>}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  return user ? <Dashboard user={user} onLogout={handleLogout} /> : <LoginPage onLogin={handleLogin} />;
}