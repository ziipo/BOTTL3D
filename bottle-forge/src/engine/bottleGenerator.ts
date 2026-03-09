import type { Manifold, ManifoldToplevel, Mesh } from 'manifold-3d';
import type { BottleParams } from '../types/bottle';
import { getProfile, getProfileForParams } from '../data/profiles';
import { buildBodyCrossSection, buildFloorCrossSection, buildNeckCrossSection } from './profileBuilder';
import { generateThread } from './threadGenerator';
import { applyTexture } from './textureGenerator';

const REVOLVE_SEGMENTS = 64;

interface BottleResult {
  bottleManifold: Manifold;
  bottleMesh: Mesh;
  lidManifold: Manifold;
  lidMesh: Mesh;
}

/**
 * Generates a bottle and lid using profile-based revolution.
 *
 * Zone System:
 * - Neck Zone: immutable cylinder at the top, threads/lid mechanics
 * - Body Zone: shaped by profile splines, textures, labels
 */
export function generateBottle(
  wasm: ManifoldToplevel,
  params: BottleParams
): BottleResult {
  const {
    outerDiameter,
    neckDiameter,
    neckDiameterAuto,
    overallHeight,
    wallThickness,
    bodyStyle,
    lidType,
    lidHeight,
    slipOnClearance,
    thread,
    texture,
  } = params;

  const outerRadius = outerDiameter / 2;
  const neckHeight = 10; // Fixed neck zone height
  const bodyHeight = overallHeight - neckHeight;

  // Get profile for body shape.
  // Only 'shape' mode uses the user's profile; texture/label force cylinder.
  const profile = bodyStyle === 'shape'
    ? getProfileForParams(params)
    : getProfile('cylinder')!;

  // Compute effective neck radius: auto derives from profile top point,
  // manual uses the explicit neckDiameter parameter.
  const profileTopY = profile.points[profile.points.length - 1].y;
  const autoNeckOuterRadius = profileTopY * outerRadius;
  const neckOuterRadius = neckDiameterAuto
    ? Math.max(autoNeckOuterRadius, wallThickness * 2)
    : neckDiameter / 2;
  const neckInnerRadius = neckOuterRadius - wallThickness;

  // --- Build Bottle Body ---
  // Body cross-section from profile, revolved around Y axis
  const bodyCrossSection = buildBodyCrossSection(
    wasm,
    profile.points,
    bodyHeight,
    outerRadius,
    wallThickness,
    neckOuterRadius
  );
  let body = wasm.Manifold.revolve(bodyCrossSection, REVOLVE_SEGMENTS);
  bodyCrossSection.delete();

  // Floor disk (solid bottom)
  const floorCrossSection = buildFloorCrossSection(wasm, outerRadius, wallThickness);
  const floor = wasm.Manifold.revolve(floorCrossSection, REVOLVE_SEGMENTS);
  floorCrossSection.delete();

  // Union body with floor
  body = wasm.Manifold.union(body, floor);

  // --- Apply Surface Texture to Body Zone ---
  if (bodyStyle === 'texture' && texture.type !== 'none') {
    body = applyTexture(wasm, body, bodyHeight, outerRadius, texture);
  }

  // --- Build Neck Zone ---
  // Simple annular cylinder at the top of the body
  const neckCrossSection = buildNeckCrossSection(
    wasm,
    neckOuterRadius,
    neckInnerRadius,
    neckHeight
  );
  let neck = wasm.Manifold.revolve(neckCrossSection, REVOLVE_SEGMENTS);
  neckCrossSection.delete();

  // Translate neck to top of body (revolve is around Z-axis, so height is along Z)
  neck = neck.translate([0, 0, bodyHeight]);

  // Union body + neck
  let bottle = wasm.Manifold.union(body, neck);

  // --- Screw-on threads on neck ---
  if (lidType === 'screw-on') {
    // Male thread sits on the neck exterior surface
    // Neck starts at bodyHeight, thread starts slightly above that
    const threadStartZ = bodyHeight + 1; // 1mm above body/neck junction
    const maleThread = generateThread(wasm, neckOuterRadius, threadStartZ, thread, false);
    bottle = wasm.Manifold.union(bottle, maleThread);
  }

  // --- Build Lid ---
  const lid = buildLid(wasm, neckOuterRadius, neckInnerRadius, wallThickness, lidHeight, lidType, slipOnClearance, thread, overallHeight);

  // Get meshes
  const bottleMesh = bottle.getMesh();
  const lidMesh = lid.getMesh();

  return {
    bottleManifold: bottle,
    bottleMesh,
    lidManifold: lid,
    lidMesh,
  };
}

