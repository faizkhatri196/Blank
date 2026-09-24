import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { CustomerLocation, getCustomerSavedLocation, saveCustomerLocation as persistLocation, clearCustomerLocation as clearLocation } from "../utils/customerLocation";
import { useAuth } from "./AuthContext";

export const LOCATION_CHANGE_EVENT = "servora:locationChanged";

interface LocationContextValue {
  location: CustomerLocation | null;
  setAndSaveLocation: (loc: CustomerLocation | null) => void;
  clearSavedLocation: () => void;
}

const LocationContext = createContext<LocationContextValue>({ location: null, setAndSaveLocation: () => {}, clearSavedLocation: () => {} });

export const LocationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [location, setLocation] = useState<CustomerLocation | null>(() => getCustomerSavedLocation(user?.id));

  useEffect(() => { setLocation(getCustomerSavedLocation(user?.id)); }, [user?.id]);

  useEffect(() => {
    const h = (e: StorageEvent) => { if (e.key?.startsWith("servora.customer.location") || e.key === "servora.customer.guest_location") setLocation(getCustomerSavedLocation(user?.id)); };
    window.addEventListener("storage", h);
    return () => window.removeEventListener("storage", h);
  }, [user?.id]);

  useEffect(() => {
    const h = () => setLocation(getCustomerSavedLocation(user?.id));
    window.addEventListener(LOCATION_CHANGE_EVENT, h);
    return () => window.removeEventListener(LOCATION_CHANGE_EVENT, h);
  }, [user?.id]);

  const setAndSaveLocation = useCallback((loc: CustomerLocation | null) => {
    loc ? persistLocation(loc, user?.id) : clearLocation(user?.id);
    setLocation(loc);
    window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT));
  }, [user?.id]);

  const clearSavedLocation = useCallback(() => {
    clearLocation(user?.id);
    setLocation(null);
    window.dispatchEvent(new CustomEvent(LOCATION_CHANGE_EVENT));
  }, [user?.id]);

  return <LocationContext.Provider value={{ location, setAndSaveLocation, clearSavedLocation }}>{children}</LocationContext.Provider>;
};

export const useCustomerLocation = () => useContext(LocationContext);
