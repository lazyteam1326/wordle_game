import { useState, useEffect, useCallback, useRef } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import Header from './components/Header';
import Board, { LetterState } from './components/Board';
import Keyboard from './components/Keyboard';
import Modal from './components/Modal';
import ToastContainer, { Toast } from './components/Toast';
import { getWordOfDay, getRandomWord, isValidWord, getTodayString } from './data/words';

type GameMode = 'daily' | 'infinite';

interface GameState {
  guesses: string[];
  currentGuess: string;
  evaluations: LetterState[][];
  gameOver: boolean;
  won: boolean;
  targetWord: string;
  revealRow: number | null;
}

function getStoredState(mode: GameMode): GameState | null {
  try {
    const key = `wordle-${mode}-state`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const parsed = JSON.parse(stored);
    
    if (mode === 'daily') {
      const today = new Date().toDateString();
      if (parsed.date !== today) return null;
    }
    
    return parsed.state as GameState;
  } catch {
    return null;
  }
}

function storeState(mode: GameMode, state: GameState) {
  try {
    const key = `wordle-${mode}-state`;
    const data = mode === 'daily' 
      ? { date: new Date().toDateString(), state }
      : { state };
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // silently fail
  }
}

function getStoredStats(mode: GameMode) {
  try {
    const key = `wordle-${mode}-stats`;
    const stored = localStorage.getItem(key);
    if (!stored) return { played: 0, won: 0, streak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0] };
    return JSON.parse(stored);
  } catch {
    return { played: 0, won: 0, streak: 0, maxStreak: 0, distribution: [0, 0, 0, 0, 0, 0] };
  }
}

function storeStats(mode: GameMode, stats: any) {
  try {
    localStorage.setItem(`wordle-${mode}-stats`, JSON.stringify(stats));
  } catch {
    // silently fail
  }
}

