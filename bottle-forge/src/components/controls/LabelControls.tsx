import { useBottleStore } from '../../store/useBottleStore';
import { MAX_LABEL_CHARS } from '../../engine/labelGenerator';

export function LabelControls() {
  const emboss = useBottleStore((s) => s.emboss);
  const setEmboss = useBottleStore((s) => s.setEmboss);

  return (
    <div className="space-y-4">
      {/* Text Input */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <label className="text-[var(--fg-muted)]">Label Text</label>
          <span className="text-[var(--fg-muted)] font-technical">
            {emboss.text.length}/{MAX_LABEL_CHARS}
          </span>
        </div>
        <input
          type="text"
          value={emboss.text}
          maxLength={MAX_LABEL_CHARS}
          placeholder="Enter label text..."
          onChange={(e) => setEmboss({ text: e.target.value, enabled: e.target.value.length > 0 })}
          className="w-full text-xs bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] px-2 py-1.5 focus:outline-none focus:border-[var(--color-primary)] placeholder:text-[var(--fg-muted)]/50"
        />
      </div>

      {/* Font Family */}
      <div>
        <label className="text-xs text-[var(--fg-muted)] mb-2 block">Font Style</label>
        <div className="grid grid-cols-2 gap-1">
          {(['Roboto', 'Pacifico', 'Patrick Hand', 'Arvo'] as const).map((font) => (
            <button
              key={font}
              onClick={() => setEmboss({ fontFamily: font })}
              style={{ fontFamily: font === 'Roboto' ? 'sans-serif' : font }}
              className={`px-2 py-1.5 text-[10px] transition-colors border ${
                emboss.fontFamily === font
                  ? 'bg-[var(--color-primary)] text-[var(--bg-app)] border-[var(--color-primary)]'
                  : 'bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] hover:bg-[var(--bg-surface-elevated)]'
              }`}
            >
              {font}
            </button>
          ))}
        </div>
      </div>

      {/* Orientation Toggle */}
      <div>
        <label className="text-xs text-[var(--fg-muted)] mb-2 block">Orientation</label>
        <div className="flex gap-1">
          <button
            onClick={() => setEmboss({ orientation: 'wrap' })}
            className={`flex-1 px-3 py-1.5 text-xs transition-colors ${
              emboss.orientation === 'wrap'
                ? 'bg-[var(--color-primary)] text-[var(--bg-app)]'
                : 'bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            Wrap
          </button>
          <button
            onClick={() => setEmboss({ orientation: 'vertical' })}
            className={`flex-1 px-3 py-1.5 text-xs transition-colors ${
              emboss.orientation === 'vertical'
                ? 'bg-[var(--color-primary)] text-[var(--bg-app)]'
                : 'bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            Vertical
          </button>
        </div>
        <p className="text-[10px] text-[var(--fg-muted)] mt-1">
          {emboss.orientation === 'wrap'
            ? 'Text flows around the bottle circumference.'
            : 'Text runs top-to-bottom on the bottle surface.'}
        </p>
      </div>

      {/* Mode Toggle */}
      <div>
        <label className="text-xs text-[var(--fg-muted)] mb-2 block">Mode</label>
        <div className="flex gap-1">
          <button
            onClick={() => setEmboss({ mode: 'engrave' })}
            className={`flex-1 px-3 py-1.5 text-xs transition-colors ${
              emboss.mode === 'engrave'
                ? 'bg-[var(--color-primary)] text-[var(--bg-app)]'
                : 'bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            Engrave
          </button>
          <button
            onClick={() => setEmboss({ mode: 'emboss' })}
            className={`flex-1 px-3 py-1.5 text-xs transition-colors ${
              emboss.mode === 'emboss'
                ? 'bg-[var(--color-primary)] text-[var(--bg-app)]'
                : 'bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] hover:bg-[var(--bg-surface-elevated)]'
            }`}
          >
            Emboss
          </button>
        </div>
        <p className="text-[10px] text-[var(--fg-muted)] mt-1">
          {emboss.mode === 'engrave'
            ? 'Text is cut into the bottle surface.'
            : 'Text is raised above the bottle surface.'}
        </p>
      </div>

      {/* Font Size */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <label className="text-[var(--fg-muted)]">Font Size</label>
          <span className="text-[var(--fg-main)] font-technical">{emboss.fontSize.toFixed(0)} mm</span>
        </div>
        <input
          type="range"
          min={4}
          max={30}
          step={1}
          value={emboss.fontSize}
          onChange={(e) => setEmboss({ fontSize: parseFloat(e.target.value) })}
          className="w-full accent-[var(--color-primary)]"
        />
      </div>

      {/* Depth */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <label className="text-[var(--fg-muted)]">Depth</label>
          <span className="text-[var(--fg-main)] font-technical">{emboss.depth.toFixed(1)} mm</span>
        </div>
        <input
          type="range"
          min={0.2}
          max={2}
          step={0.1}
          value={emboss.depth}
          onChange={(e) => setEmboss({ depth: parseFloat(e.target.value) })}
          className="w-full accent-[var(--color-primary)]"
        />
      </div>

      {/* Vertical Position */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <label className="text-[var(--fg-muted)]">Vertical Position</label>
          <span className="text-[var(--fg-main)] font-technical">{Math.round(emboss.verticalPosition * 100)}%</span>
        </div>
        <input
          type="range"
          min={0.1}
          max={0.9}
          step={0.05}
          value={emboss.verticalPosition}
          onChange={(e) => setEmboss({ verticalPosition: parseFloat(e.target.value) })}
          className="w-full accent-[var(--color-primary)]"
        />
      </div>
    </div>
  );
}
