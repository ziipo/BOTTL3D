import type { BottleParams, ProfilePoint } from '../types/bottle';

/**
 * Encodes bottle parameters to a compact URL hash.
 */
export function encodeParams(params: BottleParams): string {
  const data: Record<string, unknown> = {
    od: Math.round(params.outerDiameter * 10) / 10,
    nd: Math.round(params.neckDiameter * 10) / 10,
    na: params.neckDiameterAuto ? 1 : 0,
    oh: Math.round(params.overallHeight * 10) / 10,
    wt: Math.round(params.wallThickness * 10) / 10,
    lt: params.lidType,
    lh: Math.round(params.lidHeight * 10) / 10,
    sc: Math.round(params.slipOnClearance * 100) / 100,
    bs: params.bodyStyle,
    pi: params.profileId,
    u: params.displayUnit,
    se: params.showExploded ? 1 : 0,
    // Thread
    tp: Math.round(params.thread.pitch * 10) / 10,
    tt: params.thread.turns,
    td: Math.round(params.thread.depth * 10) / 10,
    tc: Math.round(params.thread.clearance * 100) / 100,
    // Texture
    xt: params.texture.type,
    xd: Math.round(params.texture.depth * 10) / 10,
    xs: Math.round(params.texture.spacing * 10) / 10,
    xc: Math.round(params.texture.coverage * 100) / 100,
    // Emboss
    ee: params.emboss.enabled ? 1 : 0,
    et: params.emboss.text,
    ef: Math.round(params.emboss.fontSize * 10) / 10,
    ed: Math.round(params.emboss.depth * 10) / 10,
    ev: Math.round(params.emboss.verticalPosition * 100) / 100,
    eo: params.emboss.orientation,
    em: params.emboss.mode,
  };

  // Custom profile points
  if (params.profileId === 'custom') {
    data.cp = params.customProfilePoints.flatMap(p => [
      Math.round(p.x * 100) / 100,
      Math.round(p.y * 100) / 100,
      Math.round((p.hx ?? 0) * 100) / 100,
      Math.round((p.hy ?? 0) * 100) / 100,
    ]);
  }

  const json = JSON.stringify(data);
  return btoa(json);
}

/**
 * Decodes URL hash back to bottle parameters.
 */
export function decodeParams(hash: string): Partial<BottleParams> | null {
  try {
    const cleanHash = hash.startsWith('#') ? hash.slice(1) : hash;
    if (!cleanHash) return null;

    const json = atob(cleanHash);
    const data = JSON.parse(json);
    const params: Partial<BottleParams> = {};

    if (typeof data.od === 'number') params.outerDiameter = data.od;
    if (typeof data.nd === 'number') params.neckDiameter = data.nd;
    if (typeof data.na === 'number') params.neckDiameterAuto = data.na === 1;
    if (typeof data.oh === 'number') params.overallHeight = data.oh;
    if (typeof data.wt === 'number') params.wallThickness = data.wt;
    if (data.lt === 'slip-on' || data.lt === 'screw-on') params.lidType = data.lt;
    if (typeof data.lh === 'number') params.lidHeight = data.lh;
    if (typeof data.sc === 'number') params.slipOnClearance = data.sc;
    if (data.bs === 'shape' || data.bs === 'texture' || data.bs === 'label') params.bodyStyle = data.bs;
    if (data.pi) params.profileId = data.pi;
    if (data.u === 'mm' || data.u === 'in') params.displayUnit = data.u;
    if (typeof data.se === 'number') params.showExploded = data.se === 1;

    // Thread
    if (typeof data.tp === 'number' || typeof data.tt === 'number' ||
        typeof data.td === 'number' || typeof data.tc === 'number') {
      params.thread = {
        pitch: data.tp ?? 3,
        turns: data.tt ?? 2,
        depth: data.td ?? 1,
        clearance: data.tc ?? 0.3,
      };
    }

    // Texture
    if (data.xt) {
      params.texture = {
        type: data.xt,
        depth: data.xd ?? 0.5,
        spacing: data.xs ?? 3,
        coverage: data.xc ?? 0.8,
      };
    }

    // Emboss
    if (typeof data.ee === 'number') {
      params.emboss = {
        enabled: data.ee === 1,
        text: data.et ?? '',
        fontSize: data.ef ?? 8,
        depth: data.ed ?? 0.5,
        verticalPosition: data.ev ?? 0.5,
        orientation: data.eo === 'vertical' ? 'vertical' : 'wrap',
        mode: data.em === 'emboss' ? 'emboss' : 'engrave',
      };
    }

    // Custom profile points
    if (Array.isArray(data.cp) && data.cp.length >= 4) {
      const points: ProfilePoint[] = [];
      for (let i = 0; i + 3 < data.cp.length; i += 4) {
        const x = Number(data.cp[i]);
        const y = Number(data.cp[i + 1]);
        if (isNaN(x) || isNaN(y)) continue;
        const pt: ProfilePoint = {
          x: Math.max(0, Math.min(1, x)),
          y: Math.max(0, Math.min(1, y)),
        };
        const hx = Number(data.cp[i + 2]);
        const hy = Number(data.cp[i + 3]);
        if (!isNaN(hx) && hx !== 0) pt.hx = hx;
        if (!isNaN(hy) && hy !== 0) pt.hy = hy;
        points.push(pt);
      }
      if (points.length >= 2) {
        params.customProfilePoints = points;
      }
    }

    return params;
  } catch {
    console.warn('Failed to decode URL parameters');
    return null;
  }
}

export function updateUrlHash(params: BottleParams): void {
  const hash = encodeParams(params);
  window.history.replaceState(null, '', `#${hash}`);
}

export function getParamsFromUrl(): Partial<BottleParams> | null {
  return decodeParams(window.location.hash);
}

export function createShareUrl(params: BottleParams): string {
  const hash = encodeParams(params);
  return `${window.location.origin}${window.location.pathname}#${hash}`;
}
