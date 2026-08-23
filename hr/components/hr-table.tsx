"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import React from "react";

export interface ColumnDef<T> {
  accessorKey?: keyof T;
  header: string;
  cell?: (data: T) => React.ReactNode;
  id?: string;
}

export interface HRTableProps<T> {
  columns: ColumnDef<T>[];
  data: T[];
}

export function HRTable<T extends Record<string, any>>({
  columns,
  data
}: HRTableProps<T>) {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No data available</p>
      </div>
    );
  }

  const getCellValue = (row: T, column: ColumnDef<T>) => {
    if (column.cell) {
      return column.cell(row);
    }
    if (column.accessorKey) {
      return row[column.accessorKey];
    }
    return null;
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50 dark:bg-gray-900">
            {columns.map((column) => (
              <TableHead
                key={column.id || column.header}
                className="font-semibold"
              >
                {column.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow
              key={idx}
              className="hover:bg-gray-50 dark:hover:bg-gray-900"
            >
              {columns.map((column) => (
                <TableCell key={column.id || column.header}>
                  {getCellValue(row, column)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
