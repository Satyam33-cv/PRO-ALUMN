"use client";

import { useCallback, useEffect, useState } from "react";
import { ApiError } from "@/lib/api";

type CacheEntry<T> = {
  data?: T;
  error?: ApiError;
  updatedAt: number;
  listeners: Set<() => void>;
  promise?: Promise<void>;
};

type UseApiOptions = {
  enabled?: boolean;
  staleTime?: number;
};

type UseApiResult<T> = {
  data?: T;
  error?: ApiError;
  isLoading: boolean;
  isValidating: boolean;
  refresh: () => Promise<void>;
  mutate: (data: T) => void;
};

const cache = new Map<string, CacheEntry<unknown>>();

function getEntry<T>(key: string): CacheEntry<T> {
  let entry = cache.get(key) as CacheEntry<T> | undefined;

  if (!entry) {
    entry = { updatedAt: 0, listeners: new Set() };
    cache.set(key, entry);
  }

  return entry;
}

export function useApi<T>(key: string, fetcher: () => Promise<T>, options: UseApiOptions = {}): UseApiResult<T> {
  const { enabled = true, staleTime = 30_000 } = options;
  const [entry, setEntry] = useState(() => getEntry<T>(key));
  const currentEntry = getEntry<T>(key);

  const refresh = useCallback(async () => {
    const activeEntry = getEntry<T>(key);
    if (activeEntry.promise) return activeEntry.promise;

    activeEntry.promise = fetcher()
      .then((data) => {
        activeEntry.data = data;
        activeEntry.error = undefined;
        activeEntry.updatedAt = Date.now();
      })
      .catch((error: unknown) => {
        activeEntry.error = error instanceof ApiError ? error : new ApiError("Unable to load this resource.", 0, error);
      })
      .finally(() => {
        activeEntry.promise = undefined;
        activeEntry.listeners.forEach((listener) => listener());
      });

    activeEntry.listeners.forEach((listener) => listener());
    return activeEntry.promise;
  }, [fetcher, key]);

  useEffect(() => {
    const notify = () => setEntry({ ...getEntry<T>(key) });
    currentEntry.listeners.add(notify);

    if (enabled && (currentEntry.updatedAt === 0 || Date.now() - currentEntry.updatedAt > staleTime)) {
      void refresh();
    }

    return () => {
      currentEntry.listeners.delete(notify);
    };
  }, [currentEntry, enabled, key, refresh, staleTime]);

  const mutate = useCallback((data: T) => {
    const activeEntry = getEntry<T>(key);
    activeEntry.data = data;
    activeEntry.error = undefined;
    activeEntry.updatedAt = Date.now();
    activeEntry.listeners.forEach((listener) => listener());
  }, [key]);

  return {
    data: entry.data,
    error: entry.error,
    isLoading: enabled && !entry.data && !entry.error,
    isValidating: Boolean(entry.promise),
    refresh,
    mutate,
  };
}