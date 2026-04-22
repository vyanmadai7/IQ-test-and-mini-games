import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RefreshCw, CheckCircle2 } from 'lucide-react';
import { generateSudoku, checkConflicts, SudokuDifficulty } from '../services/sudokuService';

export function SudokuGame({ onBack }: { onBack: () => void }) {
  const savedState = useMemo(() => {
    try {
      const saved = localStorage.getItem('sudoku_save');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const [difficulty, setDifficulty] = useState<SudokuDifficulty>(savedState?.difficulty || 'MEDIUM');
  const [board, setBoard] = useState<number[][]>(savedState?.board || []);
  const [solution, setSolution] = useState<number[][]>(savedState?.solution || []);
  const [initialBoard, setInitialBoard] = useState<boolean[][]>(savedState?.initialBoard || []);
  const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);
  const [isWon, setIsWon] = useState(savedState?.isWon || false);
  const [mistakes, setMistakes] = useState(savedState?.mistakes || 0);

  const startNewGame = useCallback((level?: SudokuDifficulty) => {
    const currentDifficulty = level || difficulty;
    const { puzzle, solution: newSolution } = generateSudoku(currentDifficulty);
    setBoard(puzzle);
    setSolution(newSolution);
    
    // Mark which cells are pre-filled (true) vs empty (false)
    const initial = puzzle.map(row => row.map(cell => cell !== 0));
    setInitialBoard(initial);
    setSelectedCell(null);
    setIsWon(false);
    setMistakes(0);
    setDifficulty(currentDifficulty);
  }, [difficulty]);

  // If no saved state, initialize a new game on mount
  useEffect(() => {
    if (board.length === 0) {
      startNewGame(difficulty);
    }
  }, [board.length, difficulty, startNewGame]);

  // Save to local storage whenever game state changes
  useEffect(() => {
    if (board.length > 0) {
      localStorage.setItem('sudoku_save', JSON.stringify({
        difficulty,
        board,
        solution,
        initialBoard,
        mistakes,
        isWon
      }));
    }
  }, [difficulty, board, solution, initialBoard, mistakes, isWon]);

  const handleInput = useCallback((num: number) => {
    if (!selectedCell || isWon || mistakes >= 3 || num === 0) return;
    const { r, c } = selectedCell;
    if (board[r][c] !== 0) return; // already correctly filled

    let count = 0;
    board.forEach(row => row.forEach(val => { if (val === num) count++; }));
    if (count >= 9) return; // number exhausted

    if (num === solution[r][c]) {
      const newBoard = board.map(row => [...row]);
      newBoard[r][c] = num;
      setBoard(newBoard);

      // Check win condition
      const isComplete = newBoard.every(row => row.every(cell => cell !== 0));
      if (isComplete) {
        setIsWon(true);
      }
    } else {
      setMistakes(prev => prev + 1);
    }
  }, [board, solution, selectedCell, isWon, mistakes]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!selectedCell || isWon || mistakes >= 3) return;
      const { r, c } = selectedCell;

      if (e.key >= '1' && e.key <= '9') {
        handleInput(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        handleInput(0);
      } else if (e.key === 'ArrowUp' && r > 0) {
        setSelectedCell({ r: r - 1, c });
      } else if (e.key === 'ArrowDown' && r < 8) {
        setSelectedCell({ r: r + 1, c });
      } else if (e.key === 'ArrowLeft' && c > 0) {
        setSelectedCell({ r, c: c - 1 });
      } else if (e.key === 'ArrowRight' && c < 8) {
        setSelectedCell({ r, c: c + 1 });
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedCell, handleInput, isWon]);

  if (board.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-4xl w-full flex flex-col items-center"
    >
      <div className="w-full flex justify-between items-center mb-8">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </button>
        <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
          {(['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as SudokuDifficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => startNewGame(level)}
              className={`px-3 py-1.5 text-[10px] sm:text-xs uppercase tracking-widest font-bold rounded transition-colors ${
                difficulty === level 
                  ? 'bg-emerald-500/20 text-emerald-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center mb-8">
        <h2 className="text-4xl font-light tracking-tight mb-2">Sudoku Logic</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-slate-400">
          <p>Fill the grid so every row, column, and 3x3 box contains 1-9.</p>
          <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-300">Mistakes</span>
            <span className={`font-bold ${mistakes > 0 ? 'text-red-400' : 'text-emerald-400'}`}>{mistakes}/3</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-12 items-center md:items-start justify-center w-full">
        {/* Board */}
        <div className="relative glass-panel p-2 md:p-4 rounded-xl">
          <div className="bg-slate-900 border border-white/20 rounded-md overflow-hidden shadow-2xl">
            {board.map((row, r) => (
              <div key={r} className="flex">
                {row.map((cell, c) => {
                  const isInitial = initialBoard[r][c];
                  const isSelected = selectedCell?.r === r && selectedCell?.c === c;
                  
                  // Same-value highlighting
                  const isSameValueHighlight = !isSelected && selectedCell && board[selectedCell.r][selectedCell.c] !== 0 && board[selectedCell.r][selectedCell.c] === cell;

                  const borderRight = c % 3 === 2 && c !== 8 ? 'border-r-2 border-r-slate-600' : 'border-r border-r-slate-700/50';
                  const borderBottom = r % 3 === 2 && r !== 8 ? 'border-b-2 border-b-slate-600' : 'border-b border-b-slate-700/50';

                  let bgColor = 'bg-slate-900';
                  if (isSelected) bgColor = 'bg-blue-500/30';
                  else if (isSameValueHighlight) bgColor = 'bg-blue-500/10';
                  else if ((Math.floor(r/3) + Math.floor(c/3)) % 2 === 0) bgColor = 'bg-slate-800/30';

                  let textColor = 'text-white';
                  if (!isInitial) textColor = 'text-emerald-400';

                  return (
                    <div
                      key={c}
                      onClick={() => setSelectedCell({ r, c })}
                      className={`w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 flex items-center justify-center text-lg sm:text-xl cursor-pointer transition-colors ${borderRight} ${borderBottom} ${bgColor} ${textColor} ${isInitial ? 'font-light' : 'font-bold'}`}
                    >
                      {cell !== 0 ? cell : ''}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
          
          {isWon && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg"
            >
              <CheckCircle2 className="w-16 h-16 text-emerald-400 mb-4" />
              <h3 className="text-2xl font-bold tracking-tight text-white mb-2">Puzzle Solved!</h3>
              <p className="text-slate-300 text-sm mb-6">Excellent cognitive deduction.</p>
              <button 
                onClick={() => startNewGame(difficulty)}
                className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-slate-200 transition-colors"
              >
                Play Again
              </button>
            </motion.div>
          )}

          {mistakes >= 3 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-lg"
            >
              <h3 className="text-3xl font-bold tracking-tight text-red-500 mb-2">Game Over</h3>
              <p className="text-slate-300 text-sm mb-6">You made 3 mistakes. The board has been reset.</p>
              <button 
                onClick={() => startNewGame(difficulty)}
                className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-slate-200 transition-colors"
              >
                Try Again
              </button>
            </motion.div>
          )}
        </div>

        {/* Numpad */}
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => {
              let count = 0;
              board.forEach(row => row.forEach(val => { if (val === num) count++; }));
              const exhausted = count >= 9;

              return (
                <button
                  key={num}
                  onClick={() => handleInput(num)}
                  disabled={exhausted}
                  className={`w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center text-xl sm:text-2xl font-light border rounded-lg transition-all active:scale-95 ${
                    exhausted 
                      ? 'bg-slate-800/50 text-slate-600 border-slate-700/50 cursor-not-allowed opacity-50' 
                      : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-blue-400/50'
                  }`}
                >
                  {num}
                </button>
              );
            })}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => startNewGame(difficulty)}
              className="flex-1 py-4 bg-white/5 border border-white/10 rounded-lg hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-all active:scale-95 flex items-center justify-center gap-2 text-xs uppercase tracking-widest font-bold"
            >
              <RefreshCw className="w-5 h-5" /> New Puzzle
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
