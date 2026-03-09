import { useBottleStore } from '../../store/useBottleStore';

const STYLE_OPTIONS = [
  { value: 'shape', label: 'Shape' },
  { value: 'texture', label: 'Texture' },
  { value: 'label', label: 'Label' },
] as const;

type BodyStyle = (typeof STYLE_OPTIONS)[number]['value'];

export function StyleSelector() {
  const bodyStyle = useBottleStore((s) => s.bodyStyle);
  const setParam = useBottleStore((s) => s.setParam);

  return (
    <div className="flex gap-1">
      {STYLE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => setParam('bodyStyle', opt.value as BodyStyle)}
          className={`flex-1 px-3 py-1.5 text-xs rounded transition-colors ${
            bodyStyle === opt.value
              ? 'bg-blue-600 text-white'
              : 'bg-[var(--bg-input)] text-[var(--fg-main)] border border-[var(--border-input)] hover:bg-[var(--bg-surface-elevated)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
