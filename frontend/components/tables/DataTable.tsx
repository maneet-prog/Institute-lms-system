"use client";

import { ReactNode, useMemo, useState } from "react";

interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (row: T) => ReactNode;
  filterable?: boolean;
  searchable?: boolean;
  getFilterValue?: (row: T) => string;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  rowKey: (row: T) => string;
  initialPageSize?: number;
}

const PAGE_SIZES = [5, 10, 20, 50];

export function DataTable<T>({ rows, columns, rowKey, initialPageSize = 10 }: Props<T>) {
  const [globalSearch, setGlobalSearch] = useState("");
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [page, setPage] = useState(1);
  const [columnFilters, setColumnFilters] = useState<Record<string, string>>({});

  const normalizedColumns = useMemo(
    () =>
      columns.map((column) => ({
        ...column,
        filterable: column.filterable ?? column.key !== "actions",
        searchable: column.searchable ?? column.key !== "actions"
      })),
    [columns]
  );

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchesGlobal = !globalSearch.trim()
        ? true
        : normalizedColumns
            .filter((column) => column.searchable)
            .some((column) => {
              const value = column.getFilterValue
                ? column.getFilterValue(row)
                : String(row[column.key as keyof T] ?? "");
              return value.toLowerCase().includes(globalSearch.trim().toLowerCase());
            });

      if (!matchesGlobal) {
        return false;
      }

      return normalizedColumns.every((column) => {
        if (!column.filterable) {
          return true;
        }
        const filterValue = columnFilters[String(column.key)]?.trim().toLowerCase();
        if (!filterValue) {
          return true;
        }
        const rowValue = column.getFilterValue
          ? column.getFilterValue(row)
          : String(row[column.key as keyof T] ?? "");
        return rowValue.toLowerCase().includes(filterValue);
      });
    });
  }, [columnFilters, globalSearch, normalizedColumns, rows]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const currentPage = Math.min(page, totalPages);

  const paginatedRows = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredRows.slice(start, start + pageSize);
  }, [currentPage, filteredRows, pageSize]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 md:flex-row md:items-end md:justify-between">
        <label className="block w-full max-w-md space-y-1">
          <span className="text-sm font-medium text-slate-700">Global Search</span>
          <input
            value={globalSearch}
            onChange={(event) => {
              setGlobalSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search across all visible columns"
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          />
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium text-slate-700">Rows Per Page</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none ring-brand-500 focus:ring-2"
          >
            {PAGE_SIZES.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="overflow-x-auto rounded-xl border bg-white">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-100 text-left text-slate-700">
          <tr>
            {normalizedColumns.map((column) => (
              <th key={column.header} className="px-4 py-3 font-semibold">
                {column.header}
              </th>
            ))}
          </tr>
          <tr className="border-t bg-white">
            {normalizedColumns.map((column) => (
              <th key={`${column.header}-filter`} className="px-4 py-3">
                {column.filterable ? (
                  <input
                    value={columnFilters[String(column.key)] ?? ""}
                    onChange={(event) => {
                      setColumnFilters((prev) => ({
                        ...prev,
                        [String(column.key)]: event.target.value
                      }));
                      setPage(1);
                    }}
                    placeholder={`Filter ${column.header}`}
                    className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-xs outline-none ring-brand-500 focus:ring-2"
                  />
                ) : (
                  <span className="text-xs text-slate-400">No filter</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedRows.map((row) => (
            <tr key={rowKey(row)} className="border-t">
              {normalizedColumns.map((column) => (
                <td key={column.header} className="px-4 py-3 align-top">
                  {column.render ? column.render(row) : String(row[column.key as keyof T] ?? "")}
                </td>
              ))}
            </tr>
          ))}
          {paginatedRows.length === 0 ? (
            <tr>
              <td className="px-4 py-8 text-center text-slate-500" colSpan={normalizedColumns.length}>
                No records found.
              </td>
            </tr>
          ) : null}
        </tbody>
      </table>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border bg-white p-4 text-sm text-slate-600 md:flex-row md:items-center md:justify-between">
        <p>
          Showing {(currentPage - 1) * pageSize + (paginatedRows.length ? 1 : 0)}-
          {(currentPage - 1) * pageSize + paginatedRows.length} of {filteredRows.length}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="rounded-md border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Previous
          </button>
          <span>
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            className="rounded-md border px-3 py-1.5 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
