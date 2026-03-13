import { useState } from 'react';
import { BottleDimensions } from '../controls/BottleDimensions';
import { LidControls } from '../controls/LidControls';
import { StyleSelector } from '../controls/StyleSelector';
import { BodyControls } from '../controls/BodyControls';
import { TextureControls } from '../controls/TextureControls';
import { LabelControls } from '../controls/LabelControls';
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
      <div className="flex items-center group">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex-1 flex items-center gap-2 text-left"
        >
          <div className={`w-3 h-3 border border-[var(--border-main)] flex items-center justify-center transition-colors ${isOpen ? 'bg-[var(--color-primary)] border-[var(--color-primary)]' : 'bg-transparent'}`}>
            <div className={`w-1 h-1 bg-[var(--bg-app)] ${isOpen ? 'block' : 'hidden'}`} />
          </div>
          <h3 className="text-[10px] font-bold text-[var(--fg-main)] uppercase tracking-[0.2em] font-technical">
            {title}
          </h3>
        </button>
      </div>

      {isOpen && (
        <div className="animate-in fade-in slide-in-from-top-1 duration-200 ps-5">
          {children}
        </div>
      )}
    </div>
  );
}

function StyleContent() {
  const bodyStyle = useBottleStore((s) => s.bodyStyle);

  if (bodyStyle === 'shape') {
    return (
      <CollapsibleSection title="Body Shape">
        <BodyControls />
      </CollapsibleSection>
    );
  }

  if (bodyStyle === 'texture') {
    return (
      <CollapsibleSection title="Surface Texture">
        <TextureControls />
      </CollapsibleSection>
    );
  }

  // bodyStyle === 'label'
  return (
    <CollapsibleSection title="Label Settings">
      <LabelControls />
    </CollapsibleSection>
  );
}

function PrintTips() {
  const lidType = useBottleStore((s) => s.lidType);
  const texture = useBottleStore((s) => s.texture);

  return (
    <div className="text-[10px] text-[var(--fg-muted)] space-y-2 font-technical leading-relaxed border-l border-[var(--border-main)] pl-3 py-1">
      <p className="flex gap-2"><span className="text-[var(--color-primary)]">//</span> ORIENTATION: BOTTLE UPRIGHT, LID UPSIDE-DOWN.</p>
      <p className="flex gap-2"><span className="text-[var(--color-primary)]">//</span> LAYER HEIGHT: 0.2MM, INFILL: 15-20%.</p>
      {lidType === 'screw-on' && (
        <p className="flex gap-2"><span className="text-[var(--color-primary)]">//</span> THREADS: SLOW SPEED (30MM/S), ENABLE IRONING.</p>
      )}
      {lidType === 'slip-on' && (
        <p className="flex gap-2"><span className="text-[var(--color-primary)]">//</span> SLIP-ON: PRINT BOTH TOGETHER FOR TOLERANCE.</p>
      )}
      {texture.type !== 'none' && (
        <p className="flex gap-2"><span className="text-[var(--color-primary)]">//</span> TEXTURE: REDUCE LAYER HEIGHT TO 0.15MM.</p>
      )}
      <p className="flex gap-2"><span className="text-[var(--color-primary)]">//</span> VASE MODE: COMPATIBLE WITH CYLINDERS ONLY.</p>
    </div>
  );
}

export function Sidebar() {
  return (
    <aside className="h-full bg-[var(--bg-sidebar)] overflow-y-auto flex-shrink-0 transition-colors custom-scrollbar">
      <div className="p-6 space-y-8">
        <CollapsibleSection title="Primary Dimensions">
          <BottleDimensions />
        </CollapsibleSection>

        <CollapsibleSection title="Closure System">
          <LidControls />
        </CollapsibleSection>

        <CollapsibleSection title="Visual Style">
          <StyleSelector />
        </CollapsibleSection>

        <StyleContent />

        <div className="pt-4">
          <ExportButton />
        </div>

        {/* Print Tips */}
        <div className="pt-4">
          <CollapsibleSection title="Drafting Notes" defaultOpen={false}>
            <PrintTips />
          </CollapsibleSection>
        </div>
      </div>
    </aside>
  );
}
