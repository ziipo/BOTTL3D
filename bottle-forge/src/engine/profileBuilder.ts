import type { CrossSection, ManifoldToplevel, Vec2 } from 'manifold-3d';
import type { ProfilePoint } from '../types/bottle';

/**
 * Returns true if a point has a non-zero Bezier handle.
 */
function hasHandle(p: ProfilePoint): boolean {
  return (p.hx != null && p.hx !== 0) || (p.hy != null && p.hy !== 0);
}

/**
 * Tessellates a sequence of ProfilePoints into a polyline,
 * converting Bezier handle pairs into cubic curve subdivisions.
 *
 * For each consecutive pair P0->P1:
 * - If neither has a handle: straight segment (just emit P1)
 * - If either/both have handles: cubic Bezier with SUBDIVISIONS steps
 *   cp1 = P0 + (hx, hy)       -- out-handle of P0
 *   cp2 = P1 + (-hx, -hy)     -- in-handle of P1 (mirrored)
 */
const BEZIER_SUBDIVISIONS = 10;

export function tessellateProfile(points: ProfilePoint[]): { x: number; y: number }[] {
  if (points.length < 2) return points.map(p => ({ x: p.x, y: p.y }));

  const result: { x: number; y: number }[] = [{ x: points[0].x, y: points[0].y }];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    if (!hasHandle(p0) && !hasHandle(p1)) {
      result.push({ x: p1.x, y: p1.y });
    } else {
      const cp1x = p0.x + (p0.hx ?? 0);
      const cp1y = p0.y + (p0.hy ?? 0);
      const cp2x = p1.x - (p1.hx ?? 0);
      const cp2y = p1.y - (p1.hy ?? 0);

      for (let s = 1; s <= BEZIER_SUBDIVISIONS; s++) {
        const t = s / BEZIER_SUBDIVISIONS;
        const mt = 1 - t;
        const x = mt * mt * mt * p0.x + 3 * mt * mt * t * cp1x + 3 * mt * t * t * cp2x + t * t * t * p1.x;
        const y = mt * mt * mt * p0.y + 3 * mt * mt * t * cp1y + 3 * mt * t * t * cp2y + t * t * t * p1.y;
        result.push({ x, y });
      }
    }
  }

  return result;
}

/**
 * Builds a 2D cross-section polygon for the bottle body revolution.
 *
 * Profile coordinate system (normalized 0-1):
 *   X: 0 = bottom of body, 1 = top of body (neck junction)
 *   Y: 0 = center axis, 1 = maximum radius
 *
 * Output cross-section coordinate system (for revolve around Y axis):
 *   X: radial distance from center (0 = axis, radius = outer wall)
 *   Y: height (0 = bottom, bodyHeight = top)
 *
 * The polygon represents a half cross-section that will be revolved:
 *   - Outer wall follows the tessellated profile curve
 *   - Inner wall offset inward by wallThickness
 *   - Closed bottom at wallThickness (solid floor)
 *   - Top vertex clamped to neckOuterRadius (zone enforcement)
 */
export function buildBodyCrossSection(
  wasm: ManifoldToplevel,
  profilePoints: ProfilePoint[],
  bodyHeight: number,
  outerRadius: number,
  wallThickness: number,
  neckOuterRadius: number
): CrossSection {
  const tessellated = tessellateProfile(profilePoints);

  // Map normalized profile to actual dimensions
  // Profile X (0..1) -> height (0..bodyHeight)
  // Profile Y (0..1) -> radius (0..outerRadius)
  //
  // CRITICAL: The top point (last point, x~=1) MUST be exactly neckOuterRadius
  // so the body wall connects flush to the neck cylinder with no gap.
  const outerPoints: Vec2[] = tessellated.map((p) => {
    const height = p.x * bodyHeight;
    const radius = p.y * outerRadius;
    return [radius, height] as Vec2;
  });

  // If the neck is narrower than the body top, add a shoulder transition:
  // insert a horizontal shelf from the body's natural top radius down to
  // neckOuterRadius so the body wall connects flush to the neck cylinder.
  const lastOuter = outerPoints[outerPoints.length - 1];
  if (neckOuterRadius < lastOuter[0] - 0.01) {
    // Replace last point with the neck radius at the same height
    outerPoints[outerPoints.length - 1] = [neckOuterRadius, lastOuter[1]];
    // Insert a shoulder point just below at the body's natural radius
    const shoulderHeight = lastOuter[1] - 0.01;
    outerPoints.splice(outerPoints.length - 1, 0, [lastOuter[0], shoulderHeight]);
  }

  // Build inner wall by offsetting inward by wallThickness
  const innerPoints: Vec2[] = outerPoints.map(([r, h]) => {
    const innerR = Math.max(0, r - wallThickness);
    return [innerR, h] as Vec2;
  }).reverse();

  // Build the closed polygon (CCW for Manifold)
  const polygon: Vec2[] = [];

  // Outer wall: bottom to top
  for (const p of outerPoints) {
    polygon.push(p);
  }

  // Top edge: outer to inner (close the top opening - we leave it open for the neck)
  // Actually, for a bottle body, the top is open (neck attaches here)
  // So we go from outer-top down the inner wall

  // Inner wall: top to bottom (reversed)
  for (const p of innerPoints) {
    polygon.push(p);
  }

  // Bottom closing: inner-bottom to outer-bottom
  // The floor is at Y=0 with thickness wallThickness
  // inner wall bottom point is at [innerR_bottom, 0]
  // outer wall bottom point is at [outerR_bottom, 0]
  // We need to close the floor as a solid
  // The polygon already connects inner-bottom back to outer-bottom implicitly

  // Deduplicate consecutive points
  const cleaned: Vec2[] = [polygon[0]];
  for (let i = 1; i < polygon.length; i++) {
    const prev = cleaned[cleaned.length - 1];
    const curr = polygon[i];
    if (Math.abs(curr[0] - prev[0]) > 0.001 || Math.abs(curr[1] - prev[1]) > 0.001) {
      cleaned.push(curr);
    }
  }

  return new wasm.CrossSection([cleaned]);
}

/**
 * Builds a simple annular (ring) cross-section for the neck zone.
 * This is a rectangle in the revolution plane.
 */
export function buildNeckCrossSection(
  wasm: ManifoldToplevel,
  outerRadius: number,
  innerRadius: number,
  height: number
): CrossSection {
  const polygon: Vec2[] = [
    [innerRadius, 0],
    [outerRadius, 0],
    [outerRadius, height],
    [innerRadius, height],
  ];
  return new wasm.CrossSection([polygon]);
}

/**
 * Builds a solid disk cross-section for the bottle floor.
 */
export function buildFloorCrossSection(
  wasm: ManifoldToplevel,
  outerRadius: number,
  thickness: number
): CrossSection {
  const polygon: Vec2[] = [
    [0, 0],
    [outerRadius, 0],
    [outerRadius, thickness],
    [0, thickness],
  ];
  return new wasm.CrossSection([polygon]);
}
