import { useBottleStore } from '../../store/useBottleStore';
import { ProfileSelector } from './ProfileSelector';

const TEXTURE_OPTIONS = [
  { value: 'none', label: 'None' },
  { value: 'vertical-ridges', label: 'Vertical Ridges' },
  { value: 'horizontal-ridges', label: 'Horizontal Rings' },
  { value: 'knurling', label: 'Knurling' },
  { value: 'diamond', label: 'Diamond' },
] as const;

export function BodyControls() {
  const texture = useBottleStore((s) => s.texture);
  const setTexture = useBottleStore((s) => s.setTexture);
  const textureActive = texture.type !== 'none';

  return (
    <div className="space-y-4">
      {/* Profile selector — disabled when texture is active */}
      <div className={textureActive ? 'opacity-40 pointer-events-none select-none' : ''}>
        <ProfileSelector />
      </div>

      {textureActive && (
        <p className="text-[10px] text-[var(--fg-muted)] italic">
          Body shape is fixed to Cylinder when a surface texture is active.
        </p>
      )}

      {/* Divider */}
      <div className="border-t border-[var(--border-main)]" />

      {/* Texture Controls */}
      <div className="space-y-3">
        <label className="text-xs text-[var(--fg-muted)] uppercase tracking-wide block">Surface Texture</label>

        <select
          value={texture.type}
          onChange={(e) => setTexture({ type: e.target.value as typeof texture.type })}
          className="w-full text-xs bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] rounded px-2 py-1.5 focus:outline-none focus:border-blue-500"
        >
          {TEXTURE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {textureActive && (
          <div className="space-y-3 pl-2 border-l border-[var(--border-main)]">
            {/* Depth */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-[var(--fg-muted)]">Depth</label>
                <span className="text-[var(--fg-main)] font-mono">{texture.depth.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min={0.3}
                max={2}
                step={0.1}
                value={texture.depth}
                onChange={(e) => setTexture({ depth: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Spacing */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-[var(--fg-muted)]">Spacing</label>
                <span className="text-[var(--fg-main)] font-mono">{texture.spacing.toFixed(1)} mm</span>
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={0.5}
                value={texture.spacing}
                onChange={(e) => setTexture({ spacing: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            {/* Coverage */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <label className="text-[var(--fg-muted)]">Coverage</label>
                <span className="text-[var(--fg-main)] font-mono">{Math.round(texture.coverage * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.1}
                max={1}
                step={0.05}
                value={texture.coverage}
                onChange={(e) => setTexture({ coverage: parseFloat(e.target.value) })}
                className="w-full accent-blue-500"
              />
            </div>

            <p className="text-[10px] text-[var(--fg-muted)]">
              {texture.type === 'knurling' && 'Diamond-pattern grip texture. Great for easy-open bottles.'}
              {texture.type === 'diamond' && 'Smaller, denser diamond grip pattern.'}
              {texture.type === 'vertical-ridges' && 'Vertical fins for grip. Good for tall bottles.'}
              {texture.type === 'horizontal-ridges' && 'Horizontal rings. Decorative or functional grip.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
