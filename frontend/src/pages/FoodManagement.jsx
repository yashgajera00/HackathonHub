import React, { useState, useEffect, useRef } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Utensils, Plus, QrCode, Award, CheckCircle2, AlertCircle, RefreshCw, Search, Users, Shield, Clock, Camera, Trash2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

export default function FoodManagement() {
  const { activeHackathon, activeHackathonRole } = useHackathon();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('coupons'); // 'coupons' | 'extra' | 'scanner' | 'logs'
  const [coupons, setCoupons] = useState([]);
  const [allTokens, setAllTokens] = useState([]);
  const [registeredUsers, setRegisteredUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Coupon Form
  const [couponForm, setCouponForm] = useState({
    name: '',
    meal_type: 'Lunch',
    description: '',
    meal_date: new Date().toISOString().split('T')[0],
    default_coupons_per_person: 1,
    target_roles: 'All'
  });
  const [creatingCoupon, setCreatingCoupon] = useState(false);

  // Extra Coupon Form
  const [extraForm, setExtraForm] = useState({
    user_id: '',
    food_coupon_id: '',
    extra_coupons: 1,
    notes: 'Bonus meal coupon awarded by Organizer'
  });
  const [issuingExtra, setIssuingExtra] = useState(false);
  const [userSearch, setUserSearch] = useState('');

  // Scanner state
  const [scanCode, setScanCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const scannerRef = useRef(null);

  const isOrganizer = activeHackathonRole === 'Organizer' || activeHackathonRole === 'Superuser';

  useEffect(() => {
    if (activeHackathon?.id) {
      fetchFoodData();
      fetchUsers();
    }
  }, [activeHackathon?.id]);

  const fetchFoodData = async () => {
    setLoading(true);
    try {
      const [couponsRes, tokensRes] = await Promise.all([
        api.get('/food-coupons/', { params: { hackathon_id: activeHackathon.id } }),
        api.get('/user-food-tokens/', { params: { hackathon_id: activeHackathon.id } })
      ]);
      setCoupons(couponsRes.data.results || couponsRes.data);
      setAllTokens(tokensRes.data.results || tokensRes.data);
    } catch (err) {
      console.error(err);
      showToast('Failed to load food coupon data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/registrations/', { params: { hackathon_id: activeHackathon.id } });
      const regs = response.data.results || response.data;
      setRegisteredUsers(regs);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!couponForm.name) return;
    setCreatingCoupon(true);
    try {
      await api.post('/food-coupons/', {
        ...couponForm,
        hackathon: activeHackathon.id
      });
      showToast(`Food Coupon '${couponForm.name}' created and issued to users!`, 'success');
      setCouponForm({
        name: '',
        meal_type: 'Lunch',
        description: '',
        meal_date: new Date().toISOString().split('T')[0],
        default_coupons_per_person: 1,
        target_roles: 'All'
      });
      fetchFoodData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to create food coupon.', 'error');
    } finally {
      setCreatingCoupon(false);
    }
  };

  const handleDeleteCoupon = async (couponId, name) => {
    if (!window.confirm(`Delete food coupon '${name}'? This removes associated user tokens.`)) return;
    try {
      await api.delete(`/food-coupons/${couponId}/`);
      showToast(`Deleted '${name}'.`, 'success');
      fetchFoodData();
    } catch (err) {
      console.error(err);
      showToast('Failed to delete coupon.', 'error');
    }
  };

  const handleIssueExtra = async (e) => {
    e.preventDefault();
    if (!extraForm.user_id || !extraForm.food_coupon_id) {
      showToast('Please select a user and a meal coupon.', 'error');
      return;
    }
    setIssuingExtra(true);
    try {
      await api.post('/food-coupons/issue_extra/', {
        ...extraForm,
        hackathon: activeHackathon.id
      });
      showToast('Successfully awarded extra food coupon!', 'success');
      setExtraForm({
        user_id: '',
        food_coupon_id: '',
        extra_coupons: 1,
        notes: 'Bonus meal coupon awarded by Organizer'
      });
      fetchFoodData();
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.detail || 'Failed to award extra coupon.', 'error');
    } finally {
      setIssuingExtra(false);
    }
  };

  const handleRedeemCode = async (codeToUse) => {
    const targetCode = codeToUse || scanCode;
    if (!targetCode) return;
    setScanning(true);
    setScanResult(null);
    try {
      const response = await api.post('/user-food-tokens/scan_redeem/', {
        token_code: targetCode,
        hackathon_id: activeHackathon.id
      });
      setScanResult({
        success: true,
        message: response.data.detail,
        user_name: response.data.user_name,
        meal_name: response.data.meal_name,
        remaining: response.data.remaining
      });
      showToast(response.data.detail, 'success');
      setScanCode('');
      fetchFoodData();
    } catch (err) {
      console.error(err);
      setScanResult({
        success: false,
        message: err.response?.data?.detail || 'Invalid or already redeemed food coupon.',
        user_name: err.response?.data?.user_name,
        meal_name: err.response?.data?.meal_name
      });
      showToast(err.response?.data?.detail || 'Failed to redeem food coupon.', 'error');
    } finally {
      setScanning(false);
    }
  };

  // Camera QR Scanner Toggle
  const startCameraScanner = async () => {
    setIsCameraActive(true);
    setTimeout(() => {
      if (!scannerRef.current) {
        const html5QrcodeScanner = new Html5Qrcode('reader');
        scannerRef.current = html5QrcodeScanner;
        html5QrcodeScanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            stopCameraScanner();
            handleRedeemCode(decodedText);
          },
          () => {}
        ).catch(err => {
          console.error(err);
          showToast('Could not access camera.', 'error');
          setIsCameraActive(false);
        });
      }
    }, 300);
  };

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsCameraActive(false);
      }).catch(err => console.error(err));
    } else {
      setIsCameraActive(false);
    }
  };

  const filteredUsers = registeredUsers.filter(r => {
    const name = `${r.user_details?.first_name || ''} ${r.user_details?.last_name || ''}`.toLowerCase();
    const username = (r.user_details?.username || '').toLowerCase();
    const query = userSearch.toLowerCase();
    return name.includes(query) || username.includes(query);
  });

  if (!activeHackathon) {
    return (
      <div className="max-w-md mx-auto py-12 text-center text-gray-500 text-xs font-semibold">
        Please select an active hackathon to manage food coupons.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-6 px-3 sm:px-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Utensils size={24} className="text-emerald-200" />
            <h1 className="text-2xl font-bold font-display">Food Tokens & Meal Management</h1>
          </div>
          <p className="text-xs text-emerald-100 font-medium">
            Configure hackathon meal coupons, issue extra tokens to participants, and scan food QR passes.
          </p>
        </div>

        <div className="flex items-center space-x-2 bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-xs font-bold shrink-0">
          <Award size={16} className="text-amber-300" />
          <span>Total Meals Configured: {coupons.length}</span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('coupons')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'coupons' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Utensils size={14} />
          <span>Meal Setup ({coupons.length})</span>
        </button>

        {isOrganizer && (
          <button
            onClick={() => setActiveTab('extra')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
              activeTab === 'extra' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border text-gray-600 hover:bg-gray-50'
            }`}
          >
            <Award size={14} />
            <span>Award Extra Coupons</span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'scanner' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          <QrCode size={14} />
          <span>Food QR Scanner</span>
        </button>

        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-2 ${
            activeTab === 'logs' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-white border text-gray-600 hover:bg-gray-50'
          }`}
        >
          <Clock size={14} />
          <span>Redemption Log</span>
        </button>
      </div>

      {/* TAB 1: Meal Setup */}
      {activeTab === 'coupons' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Create Coupon Form */}
          {isOrganizer && (
            <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900 flex items-center space-x-2">
                <Plus size={16} className="text-emerald-600" />
                <span>Create New Meal Coupon</span>
              </h3>

              <form onSubmit={handleCreateCoupon} className="space-y-3 text-xs font-semibold text-gray-600">
                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider text-gray-400">Meal Name</label>
                  <input
                    type="text"
                    required
                    value={couponForm.name}
                    onChange={(e) => setCouponForm({ ...couponForm, name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white text-gray-800 text-xs"
                    placeholder="Ex: Day 1 - Grand Lunch"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block mb-1 text-[10px] uppercase tracking-wider text-gray-400">Meal Category</label>
                    <select
                      value={couponForm.meal_type}
                      onChange={(e) => setCouponForm({ ...couponForm, meal_type: e.target.value })}
                      className="w-full px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white text-gray-800 text-xs"
                    >
                      <option value="Lunch">Lunch</option>
                      <option value="Dinner">Dinner</option>
                      <option value="Breakfast">Breakfast</option>
                      <option value="Snack">Snack</option>
                      <option value="Special">Special VIP</option>
                    </select>
                  </div>

                  <div>
                    <label className="block mb-1 text-[10px] uppercase tracking-wider text-gray-400">Coupons / Person</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={couponForm.default_coupons_per_person}
                      onChange={(e) => setCouponForm({ ...couponForm, default_coupons_per_person: parseInt(e.target.value) || 1 })}
                      className="w-full px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white text-gray-800 text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider text-gray-400">Target Role</label>
                  <select
                    value={couponForm.target_roles}
                    onChange={(e) => setCouponForm({ ...couponForm, target_roles: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white text-gray-800 text-xs"
                  >
                    <option value="All">All Participants & Staff</option>
                    <option value="Participant">Participants Only</option>
                    <option value="Volunteer">Volunteers Only</option>
                    <option value="Judge">Judges Only</option>
                    <option value="Organizer">Organizers Only</option>
                  </select>
                </div>

                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider text-gray-400">Date</label>
                  <input
                    type="date"
                    value={couponForm.meal_date}
                    onChange={(e) => setCouponForm({ ...couponForm, meal_date: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white text-gray-800 text-xs"
                  />
                </div>

                <div>
                  <label className="block mb-1 text-[10px] uppercase tracking-wider text-gray-400">Menu / Details</label>
                  <textarea
                    rows={2}
                    value={couponForm.description}
                    onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl bg-gray-50 focus:bg-white text-gray-800 text-xs"
                    placeholder="Ex: Paneer Butter Masala, Roti, Rice, Soft Drink"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingCoupon}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5"
                >
                  {creatingCoupon && <RefreshCw size={14} className="animate-spin" />}
                  <span>Issue Meal Coupons</span>
                </button>
              </form>
            </div>
          )}

          {/* Configured Coupons List */}
          <div className={`${isOrganizer ? 'lg:col-span-2' : 'lg:col-span-3'} space-y-4`}>
            <h3 className="text-sm font-bold text-gray-900">Configured Meal Coupons</h3>
            
            {coupons.length === 0 ? (
              <div className="bg-white border border-gray-100 rounded-2xl p-8 text-center text-gray-400 text-xs font-semibold">
                No food coupons configured yet for this hackathon.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {coupons.map((c) => (
                  <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-5 shadow-2xs space-y-3 relative hover:shadow-xs transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                          {c.meal_type}
                        </span>
                        <h4 className="text-base font-bold text-gray-800 mt-1">{c.name}</h4>
                        <p className="text-[11px] text-gray-500">{c.description || 'No description provided.'}</p>
                      </div>
                      {isOrganizer && (
                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.name)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="Delete Coupon"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>

                    <div className="border-t border-gray-100 pt-3 grid grid-cols-2 gap-2 text-xs font-semibold">
                      <div className="bg-gray-50 p-2 rounded-xl">
                        <span className="text-[9px] text-gray-400 uppercase tracking-wider block">Issued</span>
                        <span className="text-gray-800 font-bold">{c.total_issued || 0} Coupons</span>
                      </div>
                      <div className="bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/50">
                        <span className="text-[9px] text-emerald-600 uppercase tracking-wider block">Redeemed</span>
                        <span className="text-emerald-800 font-bold">{c.total_redeemed || 0} Claimed</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: Award Extra Coupons */}
      {activeTab === 'extra' && isOrganizer && (
        <div className="max-w-2xl mx-auto bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
              <Award size={20} className="text-amber-500" />
              <span>Award Extra Special Meal Coupon</span>
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Select a participant or volunteer to give them additional food coupons.
            </p>
          </div>

          <form onSubmit={handleIssueExtra} className="space-y-4 text-xs font-semibold text-gray-600">
            <div>
              <label className="block mb-1 uppercase tracking-wider text-gray-400 text-[10px]">Select User</label>
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-xs mb-2"
                placeholder="Search user by name or username..."
              />
              <select
                required
                value={extraForm.user_id}
                onChange={(e) => setExtraForm({ ...extraForm, user_id: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-xl bg-white text-gray-800 text-xs font-semibold"
              >
                <option value="">-- Choose User ({filteredUsers.length}) --</option>
                {filteredUsers.map((r) => {
                  const name = `${r.user_details?.first_name || ''} ${r.user_details?.last_name || ''}`.trim() || r.user_details?.username;
                  return (
                    <option key={r.user} value={r.user}>
                      {name} (@{r.user_details?.username})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block mb-1 uppercase tracking-wider text-gray-400 text-[10px]">Select Meal Coupon</label>
              <select
                required
                value={extraForm.food_coupon_id}
                onChange={(e) => setExtraForm({ ...extraForm, food_coupon_id: e.target.value })}
                className="w-full px-3 py-2.5 border rounded-xl bg-white text-gray-800 text-xs font-semibold"
              >
                <option value="">-- Choose Meal --</option>
                {coupons.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.meal_type})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-1 uppercase tracking-wider text-gray-400 text-[10px]">Extra Coupons Count</label>
                <input
                  type="number"
                  min="1"
                  required
                  value={extraForm.extra_coupons}
                  onChange={(e) => setExtraForm({ ...extraForm, extra_coupons: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-gray-800 text-xs"
                />
              </div>

              <div>
                <label className="block mb-1 uppercase tracking-wider text-gray-400 text-[10px]">Note / Reason</label>
                <input
                  type="text"
                  value={extraForm.notes}
                  onChange={(e) => setExtraForm({ ...extraForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl bg-gray-50 text-gray-800 text-xs"
                  placeholder="Ex: Special VIP Voucher"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={issuingExtra}
              className="w-full py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow-xs"
            >
              {issuingExtra && <RefreshCw size={14} className="animate-spin" />}
              <span>Grant Extra Coupon</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 3: Food QR Scanner */}
      {activeTab === 'scanner' && (
        <div className="max-w-2xl mx-auto space-y-6">
          <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-6 text-center">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center justify-center space-x-2">
                <QrCode size={22} className="text-emerald-600" />
                <span>Food QR Code Scanner</span>
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Scan participant food QR passes or enter token code manually to verify and redeem meals.
              </p>
            </div>

            {/* Camera View Area */}
            {isCameraActive ? (
              <div className="space-y-4">
                <div id="reader" className="w-full max-w-sm mx-auto overflow-hidden rounded-2xl border-2 border-emerald-500"></div>
                <button
                  onClick={stopCameraScanner}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white font-bold rounded-xl text-xs transition"
                >
                  Stop Camera
                </button>
              </div>
            ) : (
              <button
                onClick={startCameraScanner}
                className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold border border-emerald-200 rounded-2xl text-xs transition flex items-center justify-center space-x-2"
              >
                <Camera size={16} />
                <span>Open Camera Scanner</span>
              </button>
            )}

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase font-bold text-gray-400"><span className="bg-white px-2">or enter code</span></div>
            </div>

            {/* Manual Code Input */}
            <form onSubmit={(e) => { e.preventDefault(); handleRedeemCode(); }} className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={scanCode}
                  onChange={(e) => setScanCode(e.target.value)}
                  className="w-full px-4 py-2.5 border rounded-xl text-xs font-mono bg-gray-50 focus:bg-white text-gray-800"
                  placeholder="Paste or type Token UUID Code..."
                />
                <button
                  type="submit"
                  disabled={scanning}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shrink-0 flex items-center space-x-1"
                >
                  {scanning && <RefreshCw size={14} className="animate-spin" />}
                  <span>Redeem</span>
                </button>
              </div>
            </form>

            {/* Scan Result Feedback Card */}
            {scanResult && (
              <div className={`p-4 rounded-2xl border text-left space-y-2 animate-fade-in ${
                scanResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center space-x-2 font-bold text-sm">
                  {scanResult.success ? <CheckCircle2 size={20} className="text-emerald-600" /> : <AlertCircle size={20} className="text-rose-600" />}
                  <span>{scanResult.success ? 'Meal Verified & Redeemed!' : 'Redemption Failed'}</span>
                </div>
                <p className="text-xs font-medium">{scanResult.message}</p>
                {scanResult.user_name && (
                  <div className="text-[11px] font-bold opacity-80 pt-1 border-t border-current/10">
                    User: {scanResult.user_name} | Meal: {scanResult.meal_name}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: Redemption Log */}
      {activeTab === 'logs' && (
        <div className="bg-white border border-gray-100 rounded-3xl p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Food Pass Redemption Activity</h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-semibold text-gray-600">
              <thead className="bg-gray-50 text-[10px] uppercase text-gray-400 font-bold">
                <tr>
                  <th className="p-3">User</th>
                  <th className="p-3">Meal Item</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Used / Total</th>
                  <th className="p-3">Last Scanned</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {allTokens.map((t) => {
                  const u = t.user_details || {};
                  const name = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.username;
                  return (
                    <tr key={t.id} className="hover:bg-gray-50/50 transition">
                      <td className="p-3 font-bold text-gray-800">{name} (@{u.username})</td>
                      <td className="p-3 font-bold text-emerald-700">{t.food_coupon_details?.name}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          t.used_coupons >= t.total_coupons ? 'bg-gray-100 text-gray-600' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {t.used_coupons >= t.total_coupons ? 'Fully Redeemed' : 'Active Pass'}
                        </span>
                      </td>
                      <td className="p-3">{t.used_coupons} / {t.total_coupons}</td>
                      <td className="p-3 text-[10px] text-gray-400">
                        {t.last_scanned_at ? new Date(t.last_scanned_at).toLocaleString() : 'Not scanned yet'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
