import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Technician, ServiceType } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Users, Plus, Phone, Wrench, Shield, CheckCircle, Search, Loader2 } from 'lucide-react';

export const Technicians: React.FC = () => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [serviceFilter, setServiceFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // New Technician form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [createdTechInfo, setCreatedTechInfo] = useState<{
    name: string;
    email: string;
    temporaryPassword: string;
  } | null>(null);
  const [experienceYears, setExperienceYears] = useState(3);
  const [serviceTypes, setServiceTypes] = useState<ServiceType[]>(['SOLAR']);
  const [skillsInput, setSkillsInput] = useState('SOLAR_INSTALLATION, INVERTER_REPAIR');
  const [toolsInput, setToolsInput] = useState('MULTIMETER, CLAMP_METER, MC4_TOOL');
  const [serviceAreasInput, setServiceAreasInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const loadTechnicians = async () => {
    setIsLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (serviceFilter) queryParams.set('serviceType', serviceFilter);
      if (search) queryParams.set('search', search);

      const res = await apiClient.get(`/technicians?${queryParams.toString()}`);
      setTechnicians(res.data.data);
    } catch (err) {
      console.error('Failed to load technicians:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTechnicians();
  }, [serviceFilter, search]);

  const handleToggleServiceType = (st: ServiceType) => {
    if (serviceTypes.includes(st)) {
      if (serviceTypes.length > 1) {
        setServiceTypes(serviceTypes.filter((t) => t !== st));
      }
    } else {
      setServiceTypes([...serviceTypes, st]);
    }
  };

  const handleCreateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    if (password !== confirmPassword) {
      setModalError("Passwords don't match. Please verify and try again.");
      return;
    }

    setIsSubmitting(true);

    try {
      const skills = skillsInput
        .split(',')
        .map((s) => s.trim().toUpperCase().replace(/\s+/g, '_'))
        .filter(Boolean);

      const tools = toolsInput
        .split(',')
        .map((t) => t.trim().toUpperCase().replace(/\s+/g, '_'))
        .filter(Boolean);

      const serviceAreas = serviceAreasInput
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      await apiClient.post('/technicians', {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password,
        experienceYears: Number(experienceYears),
        serviceTypes,
        skills,
        tools,
        serviceAreas,
        certifications: ['Certified Field Technician Level II'],
      });

      // Provide one-time display of temporary login credentials for manager to share
      setCreatedTechInfo({
        name: name.trim(),
        email: email.toLowerCase().trim(),
        temporaryPassword: password,
      });

      setIsAddModalOpen(false);
      // Reset form fields
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
      setConfirmPassword('');
      await loadTechnicians();
    } catch (err: any) {
      setModalError(err.message || 'Failed to add technician');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusChange = async (techId: string, newAvailability: string) => {
    try {
      await apiClient.patch(`/technicians/${techId}/status`, { availability: newAvailability });
      await loadTechnicians();
    } catch (err: any) {
      alert(`Failed to update status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Field Technicians ({technicians.length})
          </h2>
          <p className="text-xs text-slate-500">
            Certified workforce capability matrix, service types & real-time dispatch availability
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          + Add Field Technician
        </button>
      </div>

      {/* One-Time Temporary Password Display */}
      {createdTechInfo && (
        <div className="p-4 rounded-2xl bg-emerald-50 border-2 border-emerald-500 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
              <span className="text-sm font-black text-emerald-950">
                Technician Account Created Successfully!
              </span>
            </div>
            <p className="text-xs text-emerald-900">
              Share these credentials with <strong>{createdTechInfo.name}</strong> now. For security, passwords are never stored in plaintext or displayed again.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 font-mono font-bold text-slate-800">
                Email: {createdTechInfo.email}
              </span>
              <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 font-mono font-bold text-emerald-700">
                Temporary Password: {createdTechInfo.temporaryPassword}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setCreatedTechInfo(null)}
            className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shrink-0 shadow-sm"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search technicians by name, phone, area..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>

        <select
          value={serviceFilter}
          onChange={(e) => setServiceFilter(e.target.value)}
          className="text-xs border border-slate-300 rounded-xl px-3 py-1.5 bg-white text-slate-700 outline-none"
        >
          <option value="">All Services</option>
          <option value="SOLAR">Solar Certified Only</option>
          <option value="AC">AC Certified Only</option>
        </select>
      </div>

      {/* Technicians Grid */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
          <span className="text-xs font-semibold">Loading technician profiles...</span>
        </div>
      ) : technicians.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500">
          No technicians found matching criteria.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {technicians.map((tech) => (
            <div
              key={tech._id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4 hover:border-slate-300 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">{tech.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {tech.phone}
                    </div>
                  </div>

                  <select
                    value={tech.availability}
                    onChange={(e) => handleStatusChange(tech._id, e.target.value)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full border outline-none cursor-pointer ${
                      tech.availability === 'AVAILABLE'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : tech.availability === 'BUSY'
                        ? 'bg-amber-50 text-amber-700 border-amber-300'
                        : 'bg-slate-100 text-slate-600 border-slate-300'
                    }`}
                  >
                    <option value="AVAILABLE">AVAILABLE</option>
                    <option value="BUSY">BUSY</option>
                    <option value="OFFLINE">OFFLINE</option>
                  </select>
                </div>

                {/* Service Types */}
                <div className="flex flex-wrap gap-1.5">
                  {tech.serviceTypes.map((st) => (
                    <span
                      key={st}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        st === 'SOLAR'
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-sky-100 text-sky-900 border border-sky-200'
                      }`}
                    >
                      {st === 'SOLAR' ? 'SOLAR PV' : 'AC / HVAC'}
                    </span>
                  ))}
                  <span className="text-[10px] text-slate-500 font-semibold px-2 py-0.5 rounded bg-slate-100">
                    {tech.experienceYears} Years Exp
                  </span>
                </div>

                {/* Skills */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Certified Skills
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tech.skills.slice(0, 4).map((skill, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200"
                      >
                        {skill.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {tech.skills.length > 4 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{tech.skills.length - 4} more
                      </span>
                    )}
                  </div>
                </div>

                {/* Tools */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Equipped Tools
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {tech.tools.slice(0, 3).map((tool, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200"
                      >
                        {tool.replace(/_/g, ' ')}
                      </span>
                    ))}
                    {tech.tools.length > 3 && (
                      <span className="text-[10px] text-slate-400 font-medium">
                        +{tech.tools.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Service Areas */}
              <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>Areas:</span>
                <span className="font-medium text-slate-700 truncate max-w-[180px]">
                  {tech.serviceAreas.join(', ')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: Add Technician */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Field Technician"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateTechnician} className="space-y-4 text-xs">
          {modalError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl">
              {modalError}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Anand Varma"
                className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 00000"
                className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email (Login) *</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="anand@demo.com"
                className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Temporary Password *</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Confirm Password *</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Certified Service Capabilities *
            </label>
            <div className="flex gap-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceTypes.includes('SOLAR')}
                  onChange={() => handleToggleServiceType('SOLAR')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">Solar Photovoltaic</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={serviceTypes.includes('AC')}
                  onChange={() => handleToggleServiceType('AC')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">Air Conditioning / HVAC</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Experience Years</label>
            <input
              type="number"
              min="0"
              value={experienceYears}
              onChange={(e) => setExperienceYears(parseInt(e.target.value, 10))}
              className="w-full border border-slate-300 rounded-xl p-2"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Skills (comma separated)
            </label>
            <input
              type="text"
              value={skillsInput}
              onChange={(e) => setSkillsInput(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Assigned Tools (comma separated)
            </label>
            <input
              type="text"
              value={toolsInput}
              onChange={(e) => setToolsInput(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Service Areas (comma separated)
            </label>
            <input
              type="text"
              value={serviceAreasInput}
              onChange={(e) => setServiceAreasInput(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2"
            />
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Technician'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
