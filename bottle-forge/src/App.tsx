import { useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { BottlePreview } from './components/preview/BottlePreview';
import { useUrlSync } from './hooks/useUrlSync';
import { useBottleStore } from './store/useBottleStore';

function App() {
  const theme = useBottleStore((s) => s.theme);

  // Sync parameters with URL hash
  useUrlSync();

  // Apply dark class to root
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <div className="flex flex-col h-full bg-[var(--bg-app)] text-[var(--fg-main)] transition-colors duration-200">
      <Header />
      <div className="flex flex-col md:flex-row flex-1 overflow-hidden">
        <main className="flex-1 order-1 md:order-2 min-h-[50vh] md:min-h-0 bg-[var(--bg-app)] drafting-grid">
          <BottlePreview />
        </main>
        <div className="order-2 md:order-1 md:w-[320px] md:flex-shrink-0 overflow-auto bg-[var(--bg-sidebar)] border-r border-[var(--border-main)] border-r-1">
          <Sidebar />
        </div>
      </div>
    </div>
  );
}

export default App;
