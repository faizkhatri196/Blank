import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { apiClient } from '../../api/client';
import { Technician, ServiceType } from '../../types';
import { Modal } from '../../components/common/Modal';
import { Users, Plus, Phone, Wrench, Shield, CheckCircle, Search, Loader2, Edit2, Eye, Power, AlertCircle, MapPin, Sparkles, Compass } from 'lucide-react';
import { LocationAutocompleteInput } from '../../components/common/LocationAutocompleteInput';
import { CustomerLocation } from '../../utils/customerLocation';
import { geocodeAddressOrCity, reverseGeocodeCoords } from '../../utils/locationSearch';

export const Technicians: React.FC = () => {
  const [searchParams] = useSearchParams();
  const editTechId = searchParams.get('edit');
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
  const [radiusInput, setRadiusInput] = useState('25');
  const [pincodesInput, setPincodesInput] = useState('');
  const [baseAddress, setBaseAddress] = useState('');
  const [baseLat, setBaseLat] = useState('');
  const [baseLng, setBaseLng] = useState('');
  const [addLocationObj, setAddLocationObj] = useState<CustomerLocation | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Edit Technician form state
  const [editingTech, setEditingTech] = useState<Technician | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editExperienceYears, setEditExperienceYears] = useState(3);
  const [editServiceTypes, setEditServiceTypes] = useState<ServiceType[]>(['SOLAR']);
  const [editSkillsInput, setEditSkillsInput] = useState('');
  const [editToolsInput, setEditToolsInput] = useState('');
  const [editServiceAreasInput, setEditServiceAreasInput] = useState('');
  const [editRadiusInput, setEditRadiusInput] = useState('20');
  const [editPincodesInput, setEditPincodesInput] = useState('');
  const [editBaseAddress, setEditBaseAddress] = useState('');
  const [editBaseLat, setEditBaseLat] = useState('');
  const [editBaseLng, setEditBaseLng] = useState('');
  const [editLocationObj, setEditLocationObj] = useState<CustomerLocation | null>(null);
  const [editAvailability, setEditAvailability] = useState<'AVAILABLE' | 'BUSY' | 'OFFLINE'>('AVAILABLE');
  const [editActive, setEditActive] = useState(true);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);
  const [editModalError, setEditModalError] = useState<string | null>(null);
  const [technicianSuccessMessage, setTechnicianSuccessMessage] = useState<string | null>(null);
  const [isGeocodingAddLocation, setIsGeocodingAddLocation] = useState(false);
  const [isGeocodingEditLocation, setIsGeocodingEditLocation] = useState(false);
  const [isFetchingGpsAdd, setIsFetchingGpsAdd] = useState(false);
  const [isFetchingGpsEdit, setIsFetchingGpsEdit] = useState(false);
  const [gpsFeedbackAdd, setGpsFeedbackAdd] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [gpsFeedbackEdit, setGpsFeedbackEdit] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const handleAutoGeocodeAdd = async () => {
    const query = baseAddress || serviceAreasInput;
    if (!query) {
      setGpsFeedbackAdd({ type: 'error', text: 'Please enter an address or service area first to auto-geocode.' });
      return;
    }
    setGpsFeedbackAdd({ type: 'info', text: `Looking up coordinates for "${query}"...` });
    setIsGeocodingAddLocation(true);
    try {
      const res = await geocodeAddressOrCity(query);
      if (res) {
        setBaseLat(String(res.latitude));
        setBaseLng(String(res.longitude));
        if (!baseAddress) setBaseAddress(res.formattedAddress || query);
        if (res.pincode && !pincodesInput) setPincodesInput(res.pincode);
        setAddLocationObj({
          city: res.city || query,
          area: res.area,
          state: res.state,
          country: res.country,
          pincode: res.pincode,
          latitude: res.latitude,
          longitude: res.longitude,
          formattedAddress: res.formattedAddress,
          source: 'MANUAL',
        });
        setGpsFeedbackAdd({ type: 'success', text: `✓ Coordinates resolved: ${res.latitude.toFixed(4)}° N, ${res.longitude.toFixed(4)}° E` });
      } else {
        setGpsFeedbackAdd({ type: 'error', text: `Could not find coordinates for "${query}". Try searching in autocomplete.` });
      }
    } catch (err: any) {
      setGpsFeedbackAdd({ type: 'error', text: err.message || 'Geocoding failed.' });
    } finally {
      setIsGeocodingAddLocation(false);
    }
  };

  const handleUseGpsForAdd = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsFeedbackAdd({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }

    setIsFetchingGpsAdd(true);
    setGpsFeedbackAdd({ type: 'info', text: 'Requesting device GPS location...' });

    const handleSuccess = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      // 1. Immediately store coordinates so they are never lost
      setBaseLat(String(lat));
      setBaseLng(String(lon));
      setGpsFeedbackAdd({ type: 'info', text: `Acquired GPS (${lat.toFixed(4)}, ${lon.toFixed(4)}). Resolving address...` });

      try {
        const res = await reverseGeocodeCoords(lat, lon);
        if (res) {
          setBaseAddress(res.formattedAddress || res.city || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          if (res.area && !serviceAreasInput) {
            setServiceAreasInput(res.area);
          } else if (res.city && !serviceAreasInput) {
            setServiceAreasInput(res.city);
          }
          if (res.pincode && !pincodesInput) {
            setPincodesInput(res.pincode);
          }
          setAddLocationObj({
            city: res.city,
            area: res.area,
            state: res.state,
            country: res.country,
            pincode: res.pincode,
            latitude: lat,
            longitude: lon,
            formattedAddress: res.formattedAddress,
            source: 'GPS',
            accuracy: pos.coords.accuracy,
            timestamp: new Date().toISOString(),
          });
          setGpsFeedbackAdd({
            type: 'success',
            text: `✓ Live GPS attached: ${res.city || res.area || `${lat.toFixed(4)}, ${lon.toFixed(4)}`}`,
          });
        }
      } catch (err: any) {
        console.warn('Reverse geocode error, retained GPS coordinates:', err);
        setBaseAddress((prev) => prev || `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        setGpsFeedbackAdd({
          type: 'success',
          text: `✓ Live GPS coordinates captured (${lat.toFixed(4)}, ${lon.toFixed(4)}).`,
        });
      } finally {
        setIsFetchingGpsAdd(false);
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      // If high accuracy failed or timed out (common on desktop/laptops), retry with network accuracy
      if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
        setGpsFeedbackAdd({ type: 'info', text: 'GPS hardware timeout, falling back to network positioning...' });
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (fallbackErr) => {
            setIsFetchingGpsAdd(false);
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              setGpsFeedbackAdd({ type: 'error', text: 'Location permission denied. Please allow location access in your browser.' });
            } else {
              setGpsFeedbackAdd({ type: 'error', text: 'Could not acquire live position. Please select location from autocomplete.' });
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
        return;
      }

      setIsFetchingGpsAdd(false);
      if (err.code === err.PERMISSION_DENIED) {
        setGpsFeedbackAdd({ type: 'error', text: 'Location permission denied. Please allow location access in your browser settings.' });
      } else {
        setGpsFeedbackAdd({ type: 'error', text: `GPS Error: ${err.message || 'Unable to fetch position'}` });
      }
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
    );
  };

  const handleAutoGeocodeEdit = async () => {
    const query = editBaseAddress || editServiceAreasInput;
    if (!query) {
      setGpsFeedbackEdit({ type: 'error', text: 'Please enter an address or service area first to auto-geocode.' });
      return;
    }
    setGpsFeedbackEdit({ type: 'info', text: `Looking up coordinates for "${query}"...` });
    setIsGeocodingEditLocation(true);
    try {
      const res = await geocodeAddressOrCity(query);
      if (res) {
        setEditBaseLat(String(res.latitude));
        setEditBaseLng(String(res.longitude));
        if (!editBaseAddress) setEditBaseAddress(res.formattedAddress || query);
        if (res.pincode && !editPincodesInput) setEditPincodesInput(res.pincode);
        setEditLocationObj({
          city: res.city || query,
          area: res.area,
          state: res.state,
          country: res.country,
          pincode: res.pincode,
          latitude: res.latitude,
          longitude: res.longitude,
          formattedAddress: res.formattedAddress,
          source: 'MANUAL',
        });
        setGpsFeedbackEdit({ type: 'success', text: `✓ Coordinates resolved: ${res.latitude.toFixed(4)}° N, ${res.longitude.toFixed(4)}° E` });
      } else {
        setGpsFeedbackEdit({ type: 'error', text: `Could not find coordinates for "${query}". Try searching in autocomplete.` });
      }
    } catch (err: any) {
      setGpsFeedbackEdit({ type: 'error', text: err.message || 'Geocoding failed.' });
    } finally {
      setIsGeocodingEditLocation(false);
    }
  };

  const handleUseGpsForEdit = () => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGpsFeedbackEdit({ type: 'error', text: 'Geolocation is not supported by your browser.' });
      return;
    }

    setIsFetchingGpsEdit(true);
    setGpsFeedbackEdit({ type: 'info', text: 'Requesting device GPS location...' });

    const handleSuccess = async (pos: GeolocationPosition) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;

      setEditBaseLat(String(lat));
      setEditBaseLng(String(lon));
      setGpsFeedbackEdit({ type: 'info', text: `Acquired GPS (${lat.toFixed(4)}, ${lon.toFixed(4)}). Resolving address...` });

      try {
        const res = await reverseGeocodeCoords(lat, lon);
        if (res) {
          setEditBaseAddress(res.formattedAddress || res.city || `${lat.toFixed(4)}, ${lon.toFixed(4)}`);
          if (res.area && !editServiceAreasInput) {
            setEditServiceAreasInput(res.area);
          } else if (res.city && !editServiceAreasInput) {
            setEditServiceAreasInput(res.city);
          }
          if (res.pincode && !editPincodesInput) {
            setEditPincodesInput(res.pincode);
          }
          setEditLocationObj({
            city: res.city,
            area: res.area,
            state: res.state,
            country: res.country,
            pincode: res.pincode,
            latitude: lat,
            longitude: lon,
            formattedAddress: res.formattedAddress,
            source: 'GPS',
            accuracy: pos.coords.accuracy,
            timestamp: new Date().toISOString(),
          });
          setGpsFeedbackEdit({
            type: 'success',
            text: `✓ Live GPS attached: ${res.city || res.area || `${lat.toFixed(4)}, ${lon.toFixed(4)}`}`,
          });
        }
      } catch (err: any) {
        console.warn('Reverse geocode error, retained GPS coordinates:', err);
        setEditBaseAddress((prev) => prev || `GPS: ${lat.toFixed(4)}, ${lon.toFixed(4)}`);
        setGpsFeedbackEdit({
          type: 'success',
          text: `✓ Live GPS coordinates captured (${lat.toFixed(4)}, ${lon.toFixed(4)}).`,
        });
      } finally {
        setIsFetchingGpsEdit(false);
      }
    };

    const handleError = (err: GeolocationPositionError) => {
      if (err.code === err.TIMEOUT || err.code === err.POSITION_UNAVAILABLE) {
        setGpsFeedbackEdit({ type: 'info', text: 'GPS hardware timeout, falling back to network positioning...' });
        navigator.geolocation.getCurrentPosition(
          handleSuccess,
          (fallbackErr) => {
            setIsFetchingGpsEdit(false);
            if (fallbackErr.code === fallbackErr.PERMISSION_DENIED) {
              setGpsFeedbackEdit({ type: 'error', text: 'Location permission denied. Please allow location access in your browser.' });
            } else {
              setGpsFeedbackEdit({ type: 'error', text: 'Could not acquire live position. Please select location from autocomplete.' });
            }
          },
          { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
        );
        return;
      }

      setIsFetchingGpsEdit(false);
      if (err.code === err.PERMISSION_DENIED) {
        setGpsFeedbackEdit({ type: 'error', text: 'Location permission denied. Please allow location access in your browser settings.' });
      } else {
        setGpsFeedbackEdit({ type: 'error', text: `GPS Error: ${err.message || 'Unable to fetch position'}` });
      }
    };

    navigator.geolocation.getCurrentPosition(
      handleSuccess,
      handleError,
      { enableHighAccuracy: true, timeout: 6000, maximumAge: 10000 }
    );
  };

  // View Technician modal state
  const [viewingTech, setViewingTech] = useState<Technician | null>(null);

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
      const pincodes = pincodesInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const payload: any = {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        password,
        experienceYears: Number(experienceYears),
        serviceTypes,
        skills,
        tools,
        serviceAreas: serviceAreas.length > 0 ? serviceAreas : [baseAddress.trim() || 'All Areas'],
        coverageRadiusKm: Number(radiusInput) || 25,
        pincodes,
        certifications: ['Certified Field Technician Level II'],
      };

      if (baseAddress || baseLat || baseLng || addLocationObj) {
        let latNum = addLocationObj?.latitude ?? (baseLat ? parseFloat(baseLat) : undefined);
        let lngNum = addLocationObj?.longitude ?? (baseLng ? parseFloat(baseLng) : undefined);

        // Auto-geocode if coordinates missing or [0, 0]
        if ((latNum === undefined || lngNum === undefined || (Math.abs(latNum) < 0.001 && Math.abs(lngNum) < 0.001)) && (baseAddress || serviceAreas.length > 0)) {
          const query = baseAddress || serviceAreas[0];
          try {
            const geocoded = await geocodeAddressOrCity(query);
            if (geocoded) {
              latNum = geocoded.latitude;
              lngNum = geocoded.longitude;
            }
          } catch {}
        }

        payload.baseLocation = {
          placeId: addLocationObj?.placeId,
          formattedAddress: addLocationObj?.formattedAddress || baseAddress.trim() || undefined,
          city: addLocationObj?.city || baseAddress.trim() || undefined,
          area: addLocationObj?.area,
          state: addLocationObj?.state,
          country: addLocationObj?.country || 'India',
          postalCode: addLocationObj?.pincode || (pincodes.length > 0 ? pincodes[0] : undefined),
          latitude: latNum !== undefined && !isNaN(latNum) ? latNum : undefined,
          longitude: lngNum !== undefined && !isNaN(lngNum) ? lngNum : undefined,
        };
      }

      await apiClient.post('/technicians', payload);

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
      setRadiusInput('25');
      setPincodesInput('');
      setBaseAddress('');
      setBaseLat('');
      setBaseLng('');
      setAddLocationObj(null);
      await loadTechnicians();
    } catch (err: any) {
      setModalError(err.message || 'Failed to add technician');
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEditModal = (tech: Technician) => {
    setEditingTech(tech);
    setEditModalError(null);
    setGpsFeedbackEdit(null);
    setEditName(tech.name);
    setEditEmail(tech.email || '');
    setEditPhone(tech.phone);
    setEditExperienceYears(tech.experienceYears);
    setEditServiceTypes(tech.serviceTypes || ['SOLAR']);
    setEditSkillsInput((tech.skills || []).join(', '));
    setEditToolsInput((tech.tools || []).join(', '));
    setEditServiceAreasInput((tech.serviceAreas || []).join(', '));
    setEditRadiusInput(String(tech.coverageRadiusKm ?? 25));
    setEditPincodesInput((tech.pincodes || []).join(', '));
    setEditBaseAddress((tech.baseLocation as any)?.formattedAddress || (tech.baseLocation as any)?.city || '');
    const techLatVal = (tech.baseLocation as any)?.latitude ?? (tech.baseLocation as any)?.center?.coordinates?.[1];
    const techLngVal = (tech.baseLocation as any)?.longitude ?? (tech.baseLocation as any)?.center?.coordinates?.[0];
    setEditBaseLat(
      techLatVal !== undefined && techLatVal !== null && Math.abs(techLatVal) > 0.001
        ? String(techLatVal)
        : ''
    );
    setEditBaseLng(
      techLngVal !== undefined && techLngVal !== null && Math.abs(techLngVal) > 0.001
        ? String(techLngVal)
        : ''
    );
    if (tech.baseLocation) {
      setEditLocationObj({
        placeId: (tech.baseLocation as any).placeId,
        formattedAddress: tech.baseLocation.formattedAddress,
        city: tech.baseLocation.city || '',
        area: (tech.baseLocation as any).area,
        state: (tech.baseLocation as any).state,
        country: (tech.baseLocation as any).country,
        pincode: (tech.baseLocation as any).postalCode,
        latitude: techLatVal,
        longitude: techLngVal,
      });
    } else {
      setEditLocationObj(null);
    }

    // If coordinates are missing or [0, 0], attempt background forward geocode
    const addressToGeocode = (tech.baseLocation as any)?.formattedAddress || (tech.baseLocation as any)?.city || (tech.serviceAreas?.[0]);
    if ((!techLatVal || !techLngVal || (Math.abs(techLatVal) < 0.001 && Math.abs(techLngVal) < 0.001)) && addressToGeocode) {
      geocodeAddressOrCity(addressToGeocode).then((geocoded) => {
        if (geocoded) {
          setEditBaseLat(String(geocoded.latitude));
          setEditBaseLng(String(geocoded.longitude));
          if (!editBaseAddress) setEditBaseAddress(geocoded.formattedAddress || addressToGeocode);
        }
      }).catch(() => {});
    }

    setEditAvailability(tech.availability || 'AVAILABLE');
    setEditActive(tech.active !== false);
    setEditModalError(null);
    setIsEditModalOpen(true);
  };

  useEffect(() => {
    if (editTechId && technicians.length > 0) {
      const found = technicians.find((t) => t._id === editTechId);
      if (found) {
        openEditModal(found);
      }
    }
  }, [editTechId, technicians]);

  const handleUpdateTechnician = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTech) return;
    setEditModalError(null);
    setIsEditSubmitting(true);

    try {
      const skills = editSkillsInput
        .split(',')
        .map((s) => s.trim().toUpperCase().replace(/\s+/g, '_'))
        .filter(Boolean);

      const tools = editToolsInput
        .split(',')
        .map((t) => t.trim().toUpperCase().replace(/\s+/g, '_'))
        .filter(Boolean);

      const serviceAreas = editServiceAreasInput
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);

      const pincodes = editPincodesInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const radiusNum = Number(editRadiusInput);
      if (isNaN(radiusNum) || radiusNum <= 0) {
        setEditModalError('Coverage radius must be a positive number of kilometers');
        setIsEditSubmitting(false);
        return;
      }

      const updatePayload: any = {
        name: editName.trim(),
        phone: editPhone.trim(),
        email: editEmail.trim().toLowerCase(),
        experienceYears: Number(editExperienceYears),
        serviceTypes: editServiceTypes,
        skills,
        tools,
        serviceAreas,
        coverageRadiusKm: radiusNum,
        pincodes,
        availability: editAvailability,
        active: editActive,
      };

      if (editBaseAddress || editBaseLat || editBaseLng || editLocationObj) {
        let latNum = editLocationObj?.latitude ?? (editBaseLat ? parseFloat(editBaseLat) : undefined);
        let lngNum = editLocationObj?.longitude ?? (editBaseLng ? parseFloat(editBaseLng) : undefined);

        // Auto-geocode if missing or invalid [0, 0]
        if ((latNum === undefined || lngNum === undefined || (Math.abs(latNum) < 0.001 && Math.abs(lngNum) < 0.001)) && (editBaseAddress || serviceAreas.length > 0)) {
          const query = editBaseAddress || serviceAreas[0];
          try {
            const geocoded = await geocodeAddressOrCity(query);
            if (geocoded) {
              latNum = geocoded.latitude;
              lngNum = geocoded.longitude;
              setEditBaseLat(String(latNum));
              setEditBaseLng(String(lngNum));
            }
          } catch (e) {
            console.warn('Geocoding tech base location failed:', e);
          }
        }

        updatePayload.baseLocation = {
          placeId: editLocationObj?.placeId || (editingTech?.baseLocation as any)?.placeId,
          formattedAddress: editLocationObj?.formattedAddress || editBaseAddress.trim() || undefined,
          city: editLocationObj?.city || editBaseAddress.trim() || undefined,
          area: editLocationObj?.area || (editingTech?.baseLocation as any)?.area,
          state: editLocationObj?.state || (editingTech?.baseLocation as any)?.state,
          country: editLocationObj?.country || (editingTech?.baseLocation as any)?.country || 'India',
          postalCode: editLocationObj?.pincode || (pincodes.length > 0 ? pincodes[0] : undefined),
          latitude: latNum !== undefined && !isNaN(latNum) ? latNum : undefined,
          longitude: lngNum !== undefined && !isNaN(lngNum) ? lngNum : undefined,
        };
      }

      await apiClient.patch(`/technicians/${editingTech._id}`, updatePayload);

      setIsEditModalOpen(false);
      setEditingTech(null);
      setTechnicianSuccessMessage(`Technician ${editName} profile updated successfully.`);
      setTimeout(() => setTechnicianSuccessMessage(null), 4000);
      await loadTechnicians();
    } catch (err: any) {
      console.error('Failed to update technician:', err);
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        err.message ||
        'Failed to update technician profile';
      setEditModalError(errMsg);
    } finally {
      setIsEditSubmitting(false);
    }
  };

  const handleToggleActive = async (tech: Technician) => {
    try {
      const nextActive = !tech.active;
      await apiClient.patch(`/technicians/${tech._id}`, { active: nextActive });
      await loadTechnicians();
    } catch (err: any) {
      alert(`Failed to toggle technician status: ${err.message}`);
    }
  };

  const handleToggleEditServiceType = (st: ServiceType) => {
    if (editServiceTypes.includes(st)) {
      if (editServiceTypes.length > 1) {
        setEditServiceTypes(editServiceTypes.filter((t) => t !== st));
      }
    } else {
      setEditServiceTypes([...editServiceTypes, st]);
    }
  };

  const openViewModal = (tech: Technician) => {
    setViewingTech(tech);
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
          id="add-technician-btn"
          onClick={() => {
            setModalError(null);
            setGpsFeedbackAdd(null);
            setIsAddModalOpen(true);
          }}
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

      {technicianSuccessMessage && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-bold">{technicianSuccessMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setTechnicianSuccessMessage(null)}
            className="text-emerald-600 hover:text-emerald-800 font-bold"
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

              {/* Service Areas & Coverage */}
              <div className="pt-3 border-t border-slate-100 space-y-1.5 text-[11px]">
                <div className="flex items-center justify-between text-slate-500">
                  <span className="font-semibold">Coverage:</span>
                  <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    {tech.coverageRadiusKm ?? 20} km radius
                  </span>
                </div>
                <div className="flex items-center justify-between text-slate-500">
                  <span>Areas:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[180px]">
                    {tech.serviceAreas && tech.serviceAreas.length > 0 ? tech.serviceAreas.join(', ') : 'None assigned'}
                  </span>
                </div>
                {tech.pincodes && tech.pincodes.length > 0 && (
                  <div className="flex items-center justify-between text-slate-500">
                    <span>Pincodes:</span>
                    <span className="font-medium text-slate-700 truncate max-w-[180px]">
                      {tech.pincodes.join(', ')}
                    </span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500 font-semibold">Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    tech.active !== false
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {tech.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Action Buttons: View, Edit, Activate/Deactivate */}
              <div className="pt-3 border-t border-slate-100 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openViewModal(tech)}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                  View
                </button>
                <button
                  type="button"
                  onClick={() => openEditModal(tech)}
                  className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-600" />
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleActive(tech)}
                  className={`inline-flex items-center justify-center p-1.5 rounded-xl border text-xs font-semibold transition-colors ${
                    tech.active !== false
                      ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  }`}
                  title={tech.active !== false ? 'Deactivate Technician' : 'Activate Technician'}
                >
                  <Power className="w-3.5 h-3.5" />
                </button>
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
                id="tech-add-name"
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
                id="tech-add-phone"
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
                id="tech-add-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="technician@company.com"
                className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Temporary Password *</label>
              <input
                id="tech-add-password"
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
                id="tech-add-confirm-password"
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
            <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="tech-add-solar-checkbox"
                  type="checkbox"
                  checked={serviceTypes.includes('SOLAR')}
                  onChange={() => handleToggleServiceType('SOLAR')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">Solar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="tech-add-ac-checkbox"
                  type="checkbox"
                  checked={serviceTypes.includes('AC')}
                  onChange={() => handleToggleServiceType('AC')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">AC / HVAC</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="tech-add-plumbing-checkbox"
                  type="checkbox"
                  checked={serviceTypes.includes('PLUMBING')}
                  onChange={() => handleToggleServiceType('PLUMBING')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">Plumbing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="tech-add-homemaintenance-checkbox"
                  type="checkbox"
                  checked={serviceTypes.includes('HOME_MAINTENANCE')}
                  onChange={() => handleToggleServiceType('HOME_MAINTENANCE')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">Home Maintenance / Civil</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  id="tech-add-electrical-checkbox"
                  type="checkbox"
                  checked={serviceTypes.includes('ELECTRICAL')}
                  onChange={() => handleToggleServiceType('ELECTRICAL')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">Electrical</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
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
              <label className="block font-bold text-slate-700 mb-1">Coverage Radius (km)</label>
              <input
                id="tech-add-radius"
                type="number"
                min="1"
                value={radiusInput}
                onChange={(e) => setRadiusInput(e.target.value)}
                placeholder="25"
                className="w-full border border-slate-300 rounded-xl p-2 font-bold text-emerald-800"
              />
            </div>
          </div>

          {/* Base Location & Coverage Center */}
          <div className="p-3.5 bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
                Operating City & Base Coverage Center
              </span>
              <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                Auto-covers {radiusInput || 25}km region
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              The technician will cover all customer requests, villages, and localities within <strong>{radiusInput || 25} km</strong> of this center.
            </p>
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                Coverage Location (Autocomplete Search) *
              </label>
              <LocationAutocompleteInput
                value={baseAddress}
                placeholder="Search any locality, hub, city, or area..."
                onSelect={(loc) => {
                  setAddLocationObj(loc);
                  setBaseAddress(loc.formattedAddress || loc.city);
                  if (loc.latitude) setBaseLat(String(loc.latitude));
                  if (loc.longitude) setBaseLng(String(loc.longitude));
                  if (loc.pincode && !pincodesInput) setPincodesInput(loc.pincode);
                  if (!serviceAreasInput) {
                    setServiceAreasInput(loc.area ? `${loc.area}, ${loc.city}` : loc.city);
                  }
                }}
              />
            </div>

            {baseLat && baseLng ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100/80 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Confirmed Coordinates:</span>
                <span className="font-mono text-[11px]">{Number(baseLat).toFixed(4)}° N, {Number(baseLng).toFixed(4)}° E</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Select from autocomplete to attach authoritative real coordinates.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Center Latitude
                </label>
                <input
                  id="tech-add-base-lat"
                  type="number"
                  step="any"
                  value={baseLat}
                  onChange={(e) => setBaseLat(e.target.value)}
                  placeholder="e.g. 23.0225"
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Center Longitude
                </label>
                <input
                  id="tech-add-base-lng"
                  type="number"
                  step="any"
                  value={baseLng}
                  onChange={(e) => setBaseLng(e.target.value)}
                  placeholder="e.g. 72.5714"
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAutoGeocodeAdd}
                disabled={isGeocodingAddLocation || isFetchingGpsAdd || (!baseAddress && !serviceAreasInput)}
                className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isGeocodingAddLocation ? <Loader2 className="w-3 h-3 animate-spin text-indigo-600" /> : <Sparkles className="w-3 h-3 text-indigo-600" />}
                <span>{isGeocodingAddLocation ? 'Geocoding...' : '⚡ Auto-Geocode Coordinates'}</span>
              </button>
              <button
                type="button"
                onClick={handleUseGpsForAdd}
                disabled={isFetchingGpsAdd || isGeocodingAddLocation}
                className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isFetchingGpsAdd ? <Loader2 className="w-3 h-3 animate-spin text-slate-600" /> : <Compass className="w-3 h-3 text-slate-600" />}
                <span>{isFetchingGpsAdd ? 'Locating via GPS...' : '📍 Use Live GPS'}</span>
              </button>
            </div>
            {gpsFeedbackAdd && (
              <p className={`text-[11px] font-medium pt-1 ${gpsFeedbackAdd.type === 'error' ? 'text-red-600' : gpsFeedbackAdd.type === 'success' ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                {gpsFeedbackAdd.text}
              </p>
            )}
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Service Areas (comma separated)
              </label>
              <input
                id="tech-add-areas"
                type="text"
                value={serviceAreasInput}
                onChange={(e) => setServiceAreasInput(e.target.value)}
                placeholder="e.g. Rajkot, Kalawad Road"
                className="w-full border border-slate-300 rounded-xl p-2"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pincodes (comma separated)
              </label>
              <input
                id="tech-add-pincodes"
                type="text"
                value={pincodesInput}
                onChange={(e) => setPincodesInput(e.target.value)}
                placeholder="e.g. 360001, 360005"
                className="w-full border border-slate-300 rounded-xl p-2"
              />
            </div>
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
              id="tech-add-submit-btn"
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Add Technician'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: Edit Technician */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingTech(null);
        }}
        title={`Edit Technician: ${editingTech?.name || ''}`}
        maxWidth="lg"
      >
        <form onSubmit={handleUpdateTechnician} className="space-y-4 text-xs">
          {editModalError && (
            <div className="p-3 bg-red-50 text-red-700 border border-red-200 rounded-xl">
              {editModalError}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Full Name *</label>
              <input
                type="text"
                required
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address *</label>
              <input
                type="email"
                required
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                required
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                className="w-full border border-slate-300 rounded-xl p-2 focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Experience Years</label>
              <input
                type="number"
                min="0"
                value={editExperienceYears}
                onChange={(e) => setEditExperienceYears(parseInt(e.target.value, 10))}
                className="w-full border border-slate-300 rounded-xl p-2"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Coverage Radius (km) *</label>
              <input
                type="number"
                min="1"
                required
                value={editRadiusInput}
                onChange={(e) => setEditRadiusInput(e.target.value)}
                placeholder="20"
                className="w-full border border-slate-300 rounded-xl p-2"
              />
            </div>
          </div>

          {/* Base Location & Real Coordinates */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
                Base Location & Center Coordinates
              </span>
              <span className="text-[10px] text-slate-400 font-medium">Used for live distance calculation</span>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">Coverage Location (Autocomplete Search)</label>
              <LocationAutocompleteInput
                value={editBaseAddress}
                placeholder="Search any locality, hub, city, or area..."
                onSelect={(loc) => {
                  setEditLocationObj(loc);
                  setEditBaseAddress(loc.formattedAddress || loc.city);
                  if (loc.latitude) setEditBaseLat(String(loc.latitude));
                  if (loc.longitude) setEditBaseLng(String(loc.longitude));
                  if (loc.pincode && !editPincodesInput) setEditPincodesInput(loc.pincode);
                  if (!editServiceAreasInput) {
                    setEditServiceAreasInput(loc.area ? `${loc.area}, ${loc.city}` : loc.city);
                  }
                }}
              />
            </div>

            {editBaseLat && editBaseLng ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-100/80 border border-emerald-200 rounded-lg text-xs text-emerald-800">
                <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span className="font-semibold">Confirmed Coordinates:</span>
                <span className="font-mono text-[11px]">{Number(editBaseLat).toFixed(4)}° N, {Number(editBaseLng).toFixed(4)}° E</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                <span>Select from autocomplete to attach authoritative real coordinates.</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={editBaseLat}
                  onChange={(e) => setEditBaseLat(e.target.value)}
                  placeholder="e.g. 23.0225"
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white font-mono text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={editBaseLng}
                  onChange={(e) => setEditBaseLng(e.target.value)}
                  placeholder="e.g. 72.5714"
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white font-mono text-xs"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleAutoGeocodeEdit}
                disabled={isGeocodingEditLocation || isFetchingGpsEdit || (!editBaseAddress && !editServiceAreasInput)}
                className="px-2.5 py-1 text-[11px] font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isGeocodingEditLocation ? <Loader2 className="w-3 h-3 animate-spin text-indigo-600" /> : <Sparkles className="w-3 h-3 text-indigo-600" />}
                <span>{isGeocodingEditLocation ? 'Geocoding...' : '⚡ Auto-Geocode Coordinates'}</span>
              </button>
              <button
                type="button"
                onClick={handleUseGpsForEdit}
                disabled={isFetchingGpsEdit || isGeocodingEditLocation}
                className="px-2.5 py-1 text-[11px] font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg border border-slate-300 transition-colors flex items-center gap-1 disabled:opacity-50"
              >
                {isFetchingGpsEdit ? <Loader2 className="w-3 h-3 animate-spin text-slate-600" /> : <Compass className="w-3 h-3 text-slate-600" />}
                <span>{isFetchingGpsEdit ? 'Locating via GPS...' : '📍 Use Live GPS'}</span>
              </button>
            </div>
            {gpsFeedbackEdit && (
              <p className={`text-[11px] font-medium pt-1 ${gpsFeedbackEdit.type === 'error' ? 'text-red-600' : gpsFeedbackEdit.type === 'success' ? 'text-emerald-700 font-semibold' : 'text-slate-600'}`}>
                {gpsFeedbackEdit.text}
              </p>
            )}
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Certified Service Capabilities *
            </label>
            <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editServiceTypes.includes('SOLAR')}
                  onChange={() => handleToggleEditServiceType('SOLAR')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">Solar</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editServiceTypes.includes('AC')}
                  onChange={() => handleToggleEditServiceType('AC')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">AC / HVAC</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editServiceTypes.includes('PLUMBING')}
                  onChange={() => handleToggleEditServiceType('PLUMBING')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">Plumbing</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editServiceTypes.includes('HOME_MAINTENANCE')}
                  onChange={() => handleToggleEditServiceType('HOME_MAINTENANCE')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">Home Maintenance / Civil</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editServiceTypes.includes('ELECTRICAL')}
                  onChange={() => handleToggleEditServiceType('ELECTRICAL')}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-bold text-slate-800">Electrical</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Skills (comma separated)
            </label>
            <input
              type="text"
              value={editSkillsInput}
              onChange={(e) => setEditSkillsInput(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Assigned Tools (comma separated)
            </label>
            <input
              type="text"
              value={editToolsInput}
              onChange={(e) => setEditToolsInput(e.target.value)}
              className="w-full border border-slate-300 rounded-xl p-2"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Service Areas (comma separated)
              </label>
              <input
                type="text"
                value={editServiceAreasInput}
                onChange={(e) => setEditServiceAreasInput(e.target.value)}
                placeholder="e.g. Rajkot, Gondal"
                className="w-full border border-slate-300 rounded-xl p-2"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Pincodes (comma separated)
              </label>
              <input
                type="text"
                value={editPincodesInput}
                onChange={(e) => setEditPincodesInput(e.target.value)}
                placeholder="e.g. 360001, 360005"
                className="w-full border border-slate-300 rounded-xl p-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Dispatch Availability</label>
              <select
                value={editAvailability}
                onChange={(e) => setEditAvailability(e.target.value as any)}
                className="w-full border border-slate-300 rounded-xl p-2 bg-white"
              >
                <option value="AVAILABLE">AVAILABLE</option>
                <option value="BUSY">BUSY</option>
                <option value="OFFLINE">OFFLINE</option>
              </select>
            </div>
            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editActive}
                  onChange={(e) => setEditActive(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                />
                <span className="font-bold text-slate-800">Technician Active</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsEditModalOpen(false);
                setEditingTech(null);
              }}
              className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isEditSubmitting}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold disabled:opacity-50"
            >
              {isEditSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL: View Technician */}
      <Modal
        isOpen={!!viewingTech}
        onClose={() => setViewingTech(null)}
        title={viewingTech?.name || 'Technician Profile'}
        maxWidth="md"
      >
        {viewingTech && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <p className="text-sm font-bold text-slate-900">{viewingTech.name}</p>
                <p className="text-slate-500">{viewingTech.email}</p>
                <p className="text-slate-500">{viewingTech.phone}</p>
              </div>
              <div className="text-right space-y-1">
                <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                  viewingTech.availability === 'AVAILABLE'
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                    : viewingTech.availability === 'BUSY'
                    ? 'bg-amber-50 text-amber-700 border border-amber-300'
                    : 'bg-slate-100 text-slate-600 border border-slate-300'
                }`}>
                  {viewingTech.availability}
                </span>
                <div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    viewingTech.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {viewingTech.active !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Service Capabilities & Experience
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {viewingTech.serviceTypes.map((st) => (
                  <span
                    key={st}
                    className={`text-[10px] font-bold px-2.5 py-1 rounded-md ${
                      st === 'SOLAR'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'bg-sky-100 text-sky-900 border border-sky-200'
                    }`}
                  >
                    {st === 'SOLAR' ? 'Solar Photovoltaic' : 'Air Conditioning / HVAC'}
                  </span>
                ))}
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-md">
                  {viewingTech.experienceYears} Years Experience
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Coverage & Operating Radius
              </h4>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Coverage Radius:</span>
                  <span className="font-bold text-slate-800">{viewingTech.coverageRadiusKm ?? 20} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned Areas:</span>
                  <span className="font-medium text-slate-800">
                    {viewingTech.serviceAreas && viewingTech.serviceAreas.length > 0
                      ? viewingTech.serviceAreas.join(', ')
                      : 'None specified'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Pincodes:</span>
                  <span className="font-medium text-slate-800">
                    {viewingTech.pincodes && viewingTech.pincodes.length > 0
                      ? viewingTech.pincodes.join(', ')
                      : 'All within coverage radius'}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Skills
              </h4>
              <div className="flex flex-wrap gap-1">
                {viewingTech.skills.map((s, idx) => (
                  <span key={idx} className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                    {s.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Equipped Tools
              </h4>
              <div className="flex flex-wrap gap-1">
                {viewingTech.tools.map((t, idx) => (
                  <span key={idx} className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                    {t.replace(/_/g, ' ')}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const tech = viewingTech;
                  setViewingTech(null);
                  openEditModal(tech);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold"
              >
                Edit Technician
              </button>
              <button
                type="button"
                onClick={() => setViewingTech(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
