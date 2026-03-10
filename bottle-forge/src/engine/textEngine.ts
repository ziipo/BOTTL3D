import opentype from 'opentype.js';
import type { Vec2 } from 'manifold-3d';

/**
 * Parsed fonts ready for text→polygon conversion.
 */
const fontCache = new Map<string, opentype.Font>();
const fontLoadPromises = new Map<string, Promise<opentype.Font>>();

const FONT_MAP = {
  'Roboto': 'Roboto-Bold.ttf',
  'Pacifico': 'Pacifico-Regular.ttf',
  'Patrick Hand': 'PatrickHand-Regular.ttf',
  'Arvo': 'Arvo-Bold.ttf'
};

/**
 * Load and cache a font file.
 */
export async function loadFont(family: keyof typeof FONT_MAP = 'Roboto'): Promise<opentype.Font> {
  const fileName = FONT_MAP[family];
  const fontUrl = `${import.meta.env.BASE_URL}fonts/${fileName}`;
  
  if (fontCache.has(family)) return fontCache.get(family)!;
  if (fontLoadPromises.has(family)) return fontLoadPromises.get(family)!;

  const promise = (async () => {
    const response = await fetch(fontUrl);
    if (!response.ok) {
      fontLoadPromises.delete(family);
      throw new Error(`Failed to load font: ${response.status} ${response.statusText} (${fontUrl})`);
    }
    const buffer = await response.arrayBuffer();
    const font = opentype.parse(buffer);
    fontCache.set(family, font);
    return font;
  })();

  fontLoadPromises.set(family, promise);
  return promise;
}

/**
 * Number of line segments per bezier curve when discretizing.
 */
const BEZIER_STEPS = 8;

/**
 * Discretize a cubic bezier curve into line segments.
 */
function discretizeCubic(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  points: Vec2[]
): void {
  for (let i = 1; i <= BEZIER_STEPS; i++) {
    const t = i / BEZIER_STEPS;
    const mt = 1 - t;
    const x = mt * mt * mt * x0 + 3 * mt * mt * t * x1 + 3 * mt * t * t * x2 + t * t * t * x3;
    const y = mt * mt * mt * y0 + 3 * mt * mt * t * y1 + 3 * mt * t * t * y2 + t * t * t * y3;
    points.push([x, y]);
  }
}

/**
 * Discretize a quadratic bezier curve into line segments.
 */
function discretizeQuadratic(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  points: Vec2[]
): void {
  for (let i = 1; i <= BEZIER_STEPS; i++) {
    const t = i / BEZIER_STEPS;
    const mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * x1 + t * t * x2;
    const y = mt * mt * y0 + 2 * mt * t * y1 + t * t * y2;
    points.push([x, y]);
  }
}

/**
 * Compute signed area of a polygon (positive = CCW, negative = CW).
 */
function signedArea(points: Vec2[]): number {
  let area = 0;
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length;
    area += points[i][0] * points[j][1];
    area -= points[j][0] * points[i][1];
  }
  return area / 2;
}

/**
 * Convert text string to an array of 2D polygon contours.
 *
 * Returns polygons in mm units, centered at origin.
 * Outer contours are CCW (positive area), holes are CW (negative area).
 * This matches manifold-3d's CrossSection convention.
 *
 * @param text The string to convert
 * @param fontSize Height in mm
 * @param font The loaded opentype font
 * @returns Array of polygon contours (each is Vec2[])
 */
export function textToPolygons(
  text: string,
  fontSize: number,
  font: opentype.Font
): Vec2[][] {
  const path = font.getPath(text, 0, 0, fontSize);
  const contours: Vec2[][] = [];
  let current: Vec2[] = [];
  let curX = 0;
  let curY = 0;

  for (const cmd of path.commands) {
    switch (cmd.type) {
      case 'M':
        // Start a new contour; save previous if non-empty
        if (current.length > 2) {
          contours.push(current);
        }
        current = [[cmd.x, -cmd.y]]; 
        curX = cmd.x;
        curY = -cmd.y;
        break;

      case 'L':
        current.push([cmd.x, -cmd.y]);
        curX = cmd.x;
        curY = -cmd.y;
        break;

      case 'C':
        discretizeCubic(
          curX, curY,
          cmd.x1, -cmd.y1,
          cmd.x2, -cmd.y2,
          cmd.x, -cmd.y,
          current
        );
        curX = cmd.x;
        curY = -cmd.y;
        break;

      case 'Q':
        discretizeQuadratic(
          curX, curY,
          cmd.x1, -cmd.y1,
          cmd.x, -cmd.y,
          current
        );
        curX = cmd.x;
        curY = -cmd.y;
        break;

      case 'Z':
        if (current.length > 2) {
          contours.push(current);
        }
        current = [];
        break;
    }
  }

  // Push final contour if not closed
  if (current.length > 2) {
    contours.push(current);
  }

  // Opentype fonts typically give CW outer contours (TrueType convention).
  // Flipping the Y axis naturally converts outer contours to CCW and holes to CW,
  // which perfectly matches Manifold CrossSection's EvenOdd requirement.
  const result: Vec2[][] = [];
  for (const contour of contours) {
    const area = signedArea(contour);
    if (area === 0) continue; // degenerate

    result.push(contour);
  }

  // Center the polygons at origin
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  for (const contour of result) {
    for (const [x, y] of contour) {
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
    }
  }
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;

  for (const contour of result) {
    for (let i = 0; i < contour.length; i++) {
      contour[i] = [contour[i][0] - cx, contour[i][1] - cy];
    }
  }

  return result;
}

/**
 * Get the width of rendered text in mm.
 */
export function getTextWidth(text: string, fontSize: number, font: opentype.Font): number {
  const path = font.getPath(text, 0, 0, fontSize);
  let minX = Infinity, maxX = -Infinity;
  for (const cmd of path.commands) {
    if ('x' in cmd) {
      minX = Math.min(minX, cmd.x);
      maxX = Math.max(maxX, cmd.x);
    }
  }
  return maxX - minX;
}
