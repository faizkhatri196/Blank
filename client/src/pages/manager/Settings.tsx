import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { apiClient } from '../../api/client';
import { ServiceAreaConfig } from '../../types';
import {
  Settings as SettingsIcon,
  Database,
  Cpu,
  ShieldCheck,
  CheckCircle,
  AlertCircle,
  Loader2,
  MapPin,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  Wrench,
  Sun,
  Wind,
  Zap,
  Droplet,
  Tv,
} from 'lucide-react';

const SERVICE_OPTIONS = [
  { type: 'SOLAR', label: 'Solar Energy', icon: Sun, color: 'amber' },
  { type: 'AC', label: 'AC & HVAC', icon: Wind, color: 'sky' },
  { type: 'ELECTRICAL', label: 'Electrical', icon: Zap, color: 'yellow' },
  { type: 'PLUMBING', label: 'Plumbing', icon: Wrench, color: 'blue' },
  { type: 'RO_PURIFIER', label: 'RO Water Purifier', icon: Droplet, color: 'teal' },
  { type: 'APPLIANCE_REPAIR', label: 'Appliance Repair', icon: Tv, color: 'purple' },
];

export const Settings: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'COVERAGE' | 'SYSTEM'>('COVERAGE');

  // Coverage State
  const [coverageAreas, setCoverageAreas] = useState<ServiceAreaConfig[]>([]);
  const [servicesSupported, setServicesSupported] = useState<string[]>([]);
  const [isLoadingCoverage, setIsLoadingCoverage] = useState(true);
  const [coverageError, setCoverageError] = useState<string | null>(null);
  const [coverageSuccess, setCoverageSuccess] = useState<string | null>(null);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [modalCity, setModalCity] = useState('');
  const [modalState, setModalState] = useState('Gujarat');
  const [modalAreasText, setModalAreasText] = useState('');
  const [modalPincodesText, setModalPincodesText] = useState('');
  const [modalRadiusInput, setModalRadiusInput] = useState<string>('20');
  const [modalServices, setModalServices] = useState<string[]>(['SOLAR', 'AC']);
  const [modalError, setModalError] = useState<string | null>(null);
  const [isSavingModal, setIsSavingModal] = useState(false);

  // Delete Confirmation
  const [areaToDeleteIndex, setAreaToDeleteIndex] = useState<number | null>(null);

  // System Health
  const [health, setHealth] = useState<any>(null);
  const [isLoadingHealth, setIsLoadingHealth] = useState(true);

  const loadCompanyData = async () => {
    setIsLoadingCoverage(true);
    setCoverageError(null);
    try {
      const res = await apiClient.get('/company/profile');
      if (res.data.success && res.data.data) {
        setCoverageAreas(res.data.data.serviceAreas || []);
        setServicesSupported(res.data.data.servicesSupported || ['SOLAR', 'AC']);
      }
    } catch (err: any) {
      console.error('Failed to load company profile:', err);
      setCoverageError(err.response?.data?.error?.message || 'Failed to load service coverage settings.');
    } finally {
      setIsLoadingCoverage(false);
    }
  };

  useEffect(() => {
    loadCompanyData();
  }, []);

  useEffect(() => {
    async function loadHealth() {
      try {
        const res = await apiClient.get('/pilot/health');
        setHealth(res.data.data);
      } catch (err) {
        console.error('Failed to load system health:', err);
      } finally {
        setIsLoadingHealth(false);
      }
    }
    if (activeTab === 'SYSTEM') {
      loadHealth();
    }
  }, [activeTab]);

  const openAddModal = () => {
    setEditingIndex(null);
    setModalCity('');
    setModalState('Gujarat');
    setModalAreasText('');
    setModalPincodesText('');
    setModalRadiusInput('20');
    setModalServices(servicesSupported.length > 0 ? [...servicesSupported] : ['SOLAR', 'AC']);
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (idx: number) => {
    const area = coverageAreas[idx];
    if (!area) return;
    setEditingIndex(idx);
    setModalCity(area.city);
    setModalState(area.state || 'Gujarat');
    setModalAreasText((area.areas || []).join(', '));
    setModalPincodesText((area.pincodes || []).join(', '));
    setModalRadiusInput(String(area.radius ?? 20));
    setModalServices(area.services.length > 0 ? [...area.services] : ['SOLAR']);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!modalCity.trim()) {
      setModalError('City name is required.');
      return;
    }
    const cleanRadius = Number(modalRadiusInput.trim());
    if (!modalRadiusInput.trim() || isNaN(cleanRadius) || cleanRadius <= 0) {
      setModalError('Operating radius must be a valid number greater than 0 km.');
      return;
    }
    if (modalServices.length === 0) {
      setModalError('At least one service must be active in this area.');
      return;
    }

    setIsSavingModal(true);
    setModalError(null);

    const parsedAreas = modalAreasText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const parsedPincodes = modalPincodesText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    const newArea: ServiceAreaConfig = {
      city: modalCity.trim(),
      state: modalState.trim(),
      country: 'India',
      areas: parsedAreas,
      pincodes: parsedPincodes,
      radius: cleanRadius,
      services: modalServices,
    };

    try {
      let updatedAreas = [...coverageAreas];
      if (editingIndex !== null) {
        updatedAreas[editingIndex] = newArea;
      } else {
        updatedAreas.push(newArea);
      }

      const res = await apiClient.put('/company/coverage', {
        serviceAreas: updatedAreas,
      });

      if (res.data.success) {
        setCoverageAreas(res.data.data.serviceAreas);
        setServicesSupported(res.data.data.servicesSupported);
        setIsModalOpen(false);
        setCoverageSuccess(
          editingIndex !== null ? 'Service area updated successfully.' : 'New service area added successfully.'
        );
        setTimeout(() => setCoverageSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error('Save area failed:', err);
      setModalError(err.response?.data?.error?.message || 'Failed to save service area.');
    } finally {
      setIsSavingModal(false);
    }
  };

  const confirmDeleteArea = async () => {
    if (areaToDeleteIndex === null) return;
    try {
      const res = await apiClient.delete(`/company/coverage/area/${areaToDeleteIndex}`);
      if (res.data.success) {
        setCoverageAreas(res.data.data.serviceAreas);
        setServicesSupported(res.data.data.servicesSupported);
        setAreaToDeleteIndex(null);
        setCoverageSuccess('Service area removed successfully.');
        setTimeout(() => setCoverageSuccess(null), 4000);
      }
    } catch (err: any) {
      console.error('Delete area failed:', err);
      setCoverageError(err.response?.data?.error?.message || 'Failed to remove service area.');
      setAreaToDeleteIndex(null);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Company Settings & Operations Coverage
          </h2>
          <p className="text-xs text-slate-500">
            Manage operational service areas, offered verticals & system telemetry
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
          <button
            onClick={() => setActiveTab('COVERAGE')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'COVERAGE'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
            Service Coverage
          </button>
          <button
            onClick={() => setActiveTab('SYSTEM')}
            className={`px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
              activeTab === 'SYSTEM'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5 text-slate-500" />
            System & Scope
          </button>
        </div>
      </div>

      {/* SUCCESS / ERROR ALERTS */}
      {coverageSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{coverageSuccess}</span>
        </div>
      )}
      {coverageError && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{coverageError}</span>
        </div>
      )}

      {/* TAB 1: SERVICE COVERAGE */}
      {activeTab === 'COVERAGE' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Configured Service Areas</h3>
              <p className="text-xs text-slate-500">
                Customers discover services based strictly on these configured coverage boundaries.
              </p>
            </div>
            <button
              onClick={openAddModal}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" /> Add Service Area
            </button>
          </div>

          {isLoadingCoverage ? (
            <div className="py-12 flex justify-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : coverageAreas.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-3">
              <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
              <div className="text-sm font-bold text-slate-800">No Service Areas Configured</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Your company currently has no active coverage areas. Customers will not be able to find your services until you configure at least one location.
              </p>
              <button
                onClick={openAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
              >
                <Plus className="w-4 h-4" /> Configure First Area
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {coverageAreas.map((area, idx) => (
                <div
                  key={idx}
                  className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-emerald-600" />
                          <h4 className="text-base font-bold text-slate-900">{area.city}</h4>
                          <span className="text-xs text-slate-400">({area.state || 'India'})</span>
                        </div>
                        {area.radius && (
                          <span className="text-[11px] text-slate-500 block mt-0.5">
                            Operating Radius: {area.radius} km
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEditModal(idx)}
                          className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Edit Service Area"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setAreaToDeleteIndex(idx)}
                          className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Service Area"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Localities */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Covered Localities ({area.areas?.length || 0})
                      </span>
                      {area.areas && area.areas.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {area.areas.map((a, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                            >
                              {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Entire city covered</span>
                      )}
                    </div>

                    {/* Pincodes */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                        Covered Pincodes ({area.pincodes?.length || 0})
                      </span>
                      {area.pincodes && area.pincodes.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {area.pincodes.map((p, i) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60 text-[11px] font-mono font-semibold"
                            >
                              {p}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">All city pincodes</span>
                      )}
                    </div>
                  </div>

                  {/* Services enabled in this area */}
                  <div className="pt-3 border-t border-slate-100">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                      Offered Services in {area.city}
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {area.services.map((srv) => {
                        const opt = SERVICE_OPTIONS.find((o) => o.type === srv);
                        return (
                          <span
                            key={srv}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            <Check className="w-3 h-3 text-emerald-600" />
                            {opt?.label || srv}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: SYSTEM & SCOPE */}
      {activeTab === 'SYSTEM' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              <h3 className="text-sm font-bold text-slate-900">Company & Tenant Scope</h3>
            </div>

            <div className="space-y-2 text-xs">
              <div>
                <span className="text-slate-400 block font-semibold">Company Name</span>
                <span className="text-sm font-bold text-slate-900">{user?.companyName}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Active User Account</span>
                <span className="font-semibold text-slate-800">
                  {user?.name} ({user?.email})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Role Privilege</span>
                <span className="inline-block mt-0.5 px-2 py-0.5 rounded font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {user?.role}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block font-semibold">Active Service Verticals</span>
                <div className="flex flex-wrap gap-1.5 mt-1">
                  {servicesSupported.map((s) => (
                    <span
                      key={s}
                      className="font-bold px-2 py-0.5 rounded text-[11px] bg-slate-100 text-slate-800 border border-slate-200"
                    >
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
              <Database className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Database & Telemetry Health</h3>
            </div>

            {isLoadingHealth ? (
              <div className="py-6 flex justify-center text-slate-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block">MongoDB Atlas Primary</span>
                    <span className="text-slate-500 text-[11px]">
                      Database: {health?.database?.databaseName || 'servora'}
                    </span>
                  </div>
                  <span className="flex items-center gap-1 font-bold text-emerald-600 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    Connected
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div>
                    <span className="font-bold text-slate-800 block">AI Triage Provider</span>
                    <span className="text-slate-500 text-[11px]">Provider: DemoAIProvider (Offline Fallback Ready)</span>
                  </div>
                  <span className="flex items-center gap-1 font-bold text-emerald-600 text-xs">
                    <CheckCircle className="w-4 h-4" />
                    Active
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADD / EDIT MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl border border-slate-100 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-emerald-600" />
                {editingIndex !== null ? `Edit ${modalCity} Coverage` : 'Add New Service Area'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    City Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={modalCity}
                    onChange={(e) => setModalCity(e.target.value)}
                    placeholder="e.g. Rajkot"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    State
                  </label>
                  <input
                    type="text"
                    value={modalState}
                    onChange={(e) => setModalState(e.target.value)}
                    placeholder="e.g. Gujarat"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Localities / Areas (Comma-separated)
                </label>
                <input
                  type="text"
                  value={modalAreasText}
                  onChange={(e) => setModalAreasText(e.target.value)}
                  placeholder="e.g. Kalawad Road, Yagnik Road, Gondal Road"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Leave empty to cover the entire city.</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Pincodes (Comma-separated)
                </label>
                <input
                  type="text"
                  value={modalPincodesText}
                  onChange={(e) => setModalPincodesText(e.target.value)}
                  placeholder="e.g. 360001, 360005"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">Leave empty to cover all pincodes.</span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Operating Radius (km) *
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={modalRadiusInput}
                  onChange={(e) => setModalRadiusInput(e.target.value)}
                  placeholder="e.g. 20"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                />
                <span className="text-[11px] text-slate-400 mt-0.5 block">
                  Service dispatch perimeter from city center. Must be greater than 0 km.
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Services Offered in This Area *
                </label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  {SERVICE_OPTIONS.map((srv) => {
                    const isChecked = modalServices.includes(srv.type);
                    return (
                      <button
                        type="button"
                        key={srv.type}
                        onClick={() => {
                          setModalServices((prev) =>
                            isChecked ? prev.filter((s) => s !== srv.type) : [...prev, srv.type]
                          );
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold text-left flex items-center justify-between transition-all ${
                          isChecked
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                            : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <span>{srv.label}</span>
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingModal}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingModal ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  {editingIndex !== null ? 'Save Changes' : 'Add Area'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {areaToDeleteIndex !== null && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 shadow-xl border border-slate-100">
            <div className="flex items-center gap-2 text-rose-600">
              <AlertCircle className="w-5 h-5" />
              <h4 className="text-sm font-bold text-slate-900">Confirm Area Removal</h4>
            </div>
            <p className="text-xs text-slate-600">
              Are you sure you want to remove coverage for{' '}
              <strong className="text-slate-900">{coverageAreas[areaToDeleteIndex]?.city}</strong>? Customers in this location will no longer be able to request services from your company.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setAreaToDeleteIndex(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDeleteArea}
                className="px-4 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Yes, Remove Area
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
