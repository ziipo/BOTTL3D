import { useState } from 'react';
import { useBottleStore, selectBottleParams } from '../../store/useBottleStore';
import { useShallow } from 'zustand/react/shallow';
import { createShareUrl } from '../../utils/urlParams';

export function Header() {
  const [copied, setCopied] = useState(false);
  const params = useBottleStore(useShallow(selectBottleParams));
  const theme = useBottleStore((s) => s.theme);
  const setTheme = useBottleStore((s) => s.setTheme);

  const handleShare = async () => {
    const url = createShareUrl(params);

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy URL:', err);
    }
  };

  return (
    <header className="h-14 bg-[var(--bg-sidebar)] border-b border-[var(--border-main)] flex items-center justify-between px-4 flex-shrink-0 transition-colors duration-200">
      <div className="flex items-center gap-2">
        <svg
          className="w-8 h-8 text-[var(--color-primary)]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {/* Bottle icon - simplified to match architectural style */}
          <path d="M9 2h6v3H9z" />
          <path d="M7 5h10l1 4v11H6V9l1-4z" />
        </svg>
        <h1 className="text-xl font-semibold text-[var(--fg-main)] tracking-tight">BOTTL3D</h1>
        <div className="h-4 w-[1px] bg-[var(--border-main)] mx-2 hidden sm:block" />
        <span className="text-xs text-[var(--fg-muted)] hidden sm:inline uppercase tracking-widest font-medium">
          3D-Printable Bottle Generator
        </span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 border border-transparent hover:border-[var(--border-main)] transition-all text-[var(--fg-muted)] hover:text-[var(--fg-main)]"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        <button
          onClick={handleShare}
          className={`px-4 py-1.5 text-sm font-medium border border-[var(--border-main)] transition-all flex items-center gap-2 uppercase tracking-wide ${
            copied
              ? 'bg-green-600 border-green-600 text-white'
              : 'bg-[var(--color-primary)] text-[var(--bg-app)] hover:brightness-110'
          }`}
        >
          {copied ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Copied!
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              Share
            </>
          )}
        </button>
      </div>
    </header>
  );
}
