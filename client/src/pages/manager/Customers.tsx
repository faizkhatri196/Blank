import React, { useEffect, useState } from 'react';
import { apiClient } from '../../api/client';
import { Customer } from '../../types';
import { Building2, Search, Phone, MapPin, Wrench, Sun, Wind, Loader2 } from 'lucide-react';
import { Modal } from '../../components/common/Modal';

export const Customers: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Detail Modal state
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isDetailLoading, setIsDetailLoading] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  const loadCustomers = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get(`/customers?search=${search}`);
      setCustomers(res.data.data);
    } catch (err) {
      console.error('Failed to load customers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, [search]);

  const handleOpenDetail = async (customerId: string) => {
    setIsDetailLoading(true);
    setDetailModalOpen(true);
    try {
      const res = await apiClient.get(`/customers/${customerId}`);
      setSelectedCustomer(res.data.data);
    } catch (err) {
      console.error('Failed to load customer profile:', err);
    } finally {
      setIsDetailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Customer Directory ({customers.length})
          </h2>
          <p className="text-xs text-slate-500">
            Customer assets, installed equipment & longitudinal service records
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search customers by name, phone, address, city..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none"
          />
        </div>
      </div>

      {/* Customers Grid */}
      {isLoading ? (
        <div className="py-20 flex items-center justify-center text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin text-emerald-600 mr-2" />
          <span className="text-xs font-semibold">Loading customers...</span>
        </div>
      ) : customers.length === 0 ? (
        <div className="py-16 text-center text-xs text-slate-500">No customers found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((cust) => (
            <div
              key={cust._id}
              onClick={() => handleOpenDetail(cust._id)}
              className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-emerald-500 transition-all shadow-sm cursor-pointer space-y-3 flex flex-col justify-between"
            >
              <div>
                <h3 className="text-sm font-bold text-slate-900">{cust.name}</h3>
                <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{cust.phone}</span>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                  <span className="line-clamp-2">
                    {cust.address}, {cust.city}
                  </span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-emerald-600">
                <span>View Assets & History</span>
                <span>→</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Detail Modal */}
      <Modal
        isOpen={detailModalOpen}
        onClose={() => setDetailModalOpen(false)}
        title={selectedCustomer?.customer?.name || 'Customer Profile'}
        maxWidth="xl"
      >
        {isDetailLoading || !selectedCustomer ? (
          <div className="py-12 flex justify-center text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5 text-xs">
            {/* Contact */}
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="font-bold text-slate-900 text-sm">{selectedCustomer.customer.name}</div>
              <div className="text-slate-600">Phone: {selectedCustomer.customer.phone}</div>
              <div className="text-slate-600">
                Address: {selectedCustomer.customer.address}, {selectedCustomer.customer.city}
              </div>
            </div>

            {/* Solar Assets */}
            {selectedCustomer.solarSystems && selectedCustomer.solarSystems.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5 mb-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  Solar PV Installations ({selectedCustomer.solarSystems.length})
                </div>
                <div className="space-y-2">
                  {selectedCustomer.solarSystems.map((sys: any) => (
                    <div key={sys._id} className="p-3 rounded-xl border border-amber-200 bg-amber-50/30">
                      <div className="font-bold text-slate-900">
                        {sys.capacityKW} kW • {sys.inverterMake} {sys.inverterModel}
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Panel: {sys.panelMake} | Type: {sys.systemType} | Serial: {sys.inverterSerial || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AC Units */}
            {selectedCustomer.acUnits && selectedCustomer.acUnits.length > 0 && (
              <div>
                <div className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5 mb-2">
                  <Wind className="w-4 h-4 text-sky-500" />
                  AC / HVAC Units ({selectedCustomer.acUnits.length})
                </div>
                <div className="space-y-2">
                  {selectedCustomer.acUnits.map((ac: any) => (
                    <div key={ac._id} className="p-3 rounded-xl border border-sky-200 bg-sky-50/30">
                      <div className="font-bold text-slate-900">
                        {ac.brand} {ac.model} • {ac.capacityTR} TR ({ac.acType})
                      </div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        Refrigerant: {ac.refrigerantType} | Serial: {ac.serialNumber || 'N/A'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Longitudinal Service History */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1.5 mb-2">
                <Wrench className="w-4 h-4 text-slate-400" />
                Service History Timeline ({selectedCustomer.history?.length || 0})
              </div>

              {selectedCustomer.history && selectedCustomer.history.length > 0 ? (
                <div className="space-y-2.5 max-h-60 overflow-y-auto">
                  {selectedCustomer.history.map((h: any) => (
                    <div key={h._id} className="p-3 rounded-xl border border-slate-200 bg-white space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{h.ticketNumber}</span>
                        <span className="text-[10px] text-slate-400">
                          {new Date(h.completedAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-slate-700 font-medium">Problem: "{h.complaint}"</div>
                      <div className="text-emerald-800 font-bold text-[11px]">
                        Actual: {h.actualDiagnosis}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        Work: {h.workPerformed} • Tech: {h.technicianName}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-50 text-center text-slate-400">
                  No completed service jobs recorded yet for this customer.
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
