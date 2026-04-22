import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowLeft, Zap, AlertTriangle, Play, RefreshCw } from 'lucide-react';

type GameState = 'IDLE' | 'WAITING' | 'READY' | 'EARLY' | 'RESULT';

export function ReflexGame({ onBack }: { onBack: () => void }) {
  const [gameState, setGameState] = useState<GameState>('IDLE');
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const [history, setHistory] = useState<number[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);

  const avg = history.length > 0 ? Math.round(history.reduce((a, b) => a + b, 0) / history.length) : null;

  const startGame = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setGameState('WAITING');
    
    // Random delay between 2000ms and 5000ms
    const delay = Math.random() * 3000 + 2000;
    
    timerRef.current = setTimeout(() => {
      setGameState('READY');
      startTimeRef.current = Date.now();
    }, delay);
  };

  const handleClick = () => {
    if (gameState === 'IDLE' || gameState === 'RESULT' || gameState === 'EARLY') {
      startGame();
    } else if (gameState === 'WAITING') {
      if (timerRef.current) clearTimeout(timerRef.current);
      setGameState('EARLY');
    } else if (gameState === 'READY') {
      const time = Date.now() - startTimeRef.current;
      setReactionTime(time);
      setHistory(prev => [...prev, time]);
      setGameState('RESULT');
    }
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  let bgColor = 'bg-slate-800';
  let content = null;

  if (gameState === 'IDLE') {
    bgColor = 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/50';
    content = <><Zap className="w-16 h-16 text-blue-400 mb-4" /><h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Reflex Rapid</h2><p className="text-slate-300">Click when the screen turns green.</p><p className="text-blue-300 mt-8 font-bold tracking-widest uppercase text-sm">Click here to start</p></>;
  } else if (gameState === 'WAITING') {
    bgColor = 'bg-red-500/80 border-red-500';
    content = <><h2 className="text-3xl sm:text-5xl font-bold text-white mb-2">Wait for green...</h2></>;
  } else if (gameState === 'READY') {
    bgColor = 'bg-emerald-500/90 border-emerald-400';
    content = <><h2 className="text-5xl sm:text-6xl font-bold text-white mb-2">CLICK!</h2></>;
  } else if (gameState === 'EARLY') {
    bgColor = 'bg-slate-800 border-slate-600';
    content = <><AlertTriangle className="w-16 h-16 text-red-500 mb-4" /><h2 className="text-2xl sm:text-3xl font-bold text-white mb-2">Too soon!</h2><p className="text-slate-400">You clicked before it turned green.</p><p className="text-slate-300 mt-8 font-bold tracking-widest uppercase text-sm">Click to try again</p></>;
  } else if (gameState === 'RESULT') {
    bgColor = 'bg-slate-800 border-slate-600';
    content = <><h2 className="text-5xl sm:text-6xl font-black text-white mb-2">{reactionTime} <span className="text-xl sm:text-2xl text-slate-400">ms</span></h2><p className="text-slate-400">Reaction Time</p><p className="text-blue-400 mt-8 font-bold tracking-widest uppercase text-sm">Click to keep going</p></>;
  }

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

      <div className="w-full max-w-2xl text-center mb-6">
        <h2 className="text-4xl font-light tracking-tight mb-2">Reflex Rapid</h2>
        <p className="text-slate-400 text-sm">Test your neural reaction speed to visual stimuli.</p>
        
        {avg !== null && (
          <div className="mt-4 flex flex-col items-center justify-center">
            <span className="text-[10px] sm:text-xs uppercase tracking-widest font-bold text-slate-500 mb-1">Session Average</span>
            <span className="font-bold text-emerald-400 text-xl">{avg} ms</span>
          </div>
        )}
      </div>

      <div 
        onClick={handleClick}
        className={`w-full max-w-2xl h-96 rounded-2xl border-2 flex flex-col items-center justify-center cursor-pointer transition-colors duration-200 select-none shadow-2xl ${bgColor}`}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={gameState}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center justify-center text-center p-6"
          >
            {content}
          </motion.div>
        </AnimatePresence>
      </div>

      {history.length > 0 && gameState === 'IDLE' && (
        <button
          onClick={() => {
            setHistory([]);
            setReactionTime(null);
          }}
          className="mt-8 flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-400 text-xs font-bold uppercase tracking-widest transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Reset Stats
        </button>
      )}

    </motion.div>
  );
}
