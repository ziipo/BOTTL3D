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
          className={`flex-1 px-3 py-1.5 text-[10px] font-bold transition-all border font-technical uppercase tracking-wider ${
            bodyStyle === opt.value
              ? 'bg-[var(--color-primary)] text-[var(--bg-app)] border-[var(--color-primary)]'
              : 'bg-[var(--bg-input)] text-[var(--fg-main)] border-[var(--border-input)] hover:border-[var(--fg-muted)]'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
