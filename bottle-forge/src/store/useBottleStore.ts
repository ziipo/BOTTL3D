import { create } from 'zustand';
import type { BottleParams, Unit, ProfilePoint, ThreadSettings, TextureSettings, EmbossSettings } from '../types/bottle';
import { defaultProfileId } from '../data/profiles';

interface MeshData {
  positions: Float32Array;
  normals: Float32Array;
  indices: Uint32Array;
}

interface BottleState extends BottleParams {
  // Generation state
  isGenerating: boolean;
  progress: number;
  progressStage: string;
  error: string | null;

  // Generated mesh data (for Three.js)
  bottleMeshData: MeshData | null;
  lidMeshData: MeshData | null;

  // Export data
  bottleStlData: ArrayBuffer | null;
  bottleThreemfData: ArrayBuffer | null;
  lidStlData: ArrayBuffer | null;
  lidThreemfData: ArrayBuffer | null;

  // View state
  resetView: number;
  theme: 'light' | 'dark';

  // Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setParam: <K extends keyof BottleParams>(key: K, value: BottleParams[K]) => void;
  setParams: (params: Partial<BottleParams>) => void;
  setThread: (thread: Partial<ThreadSettings>) => void;
  setTexture: (texture: Partial<TextureSettings>) => void;
  setEmboss: (emboss: Partial<EmbossSettings>) => void;
  setGenerating: (isGenerating: boolean) => void;
  setProgress: (percent: number, stage: string) => void;
  setError: (error: string | null) => void;
  setBottleMeshData: (data: MeshData | null) => void;
  setLidMeshData: (data: MeshData | null) => void;
  setBottleStlData: (data: ArrayBuffer | null) => void;
  setBottleThreemfData: (data: ArrayBuffer | null) => void;
  setLidStlData: (data: ArrayBuffer | null) => void;
  setLidThreemfData: (data: ArrayBuffer | null) => void;
  requestResetView: () => void;
  resetToDefaults: () => void;
}

const defaultParams: BottleParams = {
  // Dimensions
  outerDiameter: 60,
  neckDiameter: 30,
  neckDiameterAuto: true,
  overallHeight: 120,
  wallThickness: 2,

  // Lid
  lidType: 'slip-on',
  lidHeight: 20,
  slipOnClearance: 0.3,

  // Threads
  thread: {
    pitch: 3,
    turns: 2,
    depth: 1,
    clearance: 0.3,
  },

  // Body style
  bodyStyle: 'shape',

  // Body profile
  profileId: defaultProfileId,
  customProfilePoints: [{ x: 0, y: 1 }, { x: 1, y: 1 }] as ProfilePoint[],

  // Surface
  texture: {
    type: 'none',
    depth: 0.5,
    spacing: 3,
    coverage: 0.8,
  },
  emboss: {
    enabled: false,
    text: '',
    fontSize: 8,
    depth: 0.5,
    verticalPosition: 0.5,
    orientation: 'wrap',
    mode: 'engrave',
    fontFamily: 'Roboto',
  },

  // Display
  displayUnit: 'mm' as Unit,
  showExploded: false,
};

export const useBottleStore = create<BottleState>((set) => ({
  // Initial parameter values
  ...defaultParams,

  // Generation state
  isGenerating: false,
  progress: 0,
  progressStage: '',
  error: null,

  // Generated data
  bottleMeshData: null,
  lidMeshData: null,
  bottleStlData: null,
  bottleThreemfData: null,
  lidStlData: null,
  lidThreemfData: null,

  // View state
  resetView: 0,
  theme: 'dark',

  // Actions
  setTheme: (theme) => set({ theme }),

  setParam: (key, value) =>
    set((state) => ({
      ...state,
      [key]: value,
      error: null,
    })),

  setParams: (params) =>
    set((state) => ({
      ...state,
      ...params,
      error: null,
    })),

  setThread: (thread) =>
    set((state) => ({
      ...state,
      thread: { ...state.thread, ...thread },
      error: null,
    })),

  setTexture: (texture) =>
    set((state) => ({
      ...state,
      texture: { ...state.texture, ...texture },
      error: null,
    })),

  setEmboss: (emboss) =>
    set((state) => ({
      ...state,
      emboss: { ...state.emboss, ...emboss },
      error: null,
    })),

  setGenerating: (isGenerating) =>
    set(isGenerating ? { isGenerating, error: null } : { isGenerating }),

  setProgress: (progress, progressStage) =>
    set({ progress, progressStage }),

  setError: (error) =>
    set({ error, isGenerating: false }),

  setBottleMeshData: (bottleMeshData) =>
    set({ bottleMeshData }),

  setLidMeshData: (lidMeshData) =>
    set({ lidMeshData }),

  setBottleStlData: (bottleStlData) =>
    set({ bottleStlData }),

  setBottleThreemfData: (bottleThreemfData) =>
    set({ bottleThreemfData }),

  setLidStlData: (lidStlData) =>
    set({ lidStlData }),

  setLidThreemfData: (lidThreemfData) =>
    set({ lidThreemfData }),

  requestResetView: () =>
    set((state) => ({ resetView: state.resetView + 1 })),

  resetToDefaults: () =>
    set({
      ...defaultParams,
      isGenerating: false,
      progress: 0,
      progressStage: '',
      error: null,
      bottleMeshData: null,
      lidMeshData: null,
      bottleStlData: null,
      bottleThreemfData: null,
      lidStlData: null,
      lidThreemfData: null,
      resetView: 0,
      theme: 'dark',
    }),
}));

// DEBUG: expose store for console access
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).__bottleStore = useBottleStore;

// Selector for getting all params as a BottleParams object
export function selectBottleParams(state: BottleState): BottleParams {
  return {
    outerDiameter: state.outerDiameter,
    neckDiameter: state.neckDiameter,
    neckDiameterAuto: state.neckDiameterAuto,
    overallHeight: state.overallHeight,
    wallThickness: state.wallThickness,
    lidType: state.lidType,
    lidHeight: state.lidHeight,
    slipOnClearance: state.slipOnClearance,
    thread: state.thread,
    bodyStyle: state.bodyStyle,
    profileId: state.profileId,
    customProfilePoints: state.customProfilePoints,
    texture: state.texture,
    emboss: state.emboss,
    displayUnit: state.displayUnit,
    showExploded: state.showExploded,
  };
}
