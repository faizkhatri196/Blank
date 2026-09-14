import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { Technician } from '../../types';
import { UserCheck, Phone, Wrench, Shield, CheckCircle, Loader2 } from 'lucide-react';

export const TechnicianProfile: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Technician | null>(null);
  const [availability, setAvailability] = useState<string>('AVAILABLE');
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const res = await apiClient.get('/technicians');
        // Find current technician by name or user email
        const myProfile = res.data.data.find(
          (t: Technician) => t.email.toLowerCase() === user?.email.toLowerCase()
        ) || res.data.data[0];

        if (myProfile) {
          setProfile(myProfile);
          setAvailability(myProfile.availability);
        }
      } catch (err) {
        console.error('Failed to load technician profile:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, [user]);

  const handleUpdateAvailability = async (newStatus: string) => {
    setAvailability(newStatus);
    setIsUpdating(true);
    try {
      if (profile) {
        await apiClient.patch(`/technicians/${profile._id}/status`, { availability: newStatus });
      }
    } catch (err: any) {
      alert(`Failed to update availability: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 flex justify-center text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-lg mx-auto">
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
            {profile?.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900">{profile?.name}</h2>
            <p className="text-xs text-slate-500">{profile?.email}</p>
            <div className="text-[11px] text-slate-500">{profile?.phone}</div>
          </div>
        </div>

        {/* Dispatch Availability Selector */}
        <div className="pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            My Dispatch Status
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleUpdateAvailability('AVAILABLE')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                availability === 'AVAILABLE'
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              AVAILABLE
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleUpdateAvailability('BUSY')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                availability === 'BUSY'
                  ? 'bg-amber-600 text-white border-amber-600 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              BUSY
            </button>
            <button
              type="button"
              disabled={isUpdating}
              onClick={() => handleUpdateAvailability('OFFLINE')}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                availability === 'OFFLINE'
                  ? 'bg-slate-800 text-white border-slate-800 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              OFFLINE
            </button>
          </div>
        </div>
      </div>

      {/* Qualifications */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 text-xs">
        <h3 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
          Verified Service Capabilities
        </h3>

        <div className="flex gap-2">
          {profile?.serviceTypes.map((st) => (
            <span
              key={st}
              className={`font-bold px-2.5 py-1 rounded-lg ${
                st === 'SOLAR' ? 'bg-amber-100 text-amber-900' : 'bg-sky-100 text-sky-900'
              }`}
            >
              {st === 'SOLAR' ? 'Solar Photovoltaic' : 'Air Conditioning / HVAC'}
            </span>
          ))}
        </div>

        <div>
          <span className="font-bold text-slate-600 block mb-1">Experience:</span>
          <span className="font-semibold text-slate-900">{profile?.experienceYears} Years in Field Operations</span>
        </div>

        <div>
          <span className="font-bold text-slate-600 block mb-1">Service Territories:</span>
          <span className="font-medium text-slate-700">{profile?.serviceAreas.join(', ')}</span>
        </div>

        <div>
          <span className="font-bold text-slate-600 block mb-1">Skills:</span>
          <div className="flex flex-wrap gap-1">
            {profile?.skills.map((s, i) => (
              <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                {s.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        <div>
          <span className="font-bold text-slate-600 block mb-1">Equipped Tools:</span>
          <div className="flex flex-wrap gap-1">
            {profile?.tools.map((t, i) => (
              <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-medium border border-emerald-200">
                {t.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
