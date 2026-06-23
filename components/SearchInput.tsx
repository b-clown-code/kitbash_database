/**
 * Search Input Component
 * Reusable search field with debouncing
 */

'use client';

import { useState, useCallback } from 'react';
import { debounce } from '@/lib/utils';

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  method?: 'global' | 'fuzzy' | 'alias';
  type?: 'figure' | 'part' | 'mold' | 'kitbash';
}

export default function SearchInput({
  onSearch,
  placeholder = 'Search...',
  method = 'global',
  type,
}: SearchInputProps) {
  const [value, setValue] = useState('');

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      if (query.length >= 2) {
        onSearch(query);
      }
    }, 300),
    [onSearch]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setValue('');
  };

  return (
    <div className="relative w-full">
      <input
        type="text"
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      {value && (
        <button
          onClick={handleClear}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
          aria-label="Clear search"
        >
          ✕
        </button>
      )}
    </div>
  );
}
