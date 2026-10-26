import { LetterState } from './Board';

interface KeyboardProps {
  onKey: (key: string) => void;
  letterStates: Record<string, LetterState>;
}

export default function Keyboard({ onKey, letterStates }: KeyboardProps) {
  const rows = [
    ['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'],
    ['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'],
    ['ENTER', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', '⌫'],
  ];

  const getKeyClasses = (key: string): string => {
    const base = 'flex items-center justify-center rounded-md font-bold cursor-pointer select-none transition-colors duration-200';
    const size = key.length > 1 
      ? 'px-2 sm:px-4 py-4 text-xs sm:text-sm' 
      : 'w-8 sm:w-11 h-12 sm:h-14 text-sm sm:text-base';
    
    let colorClass = 'bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 active:bg-gray-400 dark:active:bg-gray-400';
    
    const state = letterStates[key];
    if (state === 'correct') {
      colorClass = 'bg-green-600 hover:bg-green-700 text-white';
    } else if (state === 'present') {
      colorClass = 'bg-yellow-500 hover:bg-yellow-600 text-white';
    } else if (state === 'absent') {
      colorClass = 'bg-gray-400 dark:bg-gray-800 hover:bg-gray-500 dark:hover:bg-gray-700 text-white';
    }

    return `${base} ${size} ${colorClass}`;
  };

  return (
    <div className="flex flex-col items-center gap-1.5 pb-4 pt-2 w-full max-w-lg mx-auto px-1">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-1 sm:gap-1.5 w-full justify-center">
          {row.map((key) => (
            <button
              key={key}
              className={getKeyClasses(key)}
              onClick={() => onKey(key)}
              aria-label={key === '⌫' ? 'Backspace' : key}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
