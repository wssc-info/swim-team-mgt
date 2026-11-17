'use client';

import { useState, useRef, useEffect } from 'react';

interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  options: ComboboxOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  emptyLabel?: string;
  className?: string;
}

export function Combobox({
  options,
  value,
  onChange,
  placeholder = 'Select...',
  disabled = false,
  emptyLabel = 'None',
  className = '',
}: ComboboxProps) {
  const allOptions = emptyLabel ? [{ value: '', label: emptyLabel }, ...options] : options;
  const selectedLabel = allOptions.find(o => o.value === value)?.label ?? '';

  const [inputText, setInputText] = useState(selectedLabel);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Keep input text in sync when value changes externally
  useEffect(() => {
    setInputText(allOptions.find(o => o.value === value)?.label ?? '');
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const isFiltering = inputText !== '' && inputText !== selectedLabel;
  const filtered = isFiltering
    ? allOptions.filter(o => o.label.toLowerCase().includes(inputText.toLowerCase()))
    : allOptions;

  const handleSelect = (opt: ComboboxOption) => {
    onChange(opt.value);
    setInputText(opt.label);
    setOpen(false);
  };

  const handleBlur = () => {
    // Revert to the current valid selection if the typed text doesn't match
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setInputText(allOptions.find(o => o.value === value)?.label ?? '');
        setOpen(false);
      }
    }, 150);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!containerRef.current?.contains(e.target as Node)) {
        setInputText(allOptions.find(o => o.value === value)?.label ?? '');
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const handleClear = () => {
    onChange('');
    setInputText('');
    setOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <input
        type="text"
        value={inputText}
        disabled={disabled}
        placeholder={placeholder}
        onChange={e => {
          setInputText(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        className="w-full px-3 py-2 pr-8 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed text-sm"
      />
      {value && !disabled && (
        <button
          type="button"
          onMouseDown={e => { e.preventDefault(); handleClear(); }}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear"
        >
          ✕
        </button>
      )}
      {open && !disabled && filtered.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-56 overflow-y-auto text-sm">
          {filtered.map(opt => (
            <li
              key={opt.value}
              onMouseDown={() => handleSelect(opt)}
              className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${opt.value === value ? 'bg-blue-100 font-medium' : ''}`}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
      {open && !disabled && filtered.length === 0 && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg px-3 py-2 text-sm text-gray-500">
          No matches
        </div>
      )}
    </div>
  );
}
