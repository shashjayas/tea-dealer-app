import React, { useState, useEffect } from 'react';
import { Leaf, Eye, EyeOff } from 'lucide-react';
import { getLoginBackground, getDealerInfo } from '../services/settingsService';

const CACHE_KEY = 'login_background_cache';
const DEALER_CACHE_KEY = 'dealer_info_cache';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(null);
  const [dealerInfo, setDealerInfo] = useState({ name: '', regNumber: '', address: '' });

  // Load background and dealer info: first from cache (instant), then sync from database
  useEffect(() => {
    // Load from cache first for instant display
    const cachedBg = localStorage.getItem(CACHE_KEY);
    if (cachedBg) {
      setBackgroundImage(cachedBg);
    }

    const cachedDealer = localStorage.getItem(DEALER_CACHE_KEY);
    if (cachedDealer) {
      try {
        setDealerInfo(JSON.parse(cachedDealer));
      } catch (e) {
        console.error('Error parsing cached dealer info:', e);
      }
    }

    // Then fetch from database and update cache
    const syncFromDb = async () => {
      try {
        const [bg, dealer] = await Promise.all([
          getLoginBackground(),
          getDealerInfo()
        ]);

        if (bg) {
          setBackgroundImage(bg);
          localStorage.setItem(CACHE_KEY, bg);
        } else if (cachedBg) {
          localStorage.removeItem(CACHE_KEY);
          setBackgroundImage(null);
        }

        if (dealer) {
          setDealerInfo(dealer);
          localStorage.setItem(DEALER_CACHE_KEY, JSON.stringify(dealer));
        }
      } catch (e) {
        console.error('Error syncing settings:', e);
      }
    };
    syncFromDb();
  }, []);

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    const result = await onLogin(username, password);
    if (!result.success) {
      setError('Invalid username or password');
    }
    setLoading(false);
  };

  const hasFooterInfo = dealerInfo.name || dealerInfo.regNumber || dealerInfo.address;

  return (
    <div
      className="min-h-screen flex flex-col relative"
      style={{
        background: backgroundImage
          ? `url(${backgroundImage}) center/cover no-repeat`
          : 'linear-gradient(to bottom right, rgb(240, 253, 244), rgb(236, 253, 245), rgb(240, 253, 250))'
      }}
    >
      {/* Overlay for better form visibility when using background image */}
      {backgroundImage && (
        <div className="absolute inset-0 bg-black/30" />
      )}

      {/* Main content */}
      <div className="flex-1 flex items-center justify-center p-4 relative z-10">
        <div className="w-full max-w-md">
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
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                  placeholder="Enter username"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
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
            </div>
          </div>
        </div>
      </div>

      {/* Footer bar */}
      {hasFooterInfo && (
        <div className="relative z-10 bg-black/50 backdrop-blur-sm text-white py-3 px-4">
          <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm">
            {dealerInfo.name && (
              <span className="font-medium">{dealerInfo.name}</span>
            )}
            {dealerInfo.regNumber && (
              <span className="text-gray-300">Reg: {dealerInfo.regNumber}</span>
            )}
            {dealerInfo.address && (
              <span className="text-gray-300">{dealerInfo.address}</span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
