// === Units ===
export type Unit = 'mm' | 'in';

// === Profile ===
export interface ProfilePoint {
  x: number; // 0..1 normalized (0 = bottom, 1 = top of body)
  y: number; // 0..1 normalized (0 = center/axis, 1 = max radius)
  hx?: number; // handle offset X (relative to point)
  hy?: number; // handle offset Y (symmetric: "in" handle is mirrored)
}

export interface BottleProfile {
  id: string;
  name: string;
  points: ProfilePoint[];
  description: string;
}

// === Thread Settings ===
export interface ThreadSettings {
  pitch: number;       // mm between thread crests (1.5-6mm)
  turns: number;       // number of full turns (1-4)
  depth: number;       // thread depth in mm (0.5-2mm)
  clearance: number;   // male/female clearance in mm (0.2-0.6mm)
}

// === Texture Settings ===
export interface TextureSettings {
  type: 'none' | 'knurling' | 'vertical-ridges' | 'horizontal-ridges' | 'diamond';
  depth: number;       // mm (0.3-2mm)
  spacing: number;     // mm between pattern elements
  coverage: number;    // 0..1 vertical extent of body
}

// === Emboss Settings ===
export interface EmbossSettings {
  enabled: boolean;
  text: string;
  fontSize: number;    // mm
  depth: number;       // mm (extrusion depth)
  verticalPosition: number; // 0..1 position on body height
}

// === Bottle Parameters ===
export interface BottleParams {
  // Dimensions
  outerDiameter: number;   // mm (20-150)
  neckDiameter: number;    // mm (15-80), must be ≤ outerDiameter
  neckDiameterAuto: boolean; // when true, neck diameter derived from profile top
  overallHeight: number;   // mm (40-300)
  wallThickness: number;   // mm (1-5)

  // Lid
  lidType: 'slip-on' | 'screw-on';
  lidHeight: number;       // mm
  slipOnClearance: number; // mm gap for slip-on fit

  // Threads (for screw-on)
  thread: ThreadSettings;

  // Body style mode
  bodyStyle: 'shape' | 'texture' | 'label';

  // Body profile
  profileId: string;
  customProfilePoints: ProfilePoint[];

  // Surface
  texture: TextureSettings;
  emboss: EmbossSettings;

  // Display
  displayUnit: Unit;
  showExploded: boolean;   // show lid separated from body
}

// === Computed Dimensions ===
export interface ComputedBottleDimensions {
  bodyHeight: number;      // overallHeight - lidHeight
  innerDiameter: number;   // outerDiameter - 2 * wallThickness
  neckOuterRadius: number; // neckDiameter / 2
  neckInnerRadius: number; // neckOuterRadius - wallThickness
}

// === Worker Messages ===
export interface GenerateMessage {
  type: 'generate';
  params: BottleParams;
}

export interface ResultMessage {
  type: 'result';
  bottleMesh: {
    positions: Float32Array;
    normals: Float32Array;
    indices: Uint32Array;
  };
  lidMesh: {
    positions: Float32Array;
    normals: Float32Array;
    indices: Uint32Array;
  };
  bottleStlData: ArrayBuffer;
  bottleThreemfData: ArrayBuffer;
  lidStlData: ArrayBuffer;
  lidThreemfData: ArrayBuffer;
}

export interface ErrorMessage {
  type: 'error';
  error: string;
}

export interface ProgressMessage {
  type: 'progress';
  stage: string;
  percent: number;
}

export interface CrossSectionMessage {
  type: 'cross-section';
  params: BottleParams;
}

export interface CrossSectionResultMessage {
  type: 'cross-section-result';
  svg: string;
}

export type WorkerMessage = GenerateMessage | CrossSectionMessage;
export type WorkerResponse = ResultMessage | ErrorMessage | ProgressMessage | CrossSectionResultMessage;
