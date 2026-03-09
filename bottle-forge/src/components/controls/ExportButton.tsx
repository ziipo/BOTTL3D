import { useBottleStore } from '../../store/useBottleStore';
import { downloadBottleSTL, downloadBottle3MF, downloadLidSTL, downloadLid3MF, downloadAllZip } from '../../engine/exporter';
import { createZipArchive } from '../../engine/zipWriter';
import { getProfile } from '../../data/profiles';

export function ExportButton() {
  const bottleStlData = useBottleStore((s) => s.bottleStlData);
  const bottleThreemfData = useBottleStore((s) => s.bottleThreemfData);
  const lidStlData = useBottleStore((s) => s.lidStlData);
  const lidThreemfData = useBottleStore((s) => s.lidThreemfData);
  const isGenerating = useBottleStore((s) => s.isGenerating);
  const outerDiameter = useBottleStore((s) => s.outerDiameter);
  const overallHeight = useBottleStore((s) => s.overallHeight);
  const profileId = useBottleStore((s) => s.profileId);

  const profileName = profileId === 'custom' ? 'custom' : (getProfile(profileId)?.name ?? 'cylinder');
  const hasData = !!(bottleStlData && lidStlData);
  const isDisabled = isGenerating || !hasData;

  const handleExportBottleSTL = () => {
    if (!bottleStlData) return;
    downloadBottleSTL(bottleStlData, outerDiameter, overallHeight, profileName);
  };

  const handleExportBottle3MF = () => {
    if (!bottleThreemfData) return;
    downloadBottle3MF(bottleThreemfData, outerDiameter, overallHeight, profileName);
  };

  const handleExportLidSTL = () => {
    if (!lidStlData) return;
    downloadLidSTL(lidStlData, outerDiameter, overallHeight, profileName);
  };

  const handleExportLid3MF = () => {
    if (!lidThreemfData) return;
    downloadLid3MF(lidThreemfData, outerDiameter, overallHeight, profileName);
  };

  const handleExportAllZip = () => {
    if (!bottleStlData || !lidStlData) return;

    const d = Math.round(outerDiameter);
    const h = Math.round(overallHeight);
    const profile = profileName.toLowerCase().replace(/\s+/g, '-');
    const bottleFilename = `bottle-${d}x${h}-${profile}.stl`;
    const lidFilename = `lid-${d}x${h}-${profile}.stl`;

    const zipData = createZipArchive([
      { filename: bottleFilename, data: new Uint8Array(bottleStlData) },
      { filename: lidFilename, data: new Uint8Array(lidStlData) },
    ]);

    downloadAllZip(zipData, outerDiameter, overallHeight, profileName);
  };

  const btnBase = 'flex-1 py-2 px-3 rounded font-medium text-xs transition-colors';
  const btnEnabled = 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm';
  const btnSecondary = 'bg-[var(--bg-sidebar)] border border-[var(--border-main)] hover:bg-[var(--bg-app)] text-[var(--fg-main)] shadow-sm';
  const btnDisabled = 'bg-[var(--bg-input)] text-[var(--fg-muted)] cursor-not-allowed';

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[var(--fg-muted)] uppercase tracking-wide">
        Export
      </h3>

      {/* Bottle exports */}
      <div className="space-y-2">
        <p className="text-xs text-[var(--fg-muted)]">Bottle</p>
        <div className="flex gap-2">
          <button
            onClick={handleExportBottleSTL}
            disabled={isDisabled}
            className={`${btnBase} ${isDisabled ? btnDisabled : btnEnabled}`}
          >
            {isGenerating ? 'Generating...' : 'STL'}
          </button>
          <button
            onClick={handleExportBottle3MF}
            disabled={isDisabled}
            className={`${btnBase} ${isDisabled ? btnDisabled : btnSecondary}`}
          >
            3MF
          </button>
        </div>
      </div>

      {/* Lid exports */}
      <div className="space-y-2">
        <p className="text-xs text-[var(--fg-muted)]">Lid</p>
        <div className="flex gap-2">
          <button
            onClick={handleExportLidSTL}
            disabled={isDisabled}
            className={`${btnBase} ${isDisabled ? btnDisabled : btnEnabled}`}
          >
            STL
          </button>
          <button
            onClick={handleExportLid3MF}
            disabled={isDisabled}
            className={`${btnBase} ${isDisabled ? btnDisabled : btnSecondary}`}
          >
            3MF
          </button>
        </div>
      </div>

      {/* ZIP bundle */}
      <div className="space-y-2">
        <p className="text-xs text-[var(--fg-muted)]">Both Parts</p>
        <button
          onClick={handleExportAllZip}
          disabled={isDisabled}
          className={`w-full py-2 px-3 rounded font-medium text-xs transition-colors ${
            isDisabled ? btnDisabled : 'bg-[var(--bg-input)] border border-[var(--border-input)] hover:bg-[var(--bg-sidebar)] text-[var(--fg-main)] shadow-sm'
          }`}
        >
          Export ZIP (Bottle + Lid)
        </button>
      </div>
    </div>
  );
}
