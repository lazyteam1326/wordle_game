import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  mode: 'daily' | 'infinite';
  onModeChange: (mode: 'daily' | 'infinite') => void;
  onNewGame?: () => void;
  onShowStats?: () => void;
  onShowHelp?: () => void;
}

export default function Header({ mode, onModeChange, onNewGame, onShowStats, onShowHelp }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="w-full border-b border-gray-700 dark:border-gray-700">
      <div className="max-w-lg mx-auto px-4 py-3 flex items-center justify-between">
        {/* Left side - Help */}
        <button
          onClick={onShowHelp}
          className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Help"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>

        {/* Center - Title and Mode */}
        <div className="flex flex-col items-center">
          <h1 className="text-2xl font-bold tracking-wide">WORDLE</h1>
          <div className="flex gap-1 mt-1">
            <button
              onClick={() => onModeChange('daily')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                mode === 'daily'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => onModeChange('infinite')}
              className={`px-3 py-1 text-xs font-semibold rounded-full transition-all ${
                mode === 'infinite'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Infinite
            </button>
          </div>
        </div>

        {/* Right side - Theme toggle and Stats */}
        <div className="flex items-center gap-1">
          <button
            onClick={onShowStats}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Statistics"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </button>
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
