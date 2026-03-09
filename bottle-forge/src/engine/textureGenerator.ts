import type { Manifold, ManifoldToplevel } from 'manifold-3d';
import type { TextureSettings } from '../types/bottle';

const TWO_PI = 2 * Math.PI;

/**
 * Apply a surface texture to the bottle body manifold.
 *
 * When a texture is active, the body is assumed to be a cylinder at outerRadius.
 * The caller (bottleGenerator) forces the cylinder profile when texture != 'none'.
 */
export function applyTexture(
  wasm: ManifoldToplevel,
  body: Manifold,
  bodyHeight: number,
  outerRadius: number,
  settings: TextureSettings
): Manifold {
  if (settings.type === 'none') return body;

  const coverageHeight = bodyHeight * settings.coverage;
  const textureStartZ = 5;
  const textureEndZ = Math.min(textureStartZ + coverageHeight, bodyHeight - 3);
  if (textureEndZ <= textureStartZ + 1) return body;

  switch (settings.type) {
    case 'vertical-ridges':
      return applyVerticalRidges(wasm, body, outerRadius, textureStartZ, textureEndZ, settings);
    case 'horizontal-ridges':
      return applyHorizontalRidges(wasm, body, outerRadius, textureStartZ, textureEndZ, settings);
    case 'knurling':
      return applyKnurling(wasm, body, outerRadius, textureStartZ, textureEndZ, settings);
    case 'diamond':
      return applyDiamond(wasm, body, outerRadius, textureStartZ, textureEndZ, settings);
    default:
      return body;
  }
}

/**
 * Vertical ridges: raised fins along the bottle height.
 */
function applyVerticalRidges(
  wasm: ManifoldToplevel,
  body: Manifold,
  outerRadius: number,
  startZ: number,
  endZ: number,
  settings: TextureSettings
): Manifold {
  const ridgeHeight = endZ - startZ;
  const ridgeDepth = settings.depth;
  const ridgeRadius = Math.max(0.4, settings.spacing * 0.18);

  const circumference = TWO_PI * outerRadius;
  const numRidges = Math.max(6, Math.round(circumference / settings.spacing));

  let result = body;
  for (let i = 0; i < numRidges; i++) {
    const angle = (i / numRidges) * TWO_PI;
    const cx = Math.cos(angle) * (outerRadius + ridgeDepth / 2);
    const cy = Math.sin(angle) * (outerRadius + ridgeDepth / 2);
    const ridge = wasm.Manifold.cylinder(ridgeHeight, ridgeRadius, ridgeRadius, 6);
    result = wasm.Manifold.union(result, ridge.translate([cx, cy, startZ]));
  }
  return result;
}

/**
 * Horizontal ridges: raised rings around the circumference.
 * Built as revolved annular rectangles.
 */
function applyHorizontalRidges(
  wasm: ManifoldToplevel,
  body: Manifold,
  outerRadius: number,
  startZ: number,
  endZ: number,
  settings: TextureSettings
): Manifold {
  return buildRings(wasm, body, outerRadius, startZ, endZ, settings.depth, settings.spacing, 0);
}

/**
 * Knurling: two interleaved sets of grooves (subtracted rings).
 *
 * We build this as two staggered sets of horizontal groove rings — one set
 * at normal Z positions, one at half-spacing offset. Combined with vertical
 * ridges between them, this creates a diamond knurl appearance.
 *
 * Using full-revolution ring CSG (revolve) is the only crash-safe approach
 * when building textures entirely with Manifold primitives.
 */
function applyKnurling(
  wasm: ManifoldToplevel,
  body: Manifold,
  outerRadius: number,
  startZ: number,
  endZ: number,
  settings: TextureSettings
): Manifold {
  const grooveDepth = Math.min(settings.depth, outerRadius * 0.25);
  const grooveSpacing = settings.spacing;
  const grooveWidth = Math.max(0.4, grooveSpacing * 0.4);

  // Two sets of grooves offset by half spacing
  let result = body;
  result = subtractRings(wasm, result, outerRadius, startZ, endZ, grooveDepth, grooveWidth, grooveSpacing, 0);
  result = subtractRings(wasm, result, outerRadius, startZ, endZ, grooveDepth, grooveWidth, grooveSpacing, grooveSpacing / 2);
  return result;
}

/**
 * Diamond: dense knurling with raised bumps between grooves.
 * Uses finer spacing for a more textured appearance.
 */
function applyDiamond(
  wasm: ManifoldToplevel,
  body: Manifold,
  outerRadius: number,
  startZ: number,
  endZ: number,
  settings: TextureSettings
): Manifold {
  return applyKnurling(wasm, body, outerRadius, startZ, endZ, {
    ...settings,
    spacing: settings.spacing * 0.55,
    depth: settings.depth * 0.7,
  });
}

/**
 * Add raised rings (union) at regular Z intervals.
 */
function buildRings(
  wasm: ManifoldToplevel,
  body: Manifold,
  outerRadius: number,
  startZ: number,
  endZ: number,
  depth: number,
  spacing: number,
  phaseOffset: number
): Manifold {
  const ridgeWidth = Math.max(0.4, spacing * 0.35);
  const textureHeight = endZ - startZ;
  const numRings = Math.max(2, Math.round(textureHeight / spacing));
  const SEGS = 48;

  let result = body;
  for (let i = 0; i < numRings; i++) {
    const z = startZ + phaseOffset + (i + 0.5) * (textureHeight / numRings);
    if (z < startZ || z > endZ) continue;
    const halfW = ridgeWidth / 2;
    const cs = new wasm.CrossSection([
      [[outerRadius, z - halfW], [outerRadius + depth, z - halfW],
       [outerRadius + depth, z + halfW], [outerRadius, z + halfW]],
    ]);
    const ring = wasm.Manifold.revolve(cs, SEGS);
    cs.delete();
    result = wasm.Manifold.union(result, ring);
  }
  return result;
}

/**
 * Subtract groove rings (difference) at regular Z intervals.
 */
function subtractRings(
  wasm: ManifoldToplevel,
  body: Manifold,
  outerRadius: number,
  startZ: number,
  endZ: number,
  depth: number,
  grooveWidth: number,
  spacing: number,
  phaseOffset: number
): Manifold {
  const textureHeight = endZ - startZ;
  const numGrooves = Math.max(2, Math.round(textureHeight / spacing));
  const SEGS = 40;

  let result = body;
  for (let i = 0; i < numGrooves; i++) {
    const z = startZ + phaseOffset + (i + 0.5) * (textureHeight / numGrooves);
    if (z < startZ || z > endZ) continue;
    const halfW = grooveWidth / 2;
    const rIn = Math.max(0.5, outerRadius - depth);
    const rOut = outerRadius + 0.01;
    const cs = new wasm.CrossSection([
      [[rIn, z - halfW], [rOut, z - halfW],
       [rOut, z + halfW], [rIn, z + halfW]],
    ]);
    const groove = wasm.Manifold.revolve(cs, SEGS);
    cs.delete();
    result = wasm.Manifold.difference(result, groove);
  }
  return result;
}
