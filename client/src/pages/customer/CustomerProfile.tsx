import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { User, Phone, Mail, MapPin, LogOut, ShieldCheck, HelpCircle } from 'lucide-react';
import { getCustomerSavedLocation } from '../../utils/customerLocation';

export const CustomerProfile: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const savedLoc = getCustomerSavedLocation(user?.id);
  const savedCity = savedLoc ? savedLoc.city : null;
  const savedPincode = savedLoc ? savedLoc.pincode : null;

  return (
    <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">Customer Account</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your contact information and default service address.
        </p>
      </div>

      {/* Account Info Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-base">
            <User className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">{user?.name || 'Customer'}</h2>
            <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
              Verified Servora Customer
            </span>
          </div>
        </div>

        <div className="space-y-3 text-xs">
          <div className="flex items-center gap-2.5 text-slate-700">
            <Mail className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{user?.email || 'customer@demo.com'}</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <Phone className="w-4 h-4 text-slate-400 shrink-0" />
            <span>{user?.phone || '+91 98765 99999'}</span>
          </div>

          <div className="flex items-center gap-2.5 text-slate-700">
            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
            <span>
              Default Area:{' '}
              {savedCity
                ? `${savedCity}${savedPincode ? ` (${savedPincode})` : ''}`
                : 'Not set (Select on Home screen)'}
            </span>
          </div>
        </div>
      </div>

      {/* Help & Operations Security Notice */}
      <div className="bg-slate-100 rounded-2xl p-4 border border-slate-200/80 text-xs text-slate-600 space-y-2">
        <div className="flex items-center gap-2 font-bold text-slate-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Customer Privacy & Security Notice</span>
        </div>
        <p className="text-[11px] leading-relaxed font-normal">
          Servora strictly protects customer data. Exact coordinates are shared only with the assigned technician during active dispatches. Internal technician rankings, scores, and personal numbers are never displayed.
        </p>
      </div>

      {/* Sign Out CTA */}
      <div className="pt-2">
        <button
          onClick={logout}
          className="w-full py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out of Servora</span>
        </button>
      </div>
    </div>
  );
};
