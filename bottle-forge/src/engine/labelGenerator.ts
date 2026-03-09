import type { Manifold, ManifoldToplevel } from 'manifold-3d';
import type { EmbossSettings } from '../types/bottle';
import { loadFont, textToPolygons, getTextWidth } from './textEngine';

/**
 * Maximum characters for label text.
 */
export const MAX_LABEL_CHARS = 30;

/**
 * Generates engraved or embossed label text on a cylindrical bottle body.
 *
 * Pipeline:
 * 1. Convert text → 2D polygons via opentype.js
 * 2. Create manifold CrossSection → extrude to depth
 * 3. refineToLength() for dense vertex mesh (primary subdivision)
 * 4. warp() with cylindrical mapping to bend onto surface
 * 5. Return warped manifold for boolean with bottle body
 */
export async function generateLabel(
  wasm: ManifoldToplevel,
  emboss: EmbossSettings,
  bodyRadius: number,
  bodyHeight: number,
  mode: 'engrave' | 'emboss',
): Promise<Manifold | null> {
  if (!emboss.text || emboss.text.length === 0) return null;

  const text = emboss.text.slice(0, MAX_LABEL_CHARS);
  const font = await loadFont();

  const fontSize = emboss.fontSize;
  const depth = emboss.depth;
  const isWrap = emboss.orientation === 'wrap';

  // Get text dimensions for fitting
  const textWidth = getTextWidth(text, fontSize, font);

  // Available arc length on the cylinder
  const circumference = 2 * Math.PI * bodyRadius;
  const availableWidth = isWrap ? circumference * 0.9 : bodyHeight * 0.8;

  // Auto-scale font if text is too wide to fit
  let effectiveFontSize = fontSize;
  if (textWidth > availableWidth) {
    effectiveFontSize = fontSize * (availableWidth / textWidth);
  }

  // Generate 2D polygons from text
  const polygons = textToPolygons(text, effectiveFontSize, font);
  if (polygons.length === 0) return null;

  // Create cross-section from polygons using EvenOdd fill rule
  let crossSection = new wasm.CrossSection(polygons, 'EvenOdd');

  // Verify cross-section is valid (non-empty)
  if (crossSection.area() <= 0) {
    crossSection.delete();
    return null;
  }

  // Extrude to create flat 3D text slab
  // Text lies in XY plane, extruded along Z by 'depth'
  let textSolid = wasm.Manifold.extrude(crossSection, depth);
  crossSection.delete();

  // --- Subdivision for smooth cylindrical warping ---
  const targetEdgeLength = Math.max(1.0, bodyRadius * 0.03);
  try {
    textSolid = textSolid.refineToLength(targetEdgeLength);
  } catch (e) {
    const n = Math.min(4, Math.max(2, Math.ceil(effectiveFontSize / targetEdgeLength)));
    textSolid = textSolid.refine(n);
  }

  // --- Cylindrical warp ---
  // The flat text mesh has:
  //   X = horizontal position
  //   Y = vertical position
  //   Z = depth
  const R = bodyRadius;
  const overlap = 0.3;
  const radialBase = mode === 'engrave' ? R - depth - overlap : R - overlap;
  const verticalCenter = emboss.verticalPosition * bodyHeight;

  // Face the camera (-Math.PI / 2 puts center of text at Manifold Y = -R)
  const thetaOffset = -Math.PI / 2;
  
  if (isWrap) {
    textSolid = textSolid.warp((v: [number, number, number]) => {
      const x = v[0];
      const y = v[1];
      const z = v[2];

      const r = radialBase + z * ((depth + 2 * overlap) / depth);
      const theta = x / R + thetaOffset;
      v[0] = r * Math.cos(theta); // Use cos for X and sin for Y to preserve positive determinant (normals)
      v[1] = r * Math.sin(theta);
      v[2] = y; // Map font Y to Manifold Z (height)
    });
  } else {
    textSolid = textSolid.warp((v: [number, number, number]) => {
      const x = v[0];
      const y = v[1];
      const z = v[2];

      const r = radialBase + z * ((depth + 2 * overlap) / depth);
      const theta = y / R + thetaOffset;
      v[0] = r * Math.cos(theta);
      v[1] = r * Math.sin(theta);
      v[2] = -x; // Map font X to Manifold Z (height), flipped for top-to-bottom
    });
  }

  // Translate to the correct vertical position on the bottle
  textSolid = textSolid.translate([0, 0, verticalCenter]);

  return textSolid;
}

/**
 * Apply label to bottle body via boolean operation.
 */
export function applyLabel(
  wasm: ManifoldToplevel,
  bottle: Manifold,
  label: Manifold,
  mode: 'engrave' | 'emboss'
): Manifold {
  if (mode === 'engrave') {
    return wasm.Manifold.difference(bottle, label);
  } else {
    return wasm.Manifold.union(bottle, label);
  }
}
