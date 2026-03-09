import { useBottleStore } from '../../store/useBottleStore';
import { bottleProfiles } from '../../data/profiles';
import { ProfileEditor } from './ProfileEditor';

export function ProfileSelector() {
  const profileId = useBottleStore((s) => s.profileId);
  const setParam = useBottleStore((s) => s.setParam);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {bottleProfiles.map((profile) => {
          const isActive = profileId === profile.id;
          return (
            <button
              key={profile.id}
              onClick={() => setParam('profileId', profile.id)}
              className={`p-2 rounded border transition-colors text-left ${
                isActive
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-[var(--border-input)] bg-[var(--bg-input)] hover:border-[var(--fg-muted)]'
              }`}
            >
              <div className="h-16 mb-2 flex items-center justify-center bg-[var(--bg-sidebar)] rounded border border-[var(--border-main)]">
                <BottleProfileThumbnail profile={profile} />
              </div>
              <div className="text-[10px] text-[var(--fg-main)] font-medium truncate">
                {profile.name}
              </div>
            </button>
          );
        })}

        {/* Custom profile button */}
        <button
          onClick={() => setParam('profileId', 'custom')}
          className={`p-2 rounded border transition-colors text-left ${
            profileId === 'custom'
              ? 'border-blue-500 bg-blue-500/20'
              : 'border-[var(--border-input)] bg-[var(--bg-input)] hover:border-[var(--fg-muted)]'
          }`}
        >
          <div className="h-16 mb-2 flex items-center justify-center bg-[var(--bg-sidebar)] rounded border border-[var(--border-main)]">
            <CustomProfileIcon />
          </div>
          <div className="text-[10px] text-[var(--fg-main)] font-medium truncate">
            Custom
          </div>
        </button>
      </div>

      {profileId === 'custom' && <ProfileEditor />}
    </div>
  );
}

function BottleProfileThumbnail({ profile }: { profile: typeof bottleProfiles[0] }) {
  const width = 40;
  const height = 50;
  const padding = 4;
  const plotW = width - 2 * padding;
  const plotH = height - 2 * padding;

  // Draw bottle silhouette: profile points define left edge (mirrored for right)
  // X=0..1 is bottom..top, Y=0..1 is center..edge
  const leftPoints = profile.points.map((p) => ({
    x: padding + plotW / 2 - p.y * (plotW / 2), // left side: center - radius
    y: padding + (1 - p.x) * plotH, // bottom at bottom of SVG
  }));

  const rightPoints = profile.points.map((p) => ({
    x: padding + plotW / 2 + p.y * (plotW / 2), // right side: center + radius
    y: padding + (1 - p.x) * plotH,
  })).reverse();

  const allPoints = [...leftPoints, ...rightPoints];
  const pathData = allPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ') + ' Z';

  return (
    <svg width={width} height={height} className="text-[var(--fg-main)] opacity-80">
      <path
        d={pathData}
        fill="currentColor"
        opacity={0.5}
        stroke="currentColor"
        strokeWidth={1}
      />
      {/* Neck stub at top */}
      <rect
        x={padding + plotW / 2 - 4}
        y={padding - 2}
        width={8}
        height={4}
        fill="currentColor"
        opacity={0.3}
        rx={1}
      />
    </svg>
  );
}

function CustomProfileIcon() {
  return (
    <svg width={40} height={50} className="text-[var(--fg-main)] opacity-80">
      <line
        x1={10} y1={40} x2={20} y2={15}
        stroke="currentColor" strokeWidth={1} strokeDasharray="3,2" opacity={0.6}
      />
      <line
        x1={20} y1={15} x2={30} y2={35}
        stroke="currentColor" strokeWidth={1} strokeDasharray="3,2" opacity={0.6}
      />
      <circle cx={10} cy={40} r={2.5} fill="currentColor" opacity={0.8} />
      <circle cx={20} cy={15} r={2.5} fill="currentColor" opacity={0.8} />
      <circle cx={30} cy={35} r={2.5} fill="currentColor" opacity={0.8} />
    </svg>
  );
}
