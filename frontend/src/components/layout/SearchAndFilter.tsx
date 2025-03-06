"use client";

import { Search } from "lucide-react";
import { Dropdown } from "@/components/ui/dropdown";

interface SearchAndFilterProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  filter: string;
  onFilterChange: (value: string) => void;
  filterOptions: Array<{
    label: string;
    value: string;
  }>;
  extraActions?: React.ReactNode;
}

const categories = [
  { label: "All Categories", value: "all" },
  { label: "Developer Tools", value: "Developer Tools" },
  { label: "Productivity", value: "Productivity" },
  { label: "Design", value: "Design" },
  { label: "Testing", value: "Testing" },
  { label: "Analytics", value: "Analytics" },
  { label: "DevOps", value: "DevOps" },
  { label: "Security", value: "Security" },
  { label: "Database", value: "Database" },
];

export default function SearchAndFilter({
  placeholder = "Search...",
  value,
  onChange,
  filter,
  onFilterChange,
  filterOptions = [],
  extraActions
}: SearchAndFilterProps) {
  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
      <div className="relative flex-1 w-full min-w-0">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border bg-background focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm"
        />
      </div>
      <div className="w-full sm:w-[200px]">
        <Dropdown
          value={filter}
          onChange={onFilterChange}
          options={filterOptions}
          className="w-full"
        />
      </div>
      {extraActions && (
        <div className="w-full sm:w-auto sm:ml-auto flex flex-wrap gap-2">
          {extraActions}
        </div>
      )}
    </div>
  );
} 