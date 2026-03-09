import type { Manifold, ManifoldToplevel, Vec2 } from 'manifold-3d';
import type { ThreadSettings } from '../types/bottle';

/**
 * Generates a helical thread using CrossSection.extrude() with twist.
 *
 * Strategy:
 * 1. Build a 2D cross-section of one tooth (annular wedge, trapezoidal profile)
 * 2. Extrude it along Z with twist = 360° × turns and many nDivisions
 *    → this directly produces a helical thread with proper solid geometry
 * 3. Optionally warp start/end for chamfered lead-in
 *
 * The thread tooth cross-section is built in XY plane as a wedge-shaped
 * annular sector. When extruded with twist, the wedge traces a helix.
 *
 * Thread profile: Trapezoidal (FDM-printable, no overhangs)
 *   - Flat crest and root
 *   - ~30° flanks
 *
 * @param cylinderRadius - outer radius of the neck (male) or inner radius of lid bore (female)
 * @param startZ - Z position where thread starts
 * @param settings - pitch, turns, depth, clearance
 * @param isInternal - true for female (lid) thread, false for male (bottle neck)
 */
export function generateThread(
  wasm: ManifoldToplevel,
  cylinderRadius: number,
  startZ: number,
  settings: ThreadSettings,
  isInternal: boolean = false
): Manifold {
  const { pitch, turns, depth } = settings;
  // For male thread: depth is how far it protrudes from the cylinder surface.
  // For female thread: depth is how far ridges protrude from the bore wall.
  //   The bore is already sized to clear the male crests with clearance,
  //   so the female ridge depth = male depth (they interlock symmetrically).
  const effectiveDepth = depth;
  const threadLength = pitch * turns;

  // The tooth occupies an angular fraction of the full circle.
  // For a single-start thread: tooth angular width ≈ (toothWidth / pitch) × 360°
  // But since we're extruding with twist, the "width" in the pitch direction
  // becomes the angular extent of the cross-section.
  //
  // Tooth proportions (ACME-like):
  //   base width = 55% of pitch (at the root)
  //   crest width = 35% of pitch (at the tip)
  //
  // The cross-section angular extent corresponds to how much of 360° one pitch
  // of the tooth occupies. Since extrude twist maps Z→angle, and one pitch
  // maps to 360°/turns of Z height, the tooth angular span in degrees is:
  //   toothAngle = (toothWidthFraction) × 360°
  const toothAngleDeg = 0.5 * 360; // tooth occupies 50% of one pitch (180°)
  const toothAngleRad = toothAngleDeg * Math.PI / 180;

  // Build the 2D tooth cross-section in XY plane
  // It's an annular wedge: inner arc at root radius, outer arc at crest radius.
  //
  // Root extends 0.3mm past the cylinder surface to ensure proper CSG overlap
  // (avoids co-planar surfaces which produce unpredictable results).
  const overlap = 0.3;
  const rootR = isInternal
    ? cylinderRadius + overlap   // female: root extends outward into lid wall
    : cylinderRadius - overlap;  // male: root extends inward into neck
  const crestR = isInternal
    ? cylinderRadius - effectiveDepth
    : cylinderRadius + effectiveDepth;

  // The trapezoid has a narrower crest than root, so:
  // root arc: ±toothAngleRad/2
  // crest arc: ±(crestFraction × toothAngleRad/2), where crestFraction = 0.35/0.55 ≈ 0.636
  const crestFraction = 0.636;
  const halfRootAngle = toothAngleRad / 2;
  const halfCrestAngle = halfRootAngle * crestFraction;

  // Build polygon points in CCW order (required by CrossSection for positive area).
  // The outer arc goes CCW (-angle to +angle), inner arc goes CW (+angle to -angle).
  // For male thread: crestR > rootR, so crest is outer.
  // For female thread: rootR > crestR, so root is outer.
  const arcSteps = 8;
  const polygon: Vec2[] = [];

  const outerR = Math.max(crestR, rootR);
  const innerR = Math.min(crestR, rootR);
  const outerHalfAngle = crestR > rootR ? halfCrestAngle : halfRootAngle;
  const innerHalfAngle = crestR > rootR ? halfRootAngle : halfCrestAngle;

  // Outer arc (CCW: -angle to +angle)
  for (let i = 0; i <= arcSteps; i++) {
    const a = -outerHalfAngle + (i / arcSteps) * (2 * outerHalfAngle);
    polygon.push([outerR * Math.cos(a), outerR * Math.sin(a)]);
  }

  // Inner arc (CW: +angle to -angle, closing the polygon)
  for (let i = arcSteps; i >= 0; i--) {
    const a = -innerHalfAngle + (i / arcSteps) * (2 * innerHalfAngle);
    polygon.push([innerR * Math.cos(a), innerR * Math.sin(a)]);
  }

  const crossSection = new wasm.CrossSection([polygon]);

  // Extrude with twist to create the helix
  // Total twist = 360° × turns (one full revolution per turn)
  const twistDegrees = 360 * turns;
  // nDivisions: more = smoother helix. ~32 divisions per turn is good.
  const nDivisions = Math.round(32 * turns);

  let thread = wasm.Manifold.extrude(
    crossSection,
    threadLength,
    nDivisions,
    twistDegrees
  );
  crossSection.delete();

  // Warp to apply chamfer at start and end (taper the thread depth to 0)
  // Chamfer lerps vertices toward the nominal cylinder surface (not the overlapping root)
  const chamferLength = pitch * 0.5;
  const chamferTargetR = cylinderRadius;
  thread = thread.warp((v: [number, number, number]) => {
    const z = v[2];
    let chamfer = 1.0;
    if (z < chamferLength) {
      chamfer = z / chamferLength;
    } else if (z > threadLength - chamferLength) {
      chamfer = (threadLength - z) / chamferLength;
    }
    if (chamfer < 1.0) {
      const x = v[0], y = v[1];
      const r = Math.sqrt(x * x + y * y);
      if (r > 0.001) {
        const targetR = chamferTargetR + (r - chamferTargetR) * chamfer;
        const scale = targetR / r;
        v[0] = x * scale;
        v[1] = y * scale;
      }
    }
  });

  // Translate to the correct Z start position
  thread = thread.translate([0, 0, startZ]);

  return thread;
}
