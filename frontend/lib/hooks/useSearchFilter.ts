"use client";

import { useState, useEffect, useMemo } from "react";

export type SearchKeyExtractor<T> = keyof T | ((item: T) => string | number | boolean | null | undefined);

export interface UseSearchFilterOptions<T> {
  items: T[];
  searchKeys?: SearchKeyExtractor<T>[];
  debounceMs?: number;
  initialQuery?: string;
  customFilter?: (item: T, debouncedQuery: string) => boolean;
}

export function useSearchFilter<T>({
  items = [],
  searchKeys = [],
  debounceMs = 250,
  initialQuery = "",
  customFilter,
}: UseSearchFilterOptions<T>) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (query !== debouncedQuery) {
      setIsDebouncing(true);
    }
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
      setIsDebouncing(false);
    }, debounceMs);

    return () => clearTimeout(handler);
  }, [query, debounceMs, debouncedQuery]);

  const filteredItems = useMemo(() => {
    if (!items || !Array.isArray(items)) return [];

    const trimmed = debouncedQuery.trim().toLowerCase();

    return items.filter((item) => {
      // Apply custom predicate first if supplied
      if (customFilter && !customFilter(item, trimmed)) {
        return false;
      }

      // If search query is empty, it passes search matching
      if (!trimmed) return true;

      // If explicit search keys/functions provided
      if (searchKeys.length > 0) {
        return searchKeys.some((key) => {
          let val: unknown;
          if (typeof key === "function") {
            val = key(item);
          } else {
            val = item[key];
          }
          if (val === null || val === undefined) return false;
          return String(val).toLowerCase().includes(trimmed);
        });
      }

      // Default matching against all string/number properties
      return Object.values(item as Record<string, unknown>).some((val) => {
        if (typeof val === "string" || typeof val === "number") {
          return String(val).toLowerCase().includes(trimmed);
        }
        return false;
      });
    });
  }, [items, debouncedQuery, customFilter, searchKeys]);

  const clearQuery = () => {
    setQuery("");
    setDebouncedQuery("");
  };

  return {
    query,
    setQuery,
    debouncedQuery,
    isDebouncing,
    filteredItems,
    totalCount: items?.length ?? 0,
    shownCount: filteredItems.length,
    hasResults: filteredItems.length > 0,
    isFiltered: Boolean(query.trim()),
    clearQuery,
  };
}
