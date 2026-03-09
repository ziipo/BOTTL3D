import type { BottleProfile, BottleParams } from '../types/bottle';

/**
 * Bottle profile coordinate system:
 * - X: 0 = bottom of body, 1 = top of body (neck junction)
 * - Y: 0 = center axis, 1 = maximum radius
 *
 * The top point (x=1) is always clamped to the neck radius
 * to ensure proper zone system enforcement.
 */

export const bottleProfiles: BottleProfile[] = [
  {
    id: 'cylinder',
    name: 'Cylinder',
    description: 'Straight-sided cylindrical body',
    points: [
      { x: 0, y: 1 },
      { x: 1, y: 1 },
    ],
  },
  {
    id: 'hourglass',
    name: 'Hourglass',
    description: 'Pinched waist shape',
    points: [
      { x: 0, y: 1 },
      { x: 0.5, y: 0.7, hx: 0.15, hy: 0 },
      { x: 1, y: 1 },
    ],
  },
  {
    id: 'barrel',
    name: 'Barrel',
    description: 'Convex barrel shape',
    points: [
      { x: 0, y: 0.85 },
      { x: 0.5, y: 1, hx: 0.2, hy: 0 },
      { x: 1, y: 0.85 },
    ],
  },
  {
    id: 'tapered',
    name: 'Tapered',
    description: 'Wider at bottom, narrower at top',
    points: [
      { x: 0, y: 1 },
      { x: 1, y: 0.7 },
    ],
  },
  {
    id: 'vase',
    name: 'Vase',
    description: 'Wide body with narrow neck transition',
    points: [
      { x: 0, y: 0.9 },
      { x: 0.3, y: 1, hx: 0.1, hy: 0 },
      { x: 0.7, y: 0.95, hx: 0.1, hy: 0 },
      { x: 1, y: 0.7 },
    ],
  },
  {
    id: 'flask',
    name: 'Flask',
    description: 'Wide flat body with narrow top',
    points: [
      { x: 0, y: 1 },
      { x: 0.15, y: 1 },
      { x: 0.6, y: 1 },
      { x: 0.85, y: 0.6, hx: 0.1, hy: 0.1 },
      { x: 1, y: 0.5 },
    ],
  },
  {
    id: 's-curve',
    name: 'S-Curve',
    description: 'Elegant S-shaped profile',
    points: [
      { x: 0, y: 0.85 },
      { x: 0.25, y: 1, hx: 0.1, hy: 0 },
      { x: 0.75, y: 0.75, hx: 0.1, hy: 0 },
      { x: 1, y: 0.9 },
    ],
  },
  {
    id: 'faceted',
    name: 'Faceted',
    description: 'Angular faceted shape',
    points: [
      { x: 0, y: 0.9 },
      { x: 0.2, y: 1 },
      { x: 0.4, y: 0.85 },
      { x: 0.6, y: 0.95 },
      { x: 0.8, y: 0.8 },
      { x: 1, y: 0.9 },
    ],
  },
];

export const defaultProfileId = 'cylinder';

export function getProfile(id: string): BottleProfile | undefined {
  return bottleProfiles.find((p) => p.id === id);
}

/**
 * Get the profile for given params.
 * For 'custom' profileId, builds a BottleProfile from customProfilePoints.
 * For presets, delegates to getProfile().
 */
export function getProfileForParams(params: BottleParams): BottleProfile {
  if (params.profileId === 'custom') {
    const sorted = [...params.customProfilePoints].sort((a, b) => a.x - b.x);

    return {
      id: 'custom',
      name: 'Custom',
      description: 'User-defined profile',
      points: sorted,
    };
  }

  return getProfile(params.profileId) || getProfile('cylinder')!;
}
