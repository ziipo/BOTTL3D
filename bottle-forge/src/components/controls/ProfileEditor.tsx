import { useCallback, useRef, useState } from 'react';
import { useBottleStore } from '../../store/useBottleStore';
import type { ProfilePoint } from '../../types/bottle';

const SVG_W = 260;
const SVG_H = 160;
const PAD = 24;
const PLOT_W = SVG_W - PAD * 2;
const PLOT_H = SVG_H - PAD * 2;
const POINT_R = 6;
const HANDLE_R = 4;
const DRAG_THRESHOLD = 4;

type DragTarget =
  | { kind: 'anchor'; index: number }
  | { kind: 'handle'; index: number }
  | { kind: 'new-point'; index: number; originSx: number; originSy: number };

// Bottle profile: X=bottom..top (vertical), Y=center..edge (horizontal)
// SVG: left=bottom, right=top (horizontal), top=edge, bottom=center
function toSvg(p: { x: number; y: number }): { x: number; y: number } {
  return {
    x: PAD + p.x * PLOT_W,
    y: PAD + (1 - p.y) * PLOT_H,
  };
}

function fromSvg(sx: number, sy: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(1, (sx - PAD) / PLOT_W)),
    y: Math.max(0, Math.min(1, 1 - (sy - PAD) / PLOT_H)),
  };
}

function handleDeltaToSvg(hx: number, hy: number): { dx: number; dy: number } {
  return { dx: hx * PLOT_W, dy: -hy * PLOT_H };
}

function svgDeltaToHandle(dx: number, dy: number): { hx: number; hy: number } {
  return { hx: dx / PLOT_W, hy: -dy / PLOT_H };
}

function hasHandle(p: ProfilePoint): boolean {
  return (p.hx != null && p.hx !== 0) || (p.hy != null && p.hy !== 0);
}

