"use client"
import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import useDebounce from '@/hooks/use-debounce';

interface EmployeeFiltersProps {
  filters: {
    search: string;
    section: string | null;
    status: string | null;
  };
  onChange: (filters: {
    search: string;
    section: string | null;
    status: string | null;
  }) => void;
}

const EmployeeFilters: React.FC<EmployeeFiltersProps> = ({ filters, onChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);
  const debouncedSearch = useDebounce(localFilters.search, 500);

  useEffect(() => {
    onChange({ ...localFilters, search: debouncedSearch });
  }, [debouncedSearch]);

  const handleChange = (field: keyof typeof localFilters, value: string | null) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));

    // For non-search fields, update immediately
    if (field !== 'search') {
      onChange({ ...localFilters, [field]: value });
    }
  };

  const handleReset = () => {
    const resetFilters = { search: '', section: null, status: null };
    setLocalFilters(resetFilters);
    onChange(resetFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-800 dark:bg-[#0D0D0D]">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Input
            placeholder="Search employees..."
            value={localFilters.search}
            onChange={(e) => handleChange('search', e.target.value)}
          />
        </div>

        <div>
          <Select
            value={localFilters.section ?? ""}
            onValueChange={(value) => handleChange('section', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Departments" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="it">IT</SelectItem>
              <SelectItem value="hr">Human Resources</SelectItem>
              <SelectItem value="finance">Finance</SelectItem>
              <SelectItem value="marketing">Marketing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Select
            value={localFilters.status ?? ""}
            onValueChange={(value) => handleChange('status', value || null)}
          >
            <SelectTrigger>
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="on-leave">On Leave</SelectItem>
              <SelectItem value="terminated">Terminated</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-end">
          <Button variant="outline" onClick={handleReset}>
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeFilters;