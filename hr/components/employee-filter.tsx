"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Filter, X } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import type { Employee } from "@/app/hr/employees/data";

export interface FilterState {
  departments: string[];
  positions: string[];
  salaryRange: { min: number; max: number };
  joinDateRange: { start: string; end: string };
}

export interface EmployeeFilterProps {
  employees: Employee[];
  onFilterChange: (filteredEmployees: Employee[]) => void;
}

export function EmployeeFilter({
  employees,
  onFilterChange
}: EmployeeFilterProps) {
  const [filters, setFilters] = useState<FilterState>({
    departments: [],
    positions: [],
    salaryRange: { min: 0, max: 999999 },
    joinDateRange: { start: "", end: "" }
  });

  const [minSalary, setMinSalary] = useState("");
  const [maxSalary, setMaxSalary] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Get unique departments and positions
  const uniqueDepartments = useMemo(
    () => [...new Set(employees.map((emp) => emp.department))].sort(),
    [employees]
  );

  const uniquePositions = useMemo(
    () => [...new Set(employees.map((emp) => emp.position))].sort(),
    [employees]
  );

  // Apply filters and call onFilterChange
  const applyFilters = (currentFilters: FilterState) => {
    const filtered = employees.filter((emp) => {
      // Department filter
      if (
        filters.departments.length > 0 &&
        !filters.departments.includes(emp.department)
      ) {
        return false;
      }

      // Position filter
      if (
        filters.positions.length > 0 &&
        !filters.positions.includes(emp.position)
      ) {
        return false;
      }

      // Salary range filter
      if (
        emp.salary < filters.salaryRange.min ||
        emp.salary > filters.salaryRange.max
      ) {
        return false;
      }

      // Join date filter
      if (filters.joinDateRange.start) {
        const empJoinDate = new Date(emp.joinDate);
        const startFilterDate = new Date(filters.joinDateRange.start);
        if (empJoinDate < startFilterDate) {
          return false;
        }
      }

      if (filters.joinDateRange.end) {
        const empJoinDate = new Date(emp.joinDate);
        const endFilterDate = new Date(filters.joinDateRange.end);
        if (empJoinDate > endFilterDate) {
          return false;
        }
      }

      return true;
    });

    onFilterChange(filtered);
  };

  const toggleDepartment = (dept: string) => {
    setFilters((prev) => ({
      ...prev,
      departments: prev.departments.includes(dept)
        ? prev.departments.filter((d) => d !== dept)
        : [...prev.departments, dept]
    }));
  };

  const togglePosition = (pos: string) => {
    setFilters((prev) => ({
      ...prev,
      positions: prev.positions.includes(pos)
        ? prev.positions.filter((p) => p !== pos)
        : [...prev.positions, pos]
    }));
  };

  const handleSalaryRangeChange = () => {
    setFilters((prev) => ({
      ...prev,
      salaryRange: {
        min: minSalary ? parseInt(minSalary) : 0,
        max: maxSalary ? parseInt(maxSalary) : 999999
      }
    }));
  };

  const handleDateRangeChange = () => {
    setFilters((prev) => ({
      ...prev,
      joinDateRange: {
        start: startDate,
        end: endDate
      }
    }));
  };

  const resetFilters = () => {
    setFilters({
      departments: [],
      positions: [],
      salaryRange: { min: 0, max: 999999 },
      joinDateRange: { start: "", end: "" }
    });
    setMinSalary("");
    setMaxSalary("");
    setStartDate("");
    setEndDate("");
    onFilterChange(employees);
  };

  const hasActiveFilters =
    filters.departments.length > 0 ||
    filters.positions.length > 0 ||
    filters.salaryRange.min > 0 ||
    filters.salaryRange.max < 999999 ||
    filters.joinDateRange.start ||
    filters.joinDateRange.end;

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={hasActiveFilters ? "bg-blue-50" : ""}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filter
            {hasActiveFilters && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-semibold text-white bg-blue-500 rounded-full">
                {
                  [
                    ...filters.departments,
                    ...filters.positions,
                    ...(filters.salaryRange.min > 0 ||
                    filters.salaryRange.max < 999999
                      ? ["salary"]
                      : []),
                    ...(filters.joinDateRange.start || filters.joinDateRange.end
                      ? ["date"]
                      : [])
                  ].length
                }
              </span>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-80">
          {/* Department Filter */}
          <DropdownMenuLabel className="font-semibold">
            Department
          </DropdownMenuLabel>
          <div className="max-h-48 overflow-y-auto">
            {uniqueDepartments.map((dept) => (
              <DropdownMenuCheckboxItem
                key={dept}
                checked={filters.departments.includes(dept)}
                onCheckedChange={() => toggleDepartment(dept)}
              >
                {dept}
              </DropdownMenuCheckboxItem>
            ))}
          </div>

          <DropdownMenuSeparator />

          {/* Position Filter */}
          <DropdownMenuLabel className="font-semibold">
            Position
          </DropdownMenuLabel>
          <div className="max-h-48 overflow-y-auto">
            {uniquePositions.map((pos) => (
              <DropdownMenuCheckboxItem
                key={pos}
                checked={filters.positions.includes(pos)}
                onCheckedChange={() => togglePosition(pos)}
              >
                {pos}
              </DropdownMenuCheckboxItem>
            ))}
          </div>

          <DropdownMenuSeparator />

          {/* Salary Range Filter */}
          <div className="px-2 py-1.5">
            <DropdownMenuLabel className="font-semibold mb-2">
              Salary Range
            </DropdownMenuLabel>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="Min"
                value={minSalary}
                onChange={(e) => setMinSalary(e.target.value)}
                className="h-8"
              />
              <Input
                type="number"
                placeholder="Max"
                value={maxSalary}
                onChange={(e) => setMaxSalary(e.target.value)}
                className="h-8"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-2 h-8"
              onClick={handleSalaryRangeChange}
            >
              Apply
            </Button>
          </div>

          <DropdownMenuSeparator />

          {/* Join Date Filter */}
          <div className="px-2 py-1.5">
            <DropdownMenuLabel className="font-semibold mb-2">
              Join Date Range
            </DropdownMenuLabel>
            <div className="flex flex-col gap-2">
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8"
              />
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8"
              />
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="w-full mt-2 h-8"
              onClick={handleDateRangeChange}
            >
              Apply
            </Button>
          </div>

          <DropdownMenuSeparator />

          {/* Reset Button */}
          {hasActiveFilters && (
            <div className="px-2 py-1.5">
              <Button
                size="sm"
                variant="destructive"
                className="w-full h-8"
                onClick={resetFilters}
              >
                <X className="w-4 h-4 mr-2" />
                Clear Filters
              </Button>
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
