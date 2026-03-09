import { useState } from 'react';
import { BottleDimensions } from '../controls/BottleDimensions';
import { LidControls } from '../controls/LidControls';
import { BodyControls } from '../controls/BodyControls';
import { ExportButton } from '../controls/ExportButton';
import { useBottleStore } from '../../store/useBottleStore';

interface CollapsibleSectionProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, children, defaultOpen = true }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center justify-between text-left"
        >
          <h3 className="text-sm font-medium text-[var(--fg-muted)] uppercase tracking-wide group-hover:text-[var(--fg-main)] transition-colors">
            {title}
          </h3>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`w-4 h-4 text-[var(--fg-muted)] group-hover:text-[var(--fg-main)] transition-transform duration-200 mr-2 ${
              isOpen ? 'rotate-180' : ''
            }`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200">
          {children}
        </div>
      )}
    </div>
  );
}

function PrintTips() {
  const lidType = useBottleStore((s) => s.lidType);
  const texture = useBottleStore((s) => s.texture);

  return (
    <div className="text-xs text-[var(--fg-muted)] space-y-1.5">
      <p>Print bottle upright, lid upside-down.</p>
      <p>Use 0.2mm layer height, 15-20% infill.</p>
      {lidType === 'screw-on' && (
        <p>For threads: slow print speed (30mm/s) and enable ironing for best fit.</p>
      )}
      {lidType === 'slip-on' && (
        <p>Slip-on lid: print both at same time for consistent tolerances.</p>
      )}
      {texture.type !== 'none' && (
        <p>Textured bottles: reduce layer height to 0.15mm for crisper detail.</p>
      )}
      <p>Vase mode works for simple cylindrical bottles (no texture/threads).</p>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="w-full md:w-80 bg-[var(--bg-sidebar)] border-t md:border-t-0 md:border-r border-[var(--border-main)] overflow-y-auto flex-shrink-0 transition-colors">
      <div className="p-4 space-y-6">
        <CollapsibleSection title="Bottle Dimensions">
          <BottleDimensions />
        </CollapsibleSection>

        <div className="border-t border-[var(--border-main)]" />

        <CollapsibleSection title="Lid">
          <LidControls />
        </CollapsibleSection>

        <div className="border-t border-[var(--border-main)]" />

        <CollapsibleSection title="Body Shape">
          <BodyControls />
        </CollapsibleSection>

        <div className="border-t border-[var(--border-main)]" />

        <ExportButton />

        {/* Print Tips */}
        <div className="border-t border-[var(--border-main)]" />
        <CollapsibleSection title="Print Tips" defaultOpen={false}>
          <PrintTips />
        </CollapsibleSection>
      </div>
    </aside>
  );
}