function buildCurvePath(points: ProfilePoint[]): string {
  if (points.length === 0) return '';
  const s0 = toSvg(points[0]);
  let d = `M ${s0.x} ${s0.y}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i];
    const p1 = points[i + 1];

    if (!hasHandle(p0) && !hasHandle(p1)) {
      const s1 = toSvg(p1);
      d += ` L ${s1.x} ${s1.y}`;
    } else {
      const cp1 = toSvg({ x: p0.x + (p0.hx ?? 0), y: p0.y + (p0.hy ?? 0) });
      const cp2 = toSvg({ x: p1.x - (p1.hx ?? 0), y: p1.y - (p1.hy ?? 0) });
      const s1 = toSvg(p1);
      d += ` C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${s1.x} ${s1.y}`;
    }
  }
  return d;
}

export function ProfileEditor() {
  const customProfilePoints = useBottleStore((s) => s.customProfilePoints);
  const setParam = useBottleStore((s) => s.setParam);
  const svgRef = useRef<SVGSVGElement>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);

  const sorted = [...customProfilePoints].sort((a, b) => a.x - b.x);

  const updatePoints = useCallback(
    (pts: ProfilePoint[]) => {
      setParam('customProfilePoints', pts);
    },
    [setParam]
  );

  const getSvgCoords = useCallback(
    (e: React.MouseEvent | React.PointerEvent): { x: number; y: number } => {
      const svg = svgRef.current;
      if (!svg) return { x: 0, y: 0 };
      const rect = svg.getBoundingClientRect();
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    },
    []
  );

  const handleAnchorPointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragTarget({ kind: 'anchor', index });
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    []
  );

  const handleHandlePointerDown = useCallback(
    (e: React.PointerEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      setDragTarget({ kind: 'handle', index });
      (e.target as Element).setPointerCapture(e.pointerId);
    },
    []
  );

  const handleSvgPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      const tag = (e.target as Element).tagName;
      if (tag === 'circle' || tag === 'line') return;

      const { x: sx, y: sy } = getSvgCoords(e);
      const pt = fromSvg(sx, sy);
      pt.x = Math.max(0, Math.min(1, Math.round(pt.x * 100) / 100));
      pt.y = Math.max(0, Math.min(1, Math.round(pt.y * 100) / 100));

      const newPoints = [...sorted, { x: pt.x, y: pt.y } as ProfilePoint];
      const newSorted = newPoints.sort((a, b) => a.x - b.x);
      const newIndex = newSorted.findIndex(p => p.x === pt.x && p.y === pt.y);

      updatePoints(newSorted);
      setDragTarget({ kind: 'new-point', index: newIndex, originSx: sx, originSy: sy });
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    },
    [sorted, getSvgCoords, updatePoints]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (dragTarget === null) return;
      const { x: sx, y: sy } = getSvgCoords(e);

      if (dragTarget.kind === 'anchor') {
        const pt = fromSvg(sx, sy);
        const newPoints = [...sorted];
        const isFirst = dragTarget.index === 0;
        const isLast = dragTarget.index === sorted.length - 1;
        if (isFirst) pt.x = 0;
        else if (isLast) pt.x = 1;

        const old = sorted[dragTarget.index];
        newPoints[dragTarget.index] = {
          x: pt.x,
          y: pt.y,
          ...(old.hx != null ? { hx: old.hx } : {}),
          ...(old.hy != null ? { hy: old.hy } : {}),
        };
        updatePoints(newPoints);
      } else if (dragTarget.kind === 'handle') {
        const anchor = sorted[dragTarget.index];
        const anchorSvg = toSvg(anchor);
        const dx = sx - anchorSvg.x;
        const dy = sy - anchorSvg.y;
        const h = svgDeltaToHandle(dx, dy);

        const newPoints = [...sorted];
        newPoints[dragTarget.index] = { ...anchor, hx: h.hx, hy: h.hy };
        updatePoints(newPoints);
      } else if (dragTarget.kind === 'new-point') {
        const dx = sx - dragTarget.originSx;
        const dy = sy - dragTarget.originSy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist >= DRAG_THRESHOLD) {
          const anchor = sorted[dragTarget.index];
          if (!anchor) return;
          const anchorSvg = toSvg(anchor);
          const hdx = sx - anchorSvg.x;
          const hdy = sy - anchorSvg.y;
          const h = svgDeltaToHandle(hdx, hdy);

          const newPoints = [...sorted];
          newPoints[dragTarget.index] = { ...anchor, hx: h.hx, hy: h.hy };
          updatePoints(newPoints);
        }
      }
    },
    [dragTarget, sorted, getSvgCoords, updatePoints]
  );

  const handlePointerUp = useCallback(() => {
    setDragTarget(null);
  }, []);

  const handleHandleDoubleClick = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      const newPoints = [...sorted];
      const p = newPoints[index];
      newPoints[index] = { x: p.x, y: p.y };
      updatePoints(newPoints);
    },
    [sorted, updatePoints]
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, index: number) => {
      e.preventDefault();
      e.stopPropagation();
      if (sorted.length <= 2) return;
      if (index === 0 || index === sorted.length - 1) return;
      const newPoints = sorted.filter((_, i) => i !== index);
      updatePoints(newPoints);
    },
    [sorted, updatePoints]
  );

  // Build filled shape path
  const shapePath = (() => {
    if (sorted.length === 0) return '';
    const curvePart = buildCurvePath(sorted);
    const bottomRight = toSvg({ x: 1, y: 0 });
    const bottomLeft = toSvg({ x: 0, y: 0 });
    return `${curvePart} L ${bottomRight.x} ${bottomRight.y} L ${bottomLeft.x} ${bottomLeft.y} Z`;
  })();

  const strokePath = sorted.length > 1 ? buildCurvePath(sorted) : '';

  // Grid lines
  const gridLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  for (let i = 1; i < 4; i++) {
    const frac = i * 0.25;
    const vx = PAD + frac * PLOT_W;
    gridLines.push({ x1: vx, y1: PAD, x2: vx, y2: PAD + PLOT_H });
    const hy = PAD + frac * PLOT_H;
    gridLines.push({ x1: PAD, y1: hy, x2: PAD + PLOT_W, y2: hy });
  }

  // Centerline (axis of revolution)
  const centerY = PAD + PLOT_H;

  return (
    <div className="mt-2">
      <svg
        ref={svgRef}
        width={SVG_W}
        height={SVG_H}
        className="bg-[var(--bg-sidebar)] border border-[var(--border-input)] cursor-crosshair select-none transition-colors"
        onPointerDown={handleSvgPointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Grid lines */}
        {gridLines.map((l, i) => (
          <line
            key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke="currentColor"
            className="text-[var(--border-input)]"
            strokeWidth={0.5}
            opacity={0.3}
          />
        ))}

        {/* Plot border */}
        <rect
          x={PAD} y={PAD} width={PLOT_W} height={PLOT_H}
          fill="none" stroke="currentColor"
          className="text-[var(--border-input)]"
          strokeWidth={1}
        />

        {/* Centerline (axis of revolution) */}
        <line
          x1={PAD} y1={centerY} x2={PAD + PLOT_W} y2={centerY}
          stroke="currentColor" strokeWidth={1} strokeDasharray="4,3" className="text-[var(--fg-muted)]" opacity={0.5}
        />

        {/* Axis labels */}
        <text x={PAD} y={SVG_H - 2} fill="currentColor" className="text-[var(--fg-muted)] font-technical" fontSize={8} textAnchor="middle">
          BOTTOM
        </text>
        <text x={PAD + PLOT_W} y={SVG_H - 2} fill="currentColor" className="text-[var(--fg-muted)] font-technical" fontSize={8} textAnchor="middle">
          TOP
        </text>
        <text x={8} y={PAD + PLOT_H} fill="currentColor" className="text-[var(--fg-muted)] font-technical" fontSize={8} textAnchor="middle">
          0
        </text>
        <text x={8} y={PAD + 4} fill="currentColor" className="text-[var(--fg-muted)] font-technical" fontSize={8} textAnchor="middle">
          R
        </text>

        {/* Neck lock indicator at top-right */}
        <rect
          x={PAD + PLOT_W - 8} y={PAD}
          width={8} height={PLOT_H}
          fill="currentColor" className="text-[var(--color-primary)]" opacity={0.1}
        />
        <text x={PAD + PLOT_W - 4} y={PAD + 10} fill="currentColor" className="text-[var(--color-primary)] font-technical" fontSize={7} textAnchor="middle" opacity={0.6}>
          N
        </text>

        {/* Profile shape fill */}
        <path d={shapePath} fill="currentColor" className="text-[var(--color-primary)]" opacity={0.15} />

        {/* Profile curve stroke */}
        {strokePath && (
          <path d={strokePath} fill="none" stroke="currentColor" className="text-[var(--color-primary)]" strokeWidth={2} />
        )}

        {/* Handle lines and dots */}
        {sorted.map((p, i) => {
          if (!hasHandle(p)) return null;
          const anchor = toSvg(p);
          const { dx, dy } = handleDeltaToSvg(p.hx ?? 0, p.hy ?? 0);
          const outX = anchor.x + dx;
          const outY = anchor.y + dy;
          const inX = anchor.x - dx;
          const inY = anchor.y - dy;
          const isActive = dragTarget?.kind === 'handle' && dragTarget.index === i;

          return (
            <g key={`handle-${i}`}>
              <line
                x1={inX} y1={inY} x2={outX} y2={outY}
                stroke="currentColor" strokeWidth={1} opacity={0.4}
                className="text-[var(--fg-muted)]"
                style={{ pointerEvents: 'none' }}
              />
              <circle
                cx={outX} cy={outY} r={HANDLE_R}
                fill="currentColor"
                className={`cursor-grab active:cursor-grabbing ${isActive ? 'text-[var(--fg-main)]' : 'text-[var(--fg-muted)]'}`}
                stroke="currentColor" strokeWidth={1}
                onPointerDown={(e) => handleHandlePointerDown(e, i)}
                onDoubleClick={(e) => handleHandleDoubleClick(e, i)}
              />
              <circle
                cx={inX} cy={inY} r={HANDLE_R}
                fill="currentColor"
                className={`cursor-grab active:cursor-grabbing ${isActive ? 'text-[var(--fg-main)]' : 'text-[var(--fg-muted)]'}`}
                stroke="currentColor" strokeWidth={1}
                onPointerDown={(e) => handleHandlePointerDown(e, i)}
                onDoubleClick={(e) => handleHandleDoubleClick(e, i)}
              />
            </g>
          );
        })}

        {/* Draggable anchor points */}
        {sorted.map((p, i) => {
          const s = toSvg(p);
          const isEndpoint = i === 0 || i === sorted.length - 1;
          const isActive = dragTarget?.kind === 'anchor' && dragTarget.index === i;
          return (
            <circle
              key={i}
              cx={s.x} cy={s.y} r={POINT_R}
              fill="currentColor"
              className={`cursor-grab active:cursor-grabbing ${isActive ? 'text-[var(--fg-main)]' : 'text-[var(--color-primary)]'}`}
              stroke="currentColor"
              strokeWidth={isEndpoint ? 2 : 1.5}
              onPointerDown={(e) => handleAnchorPointerDown(e, i)}
              onContextMenu={(e) => handleContextMenu(e, i)}
            />
          );
        })}
      </svg>

      <p className="text-[9px] text-[var(--fg-muted)] mt-1 font-technical uppercase tracking-wider">
        CLICK TO ADD · DRAG TO CURVE · DRAG POINT TO MOVE · RIGHT-CLICK TO DELETE
      </p>
    </div>
  );
}
