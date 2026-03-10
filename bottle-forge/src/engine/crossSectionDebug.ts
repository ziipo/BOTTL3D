import type { Manifold, ManifoldToplevel } from 'manifold-3d';

/**
 * Debug utility: generates an SVG showing the radial cross-section of
 * the bottle and lid manifolds, sliced through the center axis.
 *
 * The cross-section is taken along the XZ plane (Y=0). This shows the
 * wall thickness, thread profile, neck/body junction, and lid fit.
 *
 * Approach:
 * - Trim the manifold to keep only the Y>=0 half
 * - Rotate 90° around X so the cut face (XZ plane) becomes XY
 * - Use manifold.slice(0) to extract the 2D cross-section
 * - Convert to SVG
 *
 * @returns SVG string
 */
export function generateCrossSectionSVG(
  wasm: ManifoldToplevel,
  bottle: Manifold,
  lid: Manifold
): string {
  // Slice both manifolds and extract 2D polygons
  const bottlePolygons = extractRadialCrossSection(wasm, bottle);
  const lidPolygons = extractRadialCrossSection(wasm, lid);

  // Compute bounding box for SVG viewport
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  const updateBounds = (polygons: [number, number][][]) => {
    for (const poly of polygons) {
      for (const [x, y] of poly) {
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);
        maxY = Math.max(maxY, y);
      }
    }
  };
  updateBounds(bottlePolygons);
  updateBounds(lidPolygons);

  if (!isFinite(minX)) {
    return '<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400"><text x="20" y="30" fill="red">No cross-section data</text></svg>';
  }

  // Add margins
  const margin = 5;
  minX -= margin;
  maxX += margin;
  minY -= margin;
  maxY += margin;

  const width = maxX - minX;
  const height = maxY - minY;

  // SVG scale: fit into ~800px wide viewport
  const svgWidth = 800;
  const svgHeight = Math.round((height / width) * svgWidth);

  // Build SVG paths
  // In the cross-section: X = radial distance from center, Y = height (Z in 3D)
  // SVG Y is inverted (0 at top), so we flip Y
  const pathForPolygons = (polygons: [number, number][][]) => {
    return polygons.map(poly => {
      if (poly.length < 2) return '';
      const points = poly.map(([x, y]) =>
        `${((x - minX) / width * svgWidth).toFixed(2)},${((1 - (y - minY) / height) * svgHeight).toFixed(2)}`
      );
      return `M ${points.join(' L ')} Z`;
    }).filter(p => p.length > 0).join(' ');
  };

  const bottlePath = pathForPolygons(bottlePolygons);
  const lidPath = pathForPolygons(lidPolygons);

  // Grid lines at 10mm intervals
  const gridLines: string[] = [];
  const gridStart = Math.floor(minX / 10) * 10;
  const gridEndX = Math.ceil(maxX / 10) * 10;
  const gridEndY = Math.ceil(maxY / 10) * 10;

  // Vertical grid lines (radial positions)
  for (let x = gridStart; x <= gridEndX; x += 10) {
    const sx = ((x - minX) / width * svgWidth).toFixed(2);
    gridLines.push(`<line x1="${sx}" y1="0" x2="${sx}" y2="${svgHeight}" />`);
    // Label
    gridLines.push(`<text x="${sx}" y="${svgHeight - 2}" class="grid-label">${x.toFixed(0)}</text>`);
  }

  // Horizontal grid lines (height positions)
  const gridStartY = Math.floor(minY / 10) * 10;
  for (let y = gridStartY; y <= gridEndY; y += 10) {
    const sy = ((1 - (y - minY) / height) * svgHeight).toFixed(2);
    gridLines.push(`<line x1="0" y1="${sy}" x2="${svgWidth}" y2="${sy}" />`);
    gridLines.push(`<text x="2" y="${parseFloat(sy) - 2}" class="grid-label">${y.toFixed(0)}</text>`);
  }

  // Center axis line (X=0)
  const axisX = ((0 - minX) / width * svgWidth).toFixed(2);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${svgWidth}" height="${svgHeight}" viewBox="0 0 ${svgWidth} ${svgHeight}">
  <style>
    .grid { stroke: #ddd; stroke-width: 0.5; }
    .grid-label { font: 9px monospace; fill: #999; }
    .axis { stroke: #f00; stroke-width: 1; stroke-dasharray: 4 2; }
    .bottle { fill: #ccc; fill-opacity: 0.6; stroke: #333; stroke-width: 1; }
    .lid { fill: #7cb9e8; fill-opacity: 0.5; stroke: #2563eb; stroke-width: 1; }
    .title { font: bold 14px sans-serif; fill: #333; }
    .subtitle { font: 11px monospace; fill: #666; }
  </style>
  <rect width="100%" height="100%" fill="white"/>
  <!-- Grid -->
  <g class="grid">${gridLines.join('\n    ')}</g>
  <!-- Center axis -->
  <line class="axis" x1="${axisX}" y1="0" x2="${axisX}" y2="${svgHeight}" />
  <!-- Bottle cross-section -->
  <path class="bottle" d="${bottlePath}" fill-rule="evenodd"/>
  <!-- Lid cross-section -->
  <path class="lid" d="${lidPath}" fill-rule="evenodd"/>
  <!-- Labels -->
  <text class="title" x="10" y="20">BOTTL3D Cross-Section (XZ plane, mm)</text>
  <text class="subtitle" x="10" y="36">Grey: bottle | Blue: lid | Red dashed: center axis</text>
</svg>`;
}

/**
 * Extract the radial (XZ plane) cross-section of a manifold as 2D polygon arrays.
 *
 * Strategy: sample the manifold at many Z heights using slice(), then
 * reconstruct the 2D cross-section outline from the horizontal slices.
 * Each slice gives the radial extent at that height.
 *
 * Returns an array of polygons, each an array of [x, y] points where
 * x = radial distance (was X in 3D) and y = height (was Z in 3D).
 */
function extractRadialCrossSection(
  _wasm: ManifoldToplevel,
  manifold: Manifold
): [number, number][][] {
  // Get bounding box to know the Z range
  const bbox = manifold.boundingBox();
  const zMin = bbox.min[2];
  const zMax = bbox.max[2];


  if (zMax - zMin < 0.01) return [];

  // Sample at many Z heights
  const numSlices = 200;
  const step = (zMax - zMin) / numSlices;

  // For each slice, find the min/max X at Y≈0 (the radial cross-section line)
  // We sample the CrossSection polygon at each Z
  const outerProfile: [number, number][] = []; // right side (positive X)
  const innerProfile: [number, number][] = []; // inner wall (if hollow)

  for (let i = 0; i <= numSlices; i++) {
    const z = zMin + i * step;
    const cs = manifold.slice(z);
    const polys = cs.toPolygons();
    cs.delete();

    if (polys.length === 0) continue;

    // Find the radial extents along the X axis (at Y≈0)
    // We scan all polygon edges for intersections with Y=0
    const xIntersections: number[] = [];

    for (const poly of polys) {
      for (let j = 0; j < poly.length; j++) {
        const p1 = poly[j];
        const p2 = poly[(j + 1) % poly.length];
        const y1 = p1[1], y2 = p2[1];

        // Check if edge crosses Y=0
        if ((y1 <= 0 && y2 >= 0) || (y1 >= 0 && y2 <= 0)) {
          if (Math.abs(y2 - y1) < 1e-10) {
            // Edge is on Y=0
            xIntersections.push(p1[0], p2[0]);
          } else {
            const t = (0 - y1) / (y2 - y1);
            const x = p1[0] + t * (p2[0] - p1[0]);
            xIntersections.push(x);
          }
        }
      }
    }

    if (xIntersections.length === 0) continue;

    // Sort intersections - they represent inside/outside boundaries
    // For positive X side: collect all positive intersections
    const positiveX = xIntersections.filter(x => x >= -0.1).sort((a, b) => a - b);

    if (positiveX.length >= 2) {
      // Outermost and innermost positive X values
      // For a hollow body: inner wall and outer wall
      innerProfile.push([positiveX[0], z]);
      outerProfile.push([positiveX[positiveX.length - 1], z]);
    } else if (positiveX.length === 1) {
      // Solid at this height
      outerProfile.push([positiveX[0], z]);
    }
  }

  if (outerProfile.length === 0) return [];

  // Build a closed polygon: outer wall down, inner wall up
  const polygon: [number, number][] = [];

  // Outer wall (bottom to top)
  for (const pt of outerProfile) polygon.push(pt);

  // Inner wall (top to bottom)
  if (innerProfile.length > 0) {
    for (let i = innerProfile.length - 1; i >= 0; i--) {
      polygon.push(innerProfile[i]);
    }
  }

  return [polygon];
}
