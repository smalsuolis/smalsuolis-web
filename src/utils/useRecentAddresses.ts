import { useCallback, useEffect, useState } from 'react';
import { AddressSuggestion } from './types';

const STORAGE_KEY = 'smalsuolis:recent-addresses';
const MAX_RECENTS = 10;

const read = (): AddressSuggestion[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENTS) : [];
  } catch {
    return [];
  }
};

const write = (list: AddressSuggestion[]) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_RECENTS)));
  } catch {
    // Storage unavailable (private mode / quota) — recents are best-effort.
  }
};

// Persisted list of recently-searched addresses (last MAX_RECENTS, newest first),
// backed by localStorage. Powers the address search's "recent" shortcuts.
export const useRecentAddresses = () => {
  const [recents, setRecents] = useState<AddressSuggestion[]>(() => read());

  // Keep in sync if another tab updates the list.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) setRecents(read());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const add = useCallback((address: AddressSuggestion) => {
    setRecents((prev) => {
      // Dedup by label (same address shouldn't appear twice); move to front.
      const withoutDup = prev.filter((a) => a.label !== address.label);
      const next = [address, ...withoutDup].slice(0, MAX_RECENTS);
      write(next);
      return next;
    });
  }, []);

  const remove = useCallback((label: string) => {
    setRecents((prev) => {
      const next = prev.filter((a) => a.label !== label);
      write(next);
      return next;
    });
  }, []);

  return { recents, add, remove };
};
