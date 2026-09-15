import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Customer, ServiceType } from '../../types';
import { FileUpload } from '../../components/common/FileUpload';
import { Sun, Wind, CheckCircle, ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

export const NewTicket: React.FC = () => {
  const navigate = useNavigate();

  // Vertical selection
  const [serviceType, setServiceType] = useState<ServiceType>('SOLAR');

  // Customer state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerAddress, setNewCustomerAddress] = useState('');
  const [newCustomerCity, setNewCustomerCity] = useState('Ahmedabad');

  // Solar Equipment
  const [capacityKW, setCapacityKW] = useState(5.0);
  const [panelMake, setPanelMake] = useState('Adani Solar');
  const [inverterMake, setInverterMake] = useState('Sungrow');
  const [inverterModel, setInverterModel] = useState('SG5.0RS');
  const [inverterSerial, setInverterSerial] = useState('INV-2024-99123');
  const [systemType, setSystemType] = useState<'ON_GRID' | 'OFF_GRID' | 'HYBRID'>('ON_GRID');
  const [batteryPresent, setBatteryPresent] = useState(false);

  // AC Equipment
  const [acBrand, setAcBrand] = useState('Daikin');
  const [acModel, setAcModel] = useState('FTKF50TV');
  const [acSerial, setAcSerial] = useState('AC-SR-44512');
  const [acType, setAcType] = useState<'SPLIT' | 'WINDOW' | 'CASSETTE' | 'DUCTED'>('SPLIT');
  const [capacityTR, setCapacityTR] = useState(1.5);
  const [refrigerantType, setRefrigerantType] = useState('R32');

  // Ticket Complaint & Symptoms
  const [complaint, setComplaint] = useState(
    'Inverter showing Error 04 and generation has dropped to zero during sunny afternoon.'
  );
  const [symptomsInput, setSymptomsInput] = useState('Red error LED on inverter, Zero power export to meter');
  const [errorCode, setErrorCode] = useState('Error 04');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('HIGH');
  const [photoUrl, setPhotoUrl] = useState<string>('');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCustomers() {
      try {
        const res = await apiClient.get('/customers');
        const custs = res.data.data || [];
        setCustomers(custs);
        if (custs.length > 0) {
          setSelectedCustomerId(custs[0]._id);
        } else {
          setIsCreatingCustomer(true);
          setNewCustomerName('Shreeji Solar Facility');
          setNewCustomerPhone('+91 98765 10001');
          setNewCustomerAddress('Plot 24, GIDC Sanand');
          setNewCustomerCity('Sanand');
        }
      } catch (err) {
        console.error('Failed to load customers:', err);
        setIsCreatingCustomer(true);
      }
    }
    fetchCustomers();
  }, []);

  const handleServiceTypeChange = (type: ServiceType) => {
    setServiceType(type);
    if (type === 'SOLAR') {
      setComplaint('Inverter showing Error 04 and generation dropped to zero.');
      setSymptomsInput('Inverter display offline, Zero units on solar meter');
      setErrorCode('Error 04');
    } else {
      setComplaint('Split AC is running but blowing warm air and not cooling.');
      setSymptomsInput('Warm air from blower, Outdoor compressor humming then clicking off');
      setErrorCode('No cooling');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      let customerId = selectedCustomerId;

      // 1. Create customer if new
      if (isCreatingCustomer) {
        if (!newCustomerName.trim()) {
          setError('Please enter the customer name.');
          setIsLoading(false);
          return;
        }
        if (!newCustomerPhone.trim()) {
          setError('Please enter the customer phone number.');
          setIsLoading(false);
          return;
        }
        const custRes = await apiClient.post('/customers', {
          name: newCustomerName.trim(),
          phone: newCustomerPhone.trim(),
          address: newCustomerAddress.trim() || 'GIDC Industrial Estate, Sanand',
          city: newCustomerCity.trim() || 'Ahmedabad',
        });
        customerId = custRes.data.data._id;
      } else {
        if (!customerId) {
          setError('Please select an existing customer or click "+ New Customer"');
          setIsLoading(false);
          return;
        }
      }

      // 2. Lookup existing asset or create
      let assetId = '';
      if (serviceType === 'SOLAR') {
        const existingAssetsRes = await apiClient.get(`/assets/solar-systems?customerId=${customerId}`);
        if (existingAssetsRes.data.data && existingAssetsRes.data.data.length > 0) {
          assetId = existingAssetsRes.data.data[0]._id;
        } else {
          const assetRes = await apiClient.post('/assets/solar-systems', {
            customerId,
            capacityKW: Number(capacityKW) || 5.0,
            panelMake: panelMake || 'Adani Solar',
            inverterMake: inverterMake || 'Sungrow',
            inverterModel: inverterModel || 'SG5.0RS',
            inverterSerial: inverterSerial || 'INV-2024-99123',
            systemType: systemType || 'ON_GRID',
            batteryPresent: Boolean(batteryPresent),
          });
          assetId = assetRes.data.data._id;
        }
      } else {
        const existingAssetsRes = await apiClient.get(`/assets/ac-units?customerId=${customerId}`);
        if (existingAssetsRes.data.data && existingAssetsRes.data.data.length > 0) {
          assetId = existingAssetsRes.data.data[0]._id;
        } else {
          const assetRes = await apiClient.post('/assets/ac-units', {
            customerId,
            brand: acBrand || 'Daikin',
            model: acModel || 'FTKF50TV',
            serialNumber: acSerial || 'AC-SR-44512',
            acType: acType || 'SPLIT',
            capacityTR: Number(capacityTR) || 1.5,
            refrigerantType: refrigerantType || 'R32',
          });
          assetId = assetRes.data.data._id;
        }
      }

      // 3. Create Service Ticket
      const symptoms = symptomsInput
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const ticketRes = await apiClient.post('/tickets', {
        serviceType,
        customerId,
        assetId,
        complaint: complaint.trim(),
        symptoms,
        errorCode: errorCode.trim() || undefined,
        priority,
        photos: photoUrl ? [photoUrl] : [],
      });

      const newTicket = ticketRes.data.data;
      navigate(`/manager/tickets/${newTicket._id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to create service ticket');
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Create Service Request
          </h2>
          <p className="text-xs text-slate-500">
            Intake customer complaint, equipment configuration & site context
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* STEP 1: Service Vertical Selection */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            1. Select Service Vertical
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => handleServiceTypeChange('SOLAR')}
              className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                serviceType === 'SOLAR'
                  ? 'border-amber-500 bg-amber-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  serviceType === 'SOLAR' ? 'bg-amber-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Sun className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">SOLAR Vertical</div>
                <div className="text-[11px] text-slate-500">Rooftop PV, Inverters & Strings</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => handleServiceTypeChange('AC')}
              className={`p-4 rounded-xl border-2 text-left transition-all flex items-center gap-3 ${
                serviceType === 'AC'
                  ? 'border-sky-500 bg-sky-50/60 shadow-sm'
                  : 'border-slate-200 hover:border-slate-300 bg-white'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  serviceType === 'AC' ? 'bg-sky-500 text-white' : 'bg-slate-100 text-slate-500'
                }`}
              >
                <Wind className="w-6 h-6" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">AC / HVAC Vertical</div>
                <div className="text-[11px] text-slate-500">Split, Cassette, Cooling & Gas</div>
              </div>
            </button>
          </div>
        </div>

        {/* STEP 2: Customer Information */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
              2. Customer Details
            </label>
            <button
              type="button"
              onClick={() => setIsCreatingCustomer(!isCreatingCustomer)}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline"
            >
              {isCreatingCustomer ? 'Select Existing Customer' : '+ New Customer'}
            </button>
          </div>

          {!isCreatingCustomer ? (
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Select Existing Customer
              </label>
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                {customers.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name} — {c.phone} ({c.city})
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="+91 98765 00000"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-xs font-medium text-slate-600 mb-1">Street Address</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Plot 24, GIDC Sanand"
                  value={newCustomerAddress}
                  onChange={(e) => setNewCustomerAddress(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* STEP 3: Equipment Details */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            3. Equipment Specifications ({serviceType})
          </label>

          {serviceType === 'SOLAR' ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Capacity (kW)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={capacityKW}
                  onChange={(e) => setCapacityKW(parseFloat(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Inverter Make</label>
                <input
                  type="text"
                  required
                  value={inverterMake}
                  onChange={(e) => setInverterMake(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Inverter Model</label>
                <input
                  type="text"
                  value={inverterModel}
                  onChange={(e) => setInverterModel(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Panel Brand</label>
                <input
                  type="text"
                  value={panelMake}
                  onChange={(e) => setPanelMake(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">System Type</label>
                <select
                  value={systemType}
                  onChange={(e: any) => setSystemType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
                >
                  <option value="ON_GRID">On Grid</option>
                  <option value="OFF_GRID">Off Grid</option>
                  <option value="HYBRID">Hybrid (With Battery)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Inverter Serial</label>
                <input
                  type="text"
                  value={inverterSerial}
                  onChange={(e) => setInverterSerial(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">AC Brand</label>
                <input
                  type="text"
                  required
                  value={acBrand}
                  onChange={(e) => setAcBrand(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Tonnage (TR)</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={capacityTR}
                  onChange={(e) => setCapacityTR(parseFloat(e.target.value))}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">AC Type</label>
                <select
                  value={acType}
                  onChange={(e: any) => setAcType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
                >
                  <option value="SPLIT">Split AC</option>
                  <option value="WINDOW">Window AC</option>
                  <option value="CASSETTE">Cassette AC</option>
                  <option value="DUCTED">Ducted AC</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Refrigerant</label>
                <input
                  type="text"
                  value={refrigerantType}
                  onChange={(e) => setRefrigerantType(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Model Name</label>
                <input
                  type="text"
                  value={acModel}
                  onChange={(e) => setAcModel(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Serial Number</label>
                <input
                  type="text"
                  value={acSerial}
                  onChange={(e) => setAcSerial(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2"
                />
              </div>
            </div>
          )}
        </div>

        {/* STEP 4: Complaint & Symptoms */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
            4. Service Problem Details
          </label>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Customer Complaint Description *
            </label>
            <textarea
              required
              rows={3}
              value={complaint}
              onChange={(e) => setComplaint(e.target.value)}
              className="w-full text-xs border border-slate-300 rounded-xl p-3 focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Reported Symptoms (comma separated)
              </label>
              <input
                type="text"
                value={symptomsInput}
                onChange={(e) => setSymptomsInput(e.target.value)}
                placeholder="e.g. Zero generation, Error LED blinking"
                className="w-full text-xs border border-slate-300 rounded-xl p-2"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Error Code (if visible)
              </label>
              <input
                type="text"
                value={errorCode}
                onChange={(e) => setErrorCode(e.target.value)}
                placeholder="e.g. Error 04, U4, E6"
                className="w-full text-xs border border-slate-300 rounded-xl p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Priority Level</label>
              <select
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2 bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Urgent Breakdown)</option>
                <option value="URGENT">Urgent (Safety / Complete Outage)</option>
              </select>
            </div>

            <div>
              <FileUpload
                label="Site / Inverter Photo (Optional)"
                onUploadSuccess={(url) => setPhotoUrl(url)}
                onRemove={() => setPhotoUrl('')}
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Ticket...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Save Service Ticket
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
