import { useState } from 'react';
import { useBottleStore } from '../../store/useBottleStore';
import { convertToUnit, convertFromUnit, formatDimension } from '../../utils/units';

export function LidControls() {
  const neckDiameter = useBottleStore((s) => s.neckDiameter);
  const neckDiameterAuto = useBottleStore((s) => s.neckDiameterAuto);
  const outerDiameter = useBottleStore((s) => s.outerDiameter);
  const wallThickness = useBottleStore((s) => s.wallThickness);
  const lidType = useBottleStore((s) => s.lidType);
  const lidHeight = useBottleStore((s) => s.lidHeight);
  const slipOnClearance = useBottleStore((s) => s.slipOnClearance);
  const showExploded = useBottleStore((s) => s.showExploded);
  const thread = useBottleStore((s) => s.thread);
  const displayUnit = useBottleStore((s) => s.displayUnit);
  const setParam = useBottleStore((s) => s.setParam);
  const setThread = useBottleStore((s) => s.setThread);

  const [showThreadSettings, setShowThreadSettings] = useState(false);

  return (
    <div className="space-y-4">
      {/* Neck Diameter: Auto/Manual toggle */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[var(--fg-muted)]">Custom Neck Diameter</span>
          <button
            onClick={() => setParam('neckDiameterAuto', !neckDiameterAuto)}
            className={`relative inline-flex h-4 w-8 items-center transition-colors focus:outline-none border border-[var(--border-input)] ${
              !neckDiameterAuto ? 'bg-[var(--color-primary)]' : 'bg-[var(--bg-input)]'
            }`}
          >
            <span
              className={`inline-block h-2.5 w-2.5 transform bg-white transition-transform ${
                !neckDiameterAuto ? 'translate-x-4.5' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
        {neckDiameterAuto && (
          <p className="text-[10px] text-[var(--fg-muted)]">
            Neck sized automatically from body profile.
          </p>
        )}
        {!neckDiameterAuto && (
          <div>
            <div className="flex justify-between text-xs mb-1">
              <label className="text-[var(--fg-muted)]">Neck Diameter</label>
              <span className="text-[var(--fg-main)] font-technical">
                {formatDimension(neckDiameter, displayUnit)}
              </span>
            </div>
            <input
              type="range"
              min={convertToUnit(15, displayUnit)}
              max={convertToUnit(Math.min(80, outerDiameter), displayUnit)}
              step={displayUnit === 'in' ? 0.1 : 1}
              value={convertToUnit(neckDiameter, displayUnit)}
              onChange={(e) => {
                const newNeck = convertFromUnit(parseFloat(e.target.value), displayUnit);
                const minNeck = wallThickness * 2 + 1;
                setParam('neckDiameter', Math.max(minNeck, Math.min(newNeck, outerDiameter)));
              }}
              className="w-full accent-[var(--color-primary)]"
            />
          </div>
        )}
      </div>

      {/* Lid Type Toggle */}
      <div>
        <label className="text-xs text-[var(--fg-muted)] mb-2 block">Lid Type</label>
        <div className="flex gap-1">
          <button
            onClick={() => setParam('lidType', 'slip-on')}
            className={`flex-1 px-3 py-1.5 text-xs transition-colors ${
              lidType === 'slip-on'
                ? 'bg-[var(--color-primary)] text-[var(--bg-app)]'
                : 'bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            Slip-On
          </button>
          <button
            onClick={() => setParam('lidType', 'screw-on')}
            className={`flex-1 px-3 py-1.5 text-xs transition-colors ${
              lidType === 'screw-on'
                ? 'bg-[var(--color-primary)] text-[var(--bg-app)]'
                : 'bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            Screw-On
          </button>
        </div>
      </div>

      {/* Lid Height */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <label className="text-[var(--fg-muted)]">Lid Height</label>
          <span className="text-[var(--fg-main)] font-technical">
            {formatDimension(lidHeight, displayUnit)}
          </span>
        </div>
        <input
          type="range"
          min={5}
          max={50}
          step={1}
          value={lidHeight}
          onChange={(e) => setParam('lidHeight', parseFloat(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
      </div>

      {/* Clearance */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <label className="text-[var(--fg-muted)]">
            {lidType === 'slip-on' ? 'Slip-On Clearance' : 'Thread Clearance'}
          </label>
          <span className="text-[var(--fg-main)] font-technical">
            {slipOnClearance.toFixed(2)} mm
          </span>
        </div>
        <input
          type="range"
          min={0.1}
          max={1.0}
          step={0.05}
          value={slipOnClearance}
          onChange={(e) => setParam('slipOnClearance', parseFloat(e.target.value))}
          className="w-full accent-[var(--color-primary)]"
        />
      </div>

      {/* Thread Settings (screw-on only) */}
      {lidType === 'screw-on' && (
        <div className="space-y-3">
          <button
            onClick={() => setShowThreadSettings(!showThreadSettings)}
            className="w-full flex items-center justify-between text-xs text-[var(--fg-muted)] hover:text-[var(--fg-main)] transition-colors py-1"
          >
            <span className="font-medium uppercase tracking-wide">Thread Settings</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className={`w-3.5 h-3.5 transition-transform duration-200 ${showThreadSettings ? 'rotate-180' : ''}`}
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>

          {showThreadSettings && (
            <div className="space-y-3 pl-2 border-l border-[var(--border-main)]">
              {/* Pitch */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-[var(--fg-muted)]">Pitch</label>
                  <span className="text-[var(--fg-main)] font-technical">{thread.pitch.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min={1.5}
                  max={6}
                  step={0.5}
                  value={thread.pitch}
                  onChange={(e) => setThread({ pitch: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--color-primary)]"
                />
                <div className="flex justify-between text-[10px] text-[var(--fg-muted)] mt-0.5">
                  <span>Fine (1.5)</span>
                  <span>Coarse (6)</span>
                </div>
              </div>

              {/* Turns */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-[var(--fg-muted)]">Turns</label>
                  <span className="text-[var(--fg-main)] font-technical">{thread.turns}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={4}
                  step={1}
                  value={thread.turns}
                  onChange={(e) => setThread({ turns: parseInt(e.target.value) })}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>

              {/* Depth */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-[var(--fg-muted)]">Thread Depth</label>
                  <span className="text-[var(--fg-main)] font-technical">{thread.depth.toFixed(1)} mm</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2}
                  step={0.1}
                  value={thread.depth}
                  onChange={(e) => setThread({ depth: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--color-primary)]"
                />
              </div>

              {/* Thread Clearance */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <label className="text-[var(--fg-muted)]">Fit Clearance</label>
                  <span className="text-[var(--fg-main)] font-technical">{thread.clearance.toFixed(2)} mm</span>
                </div>
                <input
                  type="range"
                  min={0.2}
                  max={0.6}
                  step={0.05}
                  value={thread.clearance}
                  onChange={(e) => setThread({ clearance: parseFloat(e.target.value) })}
                  className="w-full accent-[var(--color-primary)]"
                />
                <p className="text-[10px] text-[var(--fg-muted)] mt-1">
                  Lower = tighter fit. 0.3mm recommended for FDM.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Exploded View Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-[var(--fg-muted)]">Exploded View</span>
        <button
          onClick={() => setParam('showExploded', !showExploded)}
          className={`relative inline-flex h-4 w-8 items-center transition-colors focus:outline-none border border-[var(--border-input)] ${
            showExploded ? 'bg-[var(--color-primary)]' : 'bg-[var(--bg-input)]'
          }`}
        >
          <span
            className={`inline-block h-2.5 w-2.5 transform bg-white transition-transform ${
              showExploded ? 'translate-x-4.5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}