/**
 * Builds a lid (slip-on or screw-on shell).
 * Positioned above the bottle for exploded view.
 */
function buildLid(
  wasm: ManifoldToplevel,
  bottleOuterRadius: number,
  bottleInnerRadius: number,
  wallThickness: number,
  lidHeight: number,
  lidType: 'slip-on' | 'screw-on',
  clearance: number,
  thread: BottleParams['thread'],
  bottleHeight: number
): Manifold {
  // For screw-on lid:
  //   The bore must be wide enough to clear the male thread crests.
  //   Male thread crests are at bottleOuterRadius + thread.depth.
  //   Lid bore = crests + clearance.
  //   Then we ADD female thread ridges inside the bore (protruding inward),
  //   so their crests engage with the male thread grooves.
  const lidInnerRadius = lidType === 'screw-on'
    ? bottleOuterRadius + thread.depth + thread.clearance
    : bottleOuterRadius + clearance;
  const lidOuterRadius = lidInnerRadius + wallThickness;

  // Lid is a hollow cap: outer cylinder - inner cylinder (solid top remains)
  const outerCyl = wasm.Manifold.cylinder(lidHeight, lidOuterRadius, lidOuterRadius, REVOLVE_SEGMENTS);

  const innerCylHeight = lidHeight - wallThickness;
  const innerCyl = wasm.Manifold.cylinder(innerCylHeight, lidInnerRadius, lidInnerRadius, REVOLVE_SEGMENTS);

  let lid = wasm.Manifold.difference(outerCyl, innerCyl);

  // For slip-on: add an inner lip for grip
  if (lidType === 'slip-on') {
    const lipHeight = Math.min(5, innerCylHeight * 0.5);
    const lipOuterRadius = bottleOuterRadius + clearance;
    const lipInnerRadius = bottleInnerRadius;

    if (lipInnerRadius > 0 && lipOuterRadius > lipInnerRadius) {
      const lipOuter = wasm.Manifold.cylinder(lipHeight, lipOuterRadius, lipOuterRadius, REVOLVE_SEGMENTS);
      const lipInner = wasm.Manifold.cylinder(lipHeight, lipInnerRadius, lipInnerRadius, REVOLVE_SEGMENTS);
      const lip = wasm.Manifold.difference(lipOuter, lipInner);
      lid = wasm.Manifold.union(lid, lip);
    }
  }

  // For screw-on: add female thread ridges inside the bore
  if (lidType === 'screw-on') {
    // Lid is built with bottom at Z=0 (open end), top cap at Z=lidHeight.
    // Thread starts 1mm inside from the opening.
    const femaleThreadStartZ = 1;

    const maxThreadLength = thread.pitch * thread.turns;
    if (maxThreadLength < innerCylHeight - 2) {
      // Female thread: root at lidInnerRadius (bore wall), crest protrudes
      // inward toward the bottle neck. The female thread is a solid that gets
      // UNIONED with the lid shell.
      const femaleThread = generateThread(wasm, lidInnerRadius, femaleThreadStartZ, thread, true);
      lid = wasm.Manifold.union(lid, femaleThread);
    }
  }

  // Position lid flush on top of bottle for export
  lid = lid.translate([0, 0, bottleHeight]);

  return lid;
}
