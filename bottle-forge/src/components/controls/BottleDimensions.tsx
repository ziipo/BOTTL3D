import { useBottleStore } from '../../store/useBottleStore';
import { convertToUnit, convertFromUnit, formatDimension } from '../../utils/units';

export function BottleDimensions() {
  const outerDiameter = useBottleStore((s) => s.outerDiameter);
  const neckDiameter = useBottleStore((s) => s.neckDiameter);
  const overallHeight = useBottleStore((s) => s.overallHeight);
  const wallThickness = useBottleStore((s) => s.wallThickness);
  const displayUnit = useBottleStore((s) => s.displayUnit);
  const setParam = useBottleStore((s) => s.setParam);
  const setParams = useBottleStore((s) => s.setParams);

  // Clamp neck when body diameter changes
  const handleBodyDiameterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newBody = convertFromUnit(parseFloat(e.target.value), displayUnit);
    if (neckDiameter > newBody) {
      setParams({ outerDiameter: newBody, neckDiameter: newBody });
    } else {
      setParam('outerDiameter', newBody);
    }
  };

  return (
    <div className="space-y-4">
      {/* Body Diameter */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <label className="text-[var(--fg-muted)]">Body Diameter</label>
          <span className="text-[var(--fg-main)] font-mono">
            {formatDimension(outerDiameter, displayUnit)}
          </span>
        </div>
        <input
          type="range"
          min={convertToUnit(20, displayUnit)}
          max={convertToUnit(150, displayUnit)}
          step={displayUnit === 'in' ? 0.1 : 1}
          value={convertToUnit(outerDiameter, displayUnit)}
          onChange={handleBodyDiameterChange}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Overall Height */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <label className="text-[var(--fg-muted)]">Overall Height</label>
          <span className="text-[var(--fg-main)] font-mono">
            {formatDimension(overallHeight, displayUnit)}
          </span>
        </div>
        <input
          type="range"
          min={convertToUnit(40, displayUnit)}
          max={convertToUnit(300, displayUnit)}
          step={displayUnit === 'in' ? 0.1 : 1}
          value={convertToUnit(overallHeight, displayUnit)}
          onChange={(e) => setParam('overallHeight', convertFromUnit(parseFloat(e.target.value), displayUnit))}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Wall Thickness */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <label className="text-[var(--fg-muted)]">Wall Thickness</label>
          <span className="text-[var(--fg-main)] font-mono">
            {formatDimension(wallThickness, displayUnit)}
          </span>
        </div>
        <input
          type="range"
          min={convertToUnit(1, displayUnit)}
          max={convertToUnit(5, displayUnit)}
          step={displayUnit === 'in' ? 0.05 : 0.5}
          value={convertToUnit(wallThickness, displayUnit)}
          onChange={(e) => setParam('wallThickness', convertFromUnit(parseFloat(e.target.value), displayUnit))}
          className="w-full accent-blue-500"
        />
      </div>

      {/* Unit Toggle */}
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs text-[var(--fg-muted)]">Units:</span>
        <button
          onClick={() => setParam('displayUnit', displayUnit === 'mm' ? 'in' : 'mm')}
          className="px-2 py-0.5 text-xs rounded border border-[var(--border-input)] bg-[var(--bg-input)] hover:bg-[var(--bg-surface-elevated)] text-[var(--fg-main)] transition-colors"
        >
          {displayUnit === 'mm' ? 'mm' : 'in'}
        </button>
      </div>
    </div>
  );
}
