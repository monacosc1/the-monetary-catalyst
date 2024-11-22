'use client'

import { useState } from 'react';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    onSearch(term);
  };

  return (
    <input 
      type="search" 
      placeholder="Search articles..." 
      className="w-full p-2 border rounded"
      value={searchTerm}
      onChange={handleSearch}
    />
  );
} 