function evaluateGuess(guess: string, target: string): LetterState[] {
  const result: LetterState[] = Array(5).fill('absent');
  const targetArr = target.split('');
  const guessArr = guess.split('');
  const used = Array(5).fill(false);

  // First pass: correct positions
  for (let i = 0; i < 5; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      used[i] = true;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < 5; i++) {
    if (result[i] === 'correct') continue;
    for (let j = 0; j < 5; j++) {
      if (!used[j] && guessArr[i] === targetArr[j]) {
        result[i] = 'present';
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

function getLetterStates(guesses: string[], evaluations: LetterState[][]): Record<string, LetterState> {
  const states: Record<string, LetterState> = {};
  const priority: Record<LetterState, number> = { empty: 0, tbd: 1, absent: 2, present: 3, correct: 4 };

  for (let i = 0; i < guesses.length; i++) {
    for (let j = 0; j < guesses[i].length; j++) {
      const letter = guesses[i][j];
      const state = evaluations[i][j];
      const current = states[letter] || 'empty';
      if (priority[state] > priority[current]) {
        states[letter] = state;
      }
    }
  }
  return states;
}

function Game() {
  const [mode, setMode] = useState<GameMode>('daily');
  const [gameState, setGameState] = useState<GameState>(() => {
    const stored = getStoredState('daily');
    if (stored) return stored;
    return {
      guesses: [],
      currentGuess: '',
      evaluations: [],
      gameOver: false,
      won: false,
      targetWord: getWordOfDay(),
      revealRow: null,
    };
  });
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showHelp, setShowHelp] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [shake, setShake] = useState(false);
  const [stats, setStats] = useState(() => getStoredStats('daily'));

  const addToast = useCallback((message: string) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
  }, []);

  const removeToast = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Switch mode
  useEffect(() => {
    const stored = getStoredState(mode);
    if (stored) {
      setGameState(stored);
    } else {
      setGameState({
        guesses: [],
        currentGuess: '',
        evaluations: [],
        gameOver: false,
        won: false,
        targetWord: mode === 'daily' ? getWordOfDay() : getRandomWord(),
        revealRow: null,
      });
    }
    setStats(getStoredStats(mode));
  }, [mode]);

  // Save state
  useEffect(() => {
    storeState(mode, gameState);
  }, [gameState, mode]);

  // Use ref to avoid stale closures in keyboard handler
  const handleKeyRef = useRef<(key: string) => void>(() => {});

  // Keyboard handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showHelp || showStats) return;
      
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.key === 'Enter') {
        handleKeyRef.current('ENTER');
      } else if (e.key === 'Backspace') {
        handleKeyRef.current('⌫');
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        handleKeyRef.current(e.key.toUpperCase());
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showHelp, showStats]);

  const handleKey = (key: string) => {
    if (gameState.gameOver) return;

    if (key === '⌫') {
      setGameState(prev => ({
        ...prev,
        currentGuess: prev.currentGuess.slice(0, -1),
      }));
    } else if (key === 'ENTER') {
      if (gameState.currentGuess.length !== 5) {
        setShake(true);
        addToast('Not enough letters');
        setTimeout(() => setShake(false), 600);
        return;
      }

      if (!isValidWord(gameState.currentGuess)) {
        setShake(true);
        addToast('Not in word list');
        setTimeout(() => setShake(false), 600);
        return;
      }

      const evaluation = evaluateGuess(gameState.currentGuess, gameState.targetWord);
      const newGuesses = [...gameState.guesses, gameState.currentGuess];
      const newEvaluations = [...gameState.evaluations, evaluation];
      const won = gameState.currentGuess === gameState.targetWord;
      const gameOver = won || newGuesses.length >= 6;

      setGameState(prev => ({
        ...prev,
        guesses: newGuesses,
        currentGuess: '',
        evaluations: newEvaluations,
        gameOver,
        won,
        revealRow: newGuesses.length - 1,
      }));

      // Update stats
      if (gameOver) {
        const newStats = { ...stats };
        newStats.played += 1;
        if (won) {
          newStats.won += 1;
          newStats.streak += 1;
          newStats.maxStreak = Math.max(newStats.maxStreak, newStats.streak);
          newStats.distribution[newGuesses.length - 1] += 1;
        } else {
          newStats.streak = 0;
        }
        setStats(newStats);
        storeStats(mode, newStats);

        // Show result toast
        setTimeout(() => {
          if (won) {
            const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Well done!', 'Great!', 'Phew!'];
            addToast(messages[newGuesses.length - 1] || 'You won!');
          } else {
            addToast(`The word was: ${gameState.targetWord}`);
          }
        }, 1800);
      }
    } else if (/^[A-Z]$/.test(key) && gameState.currentGuess.length < 5) {
      setGameState(prev => ({
        ...prev,
        currentGuess: prev.currentGuess + key,
      }));
    }
  };

  // Update ref with latest handleKey
  handleKeyRef.current = handleKey;

  const handleNewGame = () => {
    if (mode === 'infinite') {
      setGameState({
        guesses: [],
        currentGuess: '',
        evaluations: [],
        gameOver: false,
        won: false,
        targetWord: getRandomWord(),
        revealRow: null,
      });
    }
  };

  const handleModeChange = (newMode: GameMode) => {
    setMode(newMode);
  };

  const letterStates = getLetterStates(gameState.guesses, gameState.evaluations);

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 transition-colors duration-300">
      <Header
        mode={mode}
        onModeChange={handleModeChange}
        onNewGame={mode === 'infinite' ? handleNewGame : undefined}
        onShowStats={() => setShowStats(true)}
        onShowHelp={() => setShowHelp(true)}
      />

      {/* Date display for daily mode */}
      {mode === 'daily' && (
        <div className="text-center py-2 text-sm text-gray-500 dark:text-gray-400">
          {getTodayString()}
        </div>
      )}

      {/* New game button for infinite mode when game is over */}
      {mode === 'infinite' && gameState.gameOver && (
        <div className="flex justify-center py-2">
          <button
            onClick={handleNewGame}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-full transition-colors shadow-lg"
          >
            New Game →
          </button>
        </div>
      )}

      {/* Game Board */}
      <div className={`flex-1 flex items-center justify-center ${shake ? 'animate-shake' : ''}`}>
        <Board
          guesses={gameState.guesses}
          currentGuess={gameState.currentGuess}
          evaluations={gameState.evaluations}
          maxGuesses={6}
          wordLength={5}
          revealRow={gameState.revealRow}
        />
      </div>

      {/* Keyboard */}
      <Keyboard onKey={handleKey} letterStates={letterStates} />

      {/* Toast notifications */}
      <ToastContainer toasts={toasts} onRemove={removeToast} />

      {/* Help Modal */}
      <Modal isOpen={showHelp} onClose={() => setShowHelp(false)} title="How to Play">
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">Guess the <strong>WORDLE</strong> in 6 tries.</p>
          <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300">
            <li>Each guess must be a valid 5-letter word.</li>
            <li>The color of the tiles will change to show how close your guess was.</li>
          </ul>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-bold mb-3">Examples</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex gap-1 mb-1">
                  {['W', 'E', 'A', 'R', 'Y'].map((l, i) => (
                    <div key={i} className={`w-10 h-10 flex items-center justify-center font-bold text-white ${i === 0 ? 'bg-green-600' : 'border-2 border-gray-300 dark:border-gray-600'}`}>
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>W</strong> is in the word and in the correct spot.</p>
              </div>

              <div>
                <div className="flex gap-1 mb-1">
                  {['P', 'I', 'L', 'L', 'S'].map((l, i) => (
                    <div key={i} className={`w-10 h-10 flex items-center justify-center font-bold text-white ${i === 1 ? 'bg-yellow-500' : 'border-2 border-gray-300 dark:border-gray-600'}`}>
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>I</strong> is in the word but in the wrong spot.</p>
              </div>

              <div>
                <div className="flex gap-1 mb-1">
                  {['V', 'A', 'G', 'U', 'E'].map((l, i) => (
                    <div key={i} className={`w-10 h-10 flex items-center justify-center font-bold text-white ${i === 3 ? 'bg-gray-500 dark:bg-gray-700' : 'border-2 border-gray-300 dark:border-gray-600'}`}>
                      {l}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400"><strong>U</strong> is not in the word in any spot.</p>
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h3 className="font-bold mb-2">Game Modes</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2"><strong className="text-green-600">Daily:</strong> One puzzle per day. Same word for everyone!</p>
            <p className="text-sm text-gray-600 dark:text-gray-400"><strong className="text-blue-600">Infinite:</strong> Play as many puzzles as you want!</p>
          </div>
        </div>
      </Modal>

      {/* Stats Modal */}
      <Modal isOpen={showStats} onClose={() => setShowStats(false)} title="Statistics">
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-4 gap-3 text-center">
            <div>
              <div className="text-3xl font-bold">{stats.played}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Played</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.played > 0 ? Math.round((stats.won / stats.played) * 100) : 0}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Win %</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.streak}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Current Streak</div>
            </div>
            <div>
              <div className="text-3xl font-bold">{stats.maxStreak}</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Max Streak</div>
            </div>
          </div>

          {/* Guess distribution */}
          <div>
            <h3 className="font-bold mb-3 text-sm uppercase tracking-wide">Guess Distribution</h3>
            <div className="space-y-1">
              {stats.distribution.map((count: number, i: number) => {
                const maxCount = Math.max(...stats.distribution, 1);
                const width = Math.max((count / maxCount) * 100, 8);
                return (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-sm font-bold w-3">{i + 1}</span>
                    <div
                      className={`h-6 flex items-center justify-end px-2 text-sm font-bold text-white rounded-sm transition-all ${
                        gameState.won && gameState.guesses.length === i + 1
                          ? 'bg-green-600'
                          : 'bg-gray-400 dark:bg-gray-600'
                      }`}
                      style={{ width: `${width}%`, minWidth: '24px' }}
                    >
                      {count}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* New game button for infinite mode */}
          {mode === 'infinite' && gameState.gameOver && (
            <button
              onClick={() => { setShowStats(false); handleNewGame(); }}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
            >
              Play Again
            </button>
          )}
        </div>
      </Modal>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Game />
    </ThemeProvider>
  );
}
