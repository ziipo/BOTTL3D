import { useEffect, useRef } from 'react';
import { useBottleStore, selectBottleParams } from '../store/useBottleStore';
import { useShallow } from 'zustand/react/shallow';
import { getParamsFromUrl, updateUrlHash } from '../utils/urlParams';

/**
 * Hook to sync bottle parameters with URL hash.
 * - On mount, loads parameters from URL if present
 * - On parameter changes, updates URL hash (debounced)
 */
export function useUrlSync() {
  const params = useBottleStore(useShallow(selectBottleParams));
  const setParams = useBottleStore((s) => s.setParams);
  const isInitialMount = useRef(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load params from URL on initial mount
  useEffect(() => {
    const urlParams = getParamsFromUrl();
    if (urlParams && Object.keys(urlParams).length > 0) {
      setParams(urlParams);
    }
    isInitialMount.current = false;
  }, [setParams]);

  // Update URL when params change (debounced)
  useEffect(() => {
    if (isInitialMount.current) return;

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      updateUrlHash(params);
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [params]);
}
