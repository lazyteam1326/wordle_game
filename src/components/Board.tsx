import { useEffect, useState } from 'react';

type LetterState = 'empty' | 'tbd' | 'correct' | 'present' | 'absent';

interface BoardProps {
  guesses: string[];
  currentGuess: string;
  evaluations: LetterState[][];
  maxGuesses: number;
  wordLength: number;
  revealRow: number | null;
}

export default function Board({ guesses, currentGuess, evaluations, maxGuesses, wordLength, revealRow }: BoardProps) {
  const [shakeRow, setShakeRow] = useState<number | null>(null);
  const [bounceRow, setBounceRow] = useState<number | null>(null);

  useEffect(() => {
    if (revealRow !== null) {
      setBounceRow(revealRow);
      const timer = setTimeout(() => setBounceRow(null), 1000);
      return () => clearTimeout(timer);
    }
  }, [revealRow]);

  const getCellContent = (rowIndex: number, colIndex: number) => {
    if (rowIndex < guesses.length) {
      return guesses[rowIndex][colIndex] || '';
    }
    if (rowIndex === guesses.length) {
      return currentGuess[colIndex] || '';
    }
    return '';
  };

  const getCellState = (rowIndex: number, colIndex: number): LetterState => {
    if (rowIndex < guesses.length && evaluations[rowIndex]) {
      return evaluations[rowIndex][colIndex];
    }
    if (rowIndex === guesses.length && currentGuess[colIndex]) {
      return 'tbd';
    }
    return 'empty';
  };

  const getCellClasses = (state: LetterState, rowIndex: number, colIndex: number): string => {
    const base = 'w-14 h-14 sm:w-16 sm:h-16 border-2 flex items-center justify-center text-2xl sm:text-3xl font-bold uppercase transition-all duration-300';
    
    const isRevealing = revealRow !== null && rowIndex === revealRow;
    const revealDelay = isRevealing ? colIndex * 300 : 0;
    
    const isBouncing = bounceRow !== null && rowIndex === bounceRow;
    const bounceDelay = isBouncing ? colIndex * 100 : 0;

    let stateClasses = '';
    switch (state) {
      case 'correct':
        stateClasses = 'bg-green-600 border-green-600 text-white';
        break;
      case 'present':
        stateClasses = 'bg-yellow-500 border-yellow-500 text-white';
        break;
      case 'absent':
        stateClasses = 'bg-gray-500 dark:bg-gray-700 border-gray-500 dark:border-gray-700 text-white';
        break;
      case 'tbd':
        stateClasses = 'border-gray-400 dark:border-gray-500';
        break;
      default:
        stateClasses = 'border-gray-300 dark:border-gray-600';
    }

    const animationStyle = isRevealing 
      ? { animationDelay: `${revealDelay}ms` }
      : isBouncing
      ? { animationDelay: `${bounceDelay + 1500}ms` }
      : {};

    return `${base} ${stateClasses} ${isRevealing ? 'animate-flip' : ''} ${isBouncing ? 'animate-bounce-cell' : ''}`;
  };

  return (
    <div className="flex flex-col items-center gap-1.5 py-4">
      {Array.from({ length: maxGuesses }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-1.5">
          {Array.from({ length: wordLength }).map((_, colIndex) => {
            const content = getCellContent(rowIndex, colIndex);
            const state = getCellState(rowIndex, colIndex);
            const classes = getCellClasses(state, rowIndex, colIndex);
            const isRevealing = revealRow !== null && rowIndex === revealRow;
            const revealDelay = isRevealing ? colIndex * 300 : 0;

            return (
              <div
                key={colIndex}
                className={classes}
                style={isRevealing ? { 
                  animationDelay: `${revealDelay}ms`,
                  animationFillMode: 'both'
                } : {}}
              >
                <span className={`${state === 'tbd' ? 'animate-pulse-subtle' : ''}`}>
                  {content}
                </span>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export type { LetterState };
