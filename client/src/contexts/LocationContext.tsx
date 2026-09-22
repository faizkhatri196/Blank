import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CustomerLocation, getCustomerSavedLocation, saveCustomerLocation } from '../utils/customerLocation';
import { useAuth } from './AuthContext';

interface LocationContextValue {
  location: CustomerLocation | null;
  setLocation: (location: CustomerLocation | null, persist?: boolean) => void;
  clearLocation: (persist?: boolean) => void;
}

const LocationContext = createContext<LocationContextValue | undefined>(undefined);

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [location, setLocationState] = useState<CustomerLocation | null>(() =>
    getCustomerSavedLocation(user?.id)
  );

  useEffect(() => {
    setLocationState(getCustomerSavedLocation(user?.id));
  }, [user?.id]);

  useEffect(() => {
    const reload = () => setLocationState(getCustomerSavedLocation(user?.id));
    const handleStorage = (event: StorageEvent) => {
      if (!event.key || event.key === `servora.customer.location.${user?.id || ''}`) reload();
    };
    window.addEventListener('servora:locationChanged', reload);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('servora:locationChanged', reload);
      window.removeEventListener('storage', handleStorage);
    };
  }, [user?.id]);

  const value = useMemo<LocationContextValue>(() => ({
    location,
    setLocation: (next, persist = true) => {
      setLocationState(next);
      if (next && persist) saveCustomerLocation(next, user?.id);
      window.dispatchEvent(new Event('servora:locationChanged'));
    },
    clearLocation: (persist = true) => {
      setLocationState(null);
      if (persist && user?.id) {
        localStorage.removeItem(`servora.customer.location.${String(user.id).trim()}`);
      }
      if (persist && !user?.id) {
        localStorage.removeItem('servora.customer.guest_location');
      }
      window.dispatchEvent(new Event('servora:locationChanged'));
    },
  }), [location, user?.id]);

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>;
};

export function useCustomerLocation(): LocationContextValue {
  const context = useContext(LocationContext);
  if (!context) throw new Error('useCustomerLocation must be used within LocationProvider');
  return context;
}
