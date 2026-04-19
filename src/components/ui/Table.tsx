"use client";

import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface TableColumn<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  width?: string;
  align?: "left" | "center" | "right";
  className?: string;
}

interface TableProps<T> {
  columns: TableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  dense?: boolean;
}

export function Table<T>({ columns, rows, rowKey, onRowClick, emptyMessage = "No records.", dense = false }: TableProps<T>) {
  if (!rows.length) {
    return (
      <div className="border border-gray-200 p-8 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    );
  }
  return (
    <div className="overflow-x-auto border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  "px-4 py-3 font-semibold text-gray-700 text-xs uppercase tracking-wider",
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                  col.className
                )}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={() => onRowClick?.(row)}
              className={cn(
                "border-b border-gray-100 last:border-b-0",
                onRowClick && "cursor-pointer hover:bg-gray-50 transition-colors"
              )}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={cn(
                    dense ? "px-4 py-2" : "px-4 py-3",
                    col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                    col.className
                  )}
                >
                  {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
