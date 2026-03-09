import { useEffect, useRef, useCallback } from 'react';
import { useBottleStore, selectBottleParams } from '../store/useBottleStore';
import { useShallow } from 'zustand/react/shallow';
import type { WorkerResponse, GenerateMessage, CrossSectionMessage } from '../types/bottle';

// Import worker as URL for Vite
import WorkerUrl from './worker.ts?worker&url';

/**
 * Hook to manage the bottle generation Web Worker.
 * Automatically regenerates when parameters change.
 */
export function useBottleWorker() {
  const workerRef = useRef<Worker | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const params = useBottleStore(useShallow(selectBottleParams));

  const setGenerating = useBottleStore((s) => s.setGenerating);
  const setProgress = useBottleStore((s) => s.setProgress);
  const setError = useBottleStore((s) => s.setError);
  const setBottleMeshData = useBottleStore((s) => s.setBottleMeshData);
  const setLidMeshData = useBottleStore((s) => s.setLidMeshData);
  const setBottleStlData = useBottleStore((s) => s.setBottleStlData);
  const setBottleThreemfData = useBottleStore((s) => s.setBottleThreemfData);
  const setLidStlData = useBottleStore((s) => s.setLidStlData);
  const setLidThreemfData = useBottleStore((s) => s.setLidThreemfData);

  // Initialize worker
  useEffect(() => {
    const worker = new Worker(WorkerUrl, { type: 'module' });
    workerRef.current = worker;

    worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
      const response = event.data;

      switch (response.type) {
        case 'result':
          setBottleMeshData(response.bottleMesh);
          setLidMeshData(response.lidMesh);
          setBottleStlData(response.bottleStlData);
          setBottleThreemfData(response.bottleThreemfData);
          setLidStlData(response.lidStlData);
          setLidThreemfData(response.lidThreemfData);
          setGenerating(false);
          break;

        case 'progress':
          setProgress(response.percent, response.stage);
          break;

        case 'cross-section-result': {
          // Open SVG in a new window for inspection
          const blob = new Blob([response.svg], { type: 'image/svg+xml' });
          const url = URL.createObjectURL(blob);
          window.open(url, '_blank', 'width=850,height=600');
          console.log('[Debug] Cross-section SVG opened in new window');
          break;
        }

        case 'error':
          setError(response.error);
          break;
      }
    };

    worker.onerror = (event) => {
      setError(`Worker error: ${event.message}`);
    };

    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, [setGenerating, setProgress, setError, setBottleMeshData, setLidMeshData, setBottleStlData, setBottleThreemfData, setLidStlData, setLidThreemfData]);

  // Generate function
  const generate = useCallback(() => {
    if (!workerRef.current) return;

    setGenerating(true);
    setError(null);

    const message: GenerateMessage = {
      type: 'generate',
      params,
    };

    workerRef.current.postMessage(message);
  }, [params, setGenerating, setError]);

  // Expose debug cross-section function on window
  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__debugCrossSection = () => {
      if (!workerRef.current) {
        console.error('[Debug] Worker not ready');
        return;
      }
      const currentParams = useBottleStore.getState();
      const message: CrossSectionMessage = {
        type: 'cross-section',
        params: selectBottleParams(currentParams),
      };
      workerRef.current.postMessage(message);
      console.log('[Debug] Cross-section request sent to worker');
    };

    return () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (window as any).__debugCrossSection;
    };
  }, []);

  // Debounced regeneration when params change
  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      generate();
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [generate]);

  return { generate };
}
