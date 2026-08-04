import React, { useState, useEffect } from 'react';
import { useHackathon } from '../context/HackathonContext';
import { useToast } from '../context/ToastContext';
import api from '../services/api';
import { Utensils, QrCode, CheckCircle2, Clock, Award, AlertCircle } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function MyFoodPasses() {
  const { activeHackathon } = useHackathon();
  const { showToast } = useToast();

  const [myTokens, setMyTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedToken, setSelectedToken] = useState(null);

  useEffect(() => {
    if (activeHackathon?.id) {
      fetchMyPasses();
    }
  }, [activeHackathon?.id]);

  const fetchMyPasses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/user-food-tokens/my_passes/', {
        params: { hackathon_id: activeHackathon.id }
      });
      const data = response.data.results || response.data;
      setMyTokens(data);
      if (data.length > 0) setSelectedToken(data[0]);
    } catch (err) {
      console.error(err);
      showToast('Failed to load food passes.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!activeHackathon) {
    return (
      <div className="max-w-md mx-auto py-12 text-center text-gray-500 text-xs font-semibold">
        Please select a hackathon to view your meal passes.
      </div>
    );
  }

  if (loading) {
    return <div className="max-w-4xl mx-auto h-60 bg-white border animate-pulse rounded-3xl"></div>;
  }

  return (
    <div className="max-w-4xl mx-auto py-6 px-3 sm:px-4 space-y-6">
      {/* Banner */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-lg space-y-2">
        <div className="flex items-center space-x-2">
          <Utensils size={24} className="text-emerald-200" />
          <h1 className="text-2xl font-bold font-display">My Food Passes & Meal QR Codes</h1>
        </div>
        <p className="text-xs text-emerald-100 font-medium">
          Show these QR passes at the food counter for verification and meal collection.
        </p>
      </div>

      {myTokens.length === 0 ? (
        <div className="bg-white border border-gray-100 rounded-3xl p-10 text-center space-y-3">
          <Utensils size={36} className="mx-auto text-gray-300" />
          <h3 className="text-sm font-bold text-gray-700">No Food Passes Assigned Yet</h3>
          <p className="text-xs text-gray-500 max-w-sm mx-auto">
            Organizers have not configured food coupons for this hackathon yet. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* List of Meal Cards */}
          <div className="space-y-3 md:col-span-1">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Available Meal Passes ({myTokens.length})</h3>
            
            {myTokens.map((token) => {
              const coupon = token.food_coupon_details || {};
              const isSelected = selectedToken?.id === token.id;
              const remaining = token.total_coupons - token.used_coupons;

              return (
                <div
                  key={token.id}
                  onClick={() => setSelectedToken(token)}
                  className={`p-4 rounded-2xl border cursor-pointer transition space-y-2 ${
                    isSelected ? 'bg-emerald-50/70 border-emerald-500 shadow-sm' : 'bg-white border-gray-100 hover:border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {coupon.meal_type || 'Meal'}
                    </span>
                    {token.is_extra && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800 flex items-center space-x-1">
                        <Award size={10} />
                        <span>Extra Coupon</span>
                      </span>
                    )}
                  </div>

                  <h4 className="text-sm font-bold text-gray-800">{coupon.name}</h4>
                  
                  <div className="flex justify-between items-center text-xs font-semibold pt-1 border-t border-gray-100/80">
                    <span className="text-[10px] text-gray-400">Balance:</span>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${
                      remaining > 0 ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                    }`}>
                      {remaining > 0 ? `${remaining} Available` : 'Redeemed'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected QR Display View */}
          <div className="md:col-span-2 bg-white border border-gray-100 rounded-3xl p-6 shadow-xs flex flex-col items-center justify-center text-center space-y-5">
            {selectedToken ? (
              <>
                <div className="space-y-1">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {selectedToken.food_coupon_details?.meal_type}
                  </span>
                  <h3 className="text-xl font-bold text-gray-900 mt-2">{selectedToken.food_coupon_details?.name}</h3>
                  <p className="text-xs text-gray-500 max-w-md">{selectedToken.food_coupon_details?.description || 'Present this QR pass at the food counter.'}</p>
                </div>

                {/* QR Box */}
                <div className="p-4 bg-white border-2 border-emerald-500/30 rounded-3xl shadow-sm inline-block space-y-2">
                  <QRCodeSVG
                    value={selectedToken.token_code}
                    size={200}
                    level="H"
                    includeMargin={true}
                  />
                  <div className="text-[10px] font-mono text-gray-400 font-bold tracking-wider">
                    {selectedToken.token_code.slice(0, 18)}...
                  </div>
                </div>

                {/* Status Badges */}
                <div className="space-y-2 w-full max-w-sm">
                  <div className="flex justify-between items-center bg-gray-50 p-3 rounded-2xl border text-xs font-semibold">
                    <span className="text-gray-500">Total Issued Coupons:</span>
                    <span className="font-bold text-gray-800">{selectedToken.total_coupons}</span>
                  </div>
                  <div className="flex justify-between items-center bg-emerald-50 p-3 rounded-2xl border border-emerald-100 text-xs font-semibold">
                    <span className="text-emerald-700">Remaining Unclaimed:</span>
                    <span className="font-bold text-emerald-800">{selectedToken.total_coupons - selectedToken.used_coupons}</span>
                  </div>
                  {selectedToken.notes && (
                    <p className="text-[10px] text-amber-700 font-semibold bg-amber-50 p-2 rounded-xl border border-amber-100">
                      Note: {selectedToken.notes}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-xs font-semibold">Select a meal pass from the left to view QR code.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
