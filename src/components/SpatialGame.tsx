import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';

type GameState = 'IDLE' | 'SHOWING' | 'PLAYING' | 'GAMEOVER' | 'VICTORY';

export function SpatialGame({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [sequence, setSequence] = useState<number[]>([]);
  const [playerStep, setPlayerStep] = useState(0);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  
  const gridSize = 16; // 4x4 grid

  const generateSequence = (len: number) => {
    const seq: number[] = [];
    let last = -1;
    for (let i = 0; i < len; i++) {
      let next = Math.floor(Math.random() * gridSize);
      while (next === last) {
         next = Math.floor(Math.random() * gridSize);
      }
      seq.push(next);
      last = next;
    }
    return seq;
  };

  const playSequence = async (seq: number[]) => {
    setGameState('SHOWING');
    setActiveCell(null);
    await new Promise(r => setTimeout(r, 800)); // prep wait

    for (let i = 0; i < seq.length; i++) {
      setActiveCell(seq[i]);
      await new Promise(r => setTimeout(r, 400));
      setActiveCell(null);
      await new Promise(r => setTimeout(r, 150));
    }

    setGameState('PLAYING');
  };

  const startGame = (startLevel: number = 1) => {
    setLevel(startLevel);
    if (startLevel === 1) setLives(3);
    const newSeq = generateSequence(2 + startLevel); // level 1: 3, level 2: 4, etc.
    setSequence(newSeq);
    setPlayerStep(0);
    playSequence(newSeq);
  };

  const handleCellClick = (idx: number) => {
    if (gameState !== 'PLAYING') return;

    if (idx === sequence[playerStep]) {
      // Correct
      setActiveCell(idx);
      setTimeout(() => setActiveCell(null), 150);

      const nextStep = playerStep + 1;
      if (nextStep === sequence.length) {
        // Level complete
        setGameState('VICTORY');
        setTimeout(() => {
          startGame(level + 1);
        }, 1500);
      } else {
        setPlayerStep(nextStep);
      }
    } else {
      // Wrong
      setActiveCell(idx);
      setTimeout(() => setActiveCell(null), 300);
      const newLives = lives - 1;
      setLives(newLives);

      if (newLives <= 0) {
        setGameState('GAMEOVER');
      } else {
        // Replay sequence after a foul
        setGameState('SHOWING');
        setPlayerStep(0);
        setTimeout(() => {
          playSequence(sequence);
        }, 1000);
      }
    }
  };

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
      </div>

      <div className="text-center mb-8">
        <h2 className="text-4xl font-light tracking-tight mb-2">Spatial Match</h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 text-sm text-slate-400">
          <p>Memorize the pattern and repeat it back.</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
              <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-300">Level</span>
              <span className="font-bold text-blue-400">{level}</span>
            </div>
            <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
               <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-300">Lives</span>
               <span className={`font-bold ${lives === 1 ? 'text-red-400' : 'text-emerald-400'}`}>{"❤️".repeat(lives)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="relative p-6 bg-slate-900 border border-slate-700/50 rounded-2xl shadow-2xl">
        <div className="grid grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: gridSize }).map((_, i) => {
            let cellBg = 'bg-slate-800 border-slate-700 hover:border-slate-500';
            let cellScale = 1;
            
            if (activeCell === i) {
               // If playing and you click the wrong one, maybe flash red. 
               // For simplicity, we just flash white/blue for any activation, 
               // or red if it was a mistake. Let's determine if it was a mistake based on state.
               const isMistake = gameState === 'SHOWING' === false && (i !== sequence[playerStep]);
               cellBg = isMistake ? 'bg-red-500 border-red-400 shadow-[0_0_20px_rgba(239,68,68,0.5)]' : 'bg-blue-400 border-blue-300 shadow-[0_0_20px_rgba(96,165,250,0.5)]';
               cellScale = 1.05;
            } else if (gameState === 'PLAYING') {
               cellBg += ' cursor-pointer hover:bg-slate-700';
            }

            return (
              <motion.div
                key={i}
                animate={{ scale: cellScale }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                onClick={() => handleCellClick(i)}
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-xl border-2 transition-colors duration-150 ${cellBg}`}
              />
            );
          })}
        </div>

        {gameState === 'IDLE' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm rounded-2xl">
             <button 
               onClick={() => startGame(1)}
               className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold text-sm uppercase tracking-widest rounded-lg transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]"
             >
               Start Game
             </button>
          </div>
        )}

        {gameState === 'GAMEOVER' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/90 backdrop-blur-md rounded-2xl">
             <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
             <h3 className="text-3xl font-bold tracking-tight text-white mb-2">Game Over</h3>
             <p className="text-slate-300 text-sm mb-6">You reached Level <span className="font-bold text-blue-400">{level}</span>.</p>
             <button 
               onClick={() => startGame(1)}
               className="px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-slate-200 transition-colors"
             >
               Try Again
             </button>
          </div>
        )}

        {gameState === 'VICTORY' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-blue-900/40 backdrop-blur-sm rounded-2xl">
             <CheckCircle2 className="w-16 h-16 text-blue-400 mb-4 animate-bounce" />
             <h3 className="text-2xl font-bold tracking-tight text-white">Level Complete</h3>
          </div>
        )}
      </div>

    </motion.div>
  );
}
