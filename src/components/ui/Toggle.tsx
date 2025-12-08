import React from 'react';

interface ToggleProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
}

export const Toggle: React.FC<ToggleProps> = ({ checked, onChange }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`w-12 h-6 rounded-full p-1 transition ${checked ? 'bg-emerald-500' : 'bg-gray-600'}`}
    aria-pressed={checked}
    role="switch"
  >
    <span className="sr-only">Toggle</span>
    <div className={`h-4 w-4 bg-white rounded-full transition transform ${checked ? 'translate-x-6' : 'translate-x-0'}`} />
  </button>
);