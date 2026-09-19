import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, X, Check } from 'lucide-react';
import { searchLocations, StructuredLocationSuggestion } from '../../utils/locationSearch';
import { CustomerLocation } from '../../utils/customerLocation';

interface LocationAutocompleteInputProps {
  value?: string;
  placeholder?: string;
  cityContext?: string;
  onSelect: (location: CustomerLocation) => void;
  className?: string;
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  value = '',
  placeholder = 'Type area or city (e.g. Bopal, Maninagar, Kalavad Road)...',
  cityContext,
  onSelect,
  className = '',
}) => {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState<StructuredLocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSuggestions([]);
      setIsLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      const results = await searchLocations(query, cityContext);
      setSuggestions(results);
      setIsLoading(false);
      setIsOpen(results.length > 0);
      setSelectedIndex(-1);
    }, 280);

    return () => clearTimeout(timer);
  }, [query, cityContext]);

  const handleSelectSuggestion = (s: StructuredLocationSuggestion) => {
    setQuery(s.formattedAddress);
    setIsOpen(false);
    setSuggestions([]);
    onSelect({
      city: s.city,
      state: s.state,
      country: s.country,
      area: s.area,
      pincode: s.pincode,
      latitude: s.latitude,
      longitude: s.longitude,
      formattedAddress: s.formattedAddress,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
        handleSelectSuggestion(suggestions[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div className="relative flex items-center">
        <MapPin className="w-4 h-4 text-emerald-600 absolute left-3 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 text-xs border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none bg-white text-slate-800 shadow-2xs font-medium"
        />
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin absolute right-3 pointer-events-none" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setIsOpen(false);
            }}
            className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600"
          >
            <X className="w-3 h-3" />
          </button>
        ) : null}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
          <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50">
            Select Verified Location
          </div>
          {suggestions.map((s, idx) => (
            <button
              type="button"
              key={idx}
              onClick={() => handleSelectSuggestion(s)}
              className={`w-full px-3 py-2.5 text-left text-xs flex items-center justify-between gap-2 hover:bg-emerald-50/70 transition-colors ${
                selectedIndex === idx ? 'bg-emerald-50 text-emerald-900 font-semibold' : 'text-slate-700'
              }`}
            >
              <div className="flex items-start gap-2 min-w-0">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="truncate">
                  <div className="font-bold text-slate-900 text-xs truncate">
                    {s.area ? `${s.area}, ${s.city}` : s.city}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {s.state}{s.pincode ? ` — Pincode: ${s.pincode}` : ''}
                  </div>
                </div>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-mono shrink-0">
                Select
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
