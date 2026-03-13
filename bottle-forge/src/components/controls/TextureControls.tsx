import { useBottleStore } from '../../store/useBottleStore';

const TEXTURE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'vertical-ridges', label: 'Vertical Ridges' },
  { value: 'horizontal-ridges', label: 'Horizontal Rings' },
  { value: 'knurling', label: 'Knurling' },
  { value: 'diamond', label: 'Diamond' },
] as const;

export function TextureControls() {
  const texture = useBottleStore((s) => s.texture);
  const setTexture = useBottleStore((s) => s.setTexture);
  const textureActive = texture.type !== 'none';

  return (
    <div className="space-y-3">
      <select
        value={texture.type}
        onChange={(e) => setTexture({ type: e.target.value as typeof texture.type })}
        className="w-full text-[10px] font-bold bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] px-2 py-1.5 focus:outline-none focus:border-[var(--color-primary)] font-technical uppercase tracking-wider"
      >
        {TEXTURE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label.toUpperCase()}</option>
        ))}
      </select>

      {textureActive && (
        <div className="space-y-4 pl-2 border-l border-[var(--border-main)]">
          {/* Depth */}
          <div>
            <div className="flex justify-between text-[10px] mb-1 font-technical uppercase tracking-wide">
              <label className="text-[var(--fg-muted)]">Texture Depth</label>
              <span className="text-[var(--fg-main)]">{texture.depth.toFixed(1)} mm</span>
            </div>
            <input
              type="range"
              min={0.3}
              max={2}
              step={0.1}
              value={texture.depth}
              onChange={(e) => setTexture({ depth: parseFloat(e.target.value) })}
              className="w-full accent-[var(--color-primary)]"
            />
          </div>

          {/* Spacing */}
          <div>
            <div className="flex justify-between text-[10px] mb-1 font-technical uppercase tracking-wide">
              <label className="text-[var(--fg-muted)]">Pattern Spacing</label>
              <span className="text-[var(--fg-main)]">{texture.spacing.toFixed(1)} mm</span>
            </div>
            <input
              type="range"
              min={2}
              max={10}
              step={0.5}
              value={texture.spacing}
              onChange={(e) => setTexture({ spacing: parseFloat(e.target.value) })}
              className="w-full accent-[var(--color-primary)]"
            />
          </div>

          {/* Coverage */}
          <div>
            <div className="flex justify-between text-[10px] mb-1 font-technical uppercase tracking-wide">
              <label className="text-[var(--fg-muted)]">Body Coverage</label>
              <span className="text-[var(--fg-main)]">{Math.round(texture.coverage * 100)}%</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={1}
              step={0.05}
              value={texture.coverage}
              onChange={(e) => setTexture({ coverage: parseFloat(e.target.value) })}
              className="w-full accent-[var(--color-primary)]"
            />
          </div>

          <p className="text-[10px] text-[var(--fg-muted)] font-technical leading-relaxed opacity-80 border-t border-[var(--border-main)] pt-2 mt-2">
            {texture.type === 'knurling' && '// KNURLING: DIAMOND-PATTERN GRIP. IDEAL FOR HIGH-TORQUE COVERS.'}
            {texture.type === 'diamond' && '// DIAMOND: HIGH-DENSITY MICRO-GRIP SURFACE.'}
            {texture.type === 'vertical-ridges' && '// RIDGES: VERTICAL FLUTING FOR LINEAR GRIP.'}
            {texture.type === 'horizontal-ridges' && '// RINGS: HORIZONTAL FRICTION BANDS.'}
          </p>
        </div>
      )}
    </div>
  );
}
