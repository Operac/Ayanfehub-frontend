import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import nigerianStates from '../data/nigerianStates';

interface Props {
  /** Called when both a state and LGA are selected */
  onSelect: (state: string, lga: string) => void;
  /** Optional: pre-select a state by name */
  defaultState?: string;
  /** Optional: pre-select an LGA by name */
  defaultLga?: string;
  /** Input visual style: 'default' uses the site's base input style */
  className?: string;
}

const base =
  'w-full p-3.5 bg-surface border border-gray-200 rounded-2xl text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all';

export default function StateCitySelect({
  onSelect,
  defaultState = '',
  defaultLga = '',
  className = '',
}: Props) {
  const [selectedState, setSelectedState] = useState(defaultState);
  const [selectedLga, setSelectedLga] = useState(defaultLga);

  const stateData = nigerianStates.find(s => s.name === selectedState);
  const lgas = stateData?.lgas ?? [];

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    setSelectedLga('');
    // Don't call onSelect yet — wait for LGA selection
  };

  const handleLgaChange = (lga: string) => {
    setSelectedLga(lga);
    if (selectedState && lga) {
      onSelect(selectedState, lga);
    }
  };

  const wrapClass = `relative ${className}`;

  return (
    <div className="space-y-3">
      {/* State */}
      <div className={wrapClass}>
        <select
          value={selectedState}
          onChange={e => handleStateChange(e.target.value)}
          className={`${base} pr-10`}
          aria-label="Select state"
        >
          <option value="">Select state…</option>
          {nigerianStates.map(s => (
            <option key={s.code} value={s.name}>
              {s.name}
            </option>
          ))}
        </select>
        <ChevronDown
          size={15}
          className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
      </div>

      {/* LGA / City — only shown after state is chosen */}
      {selectedState && (
        <div className={wrapClass}>
          <select
            value={selectedLga}
            onChange={e => handleLgaChange(e.target.value)}
            className={`${base} pr-10`}
            aria-label="Select LGA / city"
          >
            <option value="">Select LGA / city…</option>
            {lgas.map(lga => (
              <option key={lga} value={lga}>
                {lga}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
        </div>
      )}
    </div>
  );
}
