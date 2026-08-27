"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

export type UseApiResult<T> = {
  data?: T;
  error?: ApiError;
  isLoading: boolean;
  loading: boolean;
  isValidating: boolean;
  refresh: () => Promise<void>;
  reload: () => Promise<void>;
  refetch: () => Promise<void>;
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

  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const refresh = useCallback(async () => {
    const activeEntry = getEntry<T>(key);
    if (activeEntry.promise) return activeEntry.promise;

    activeEntry.promise = fetcherRef
      .current()
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
  }, [key]);

  useEffect(() => {
    const currentEntry = getEntry<T>(key);
    const notify = () => {
      const latest = getEntry<T>(key);
      setEntry({ ...latest });
    };
    currentEntry.listeners.add(notify);

    if (enabled && (currentEntry.updatedAt === 0 || Date.now() - currentEntry.updatedAt > staleTime)) {
      void refresh();
    }

    return () => {
      currentEntry.listeners.delete(notify);
    };
  }, [enabled, key, refresh, staleTime]);

  const mutate = useCallback((data: T) => {
    const activeEntry = getEntry<T>(key);
    activeEntry.data = data;
    activeEntry.error = undefined;
    activeEntry.updatedAt = Date.now();
    activeEntry.listeners.forEach((listener) => listener());
  }, [key]);

  const loading = enabled && !entry.data && !entry.error;
  return {
    data: entry.data,
    error: entry.error,
    isLoading: loading,
    loading,
    isValidating: Boolean(entry.promise),
    refresh,
    reload: refresh,
    refetch: refresh,
    mutate,
  };
}