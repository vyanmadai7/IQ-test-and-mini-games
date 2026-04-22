import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Volume2, Play } from 'lucide-react';

export function AudioQuestion({ question, onAnswer }: { question: any, onAnswer: (optionId: string) => void }) {
  const { toneSequence, options } = question.questionData;
  const [isPlaying, setIsPlaying] = useState(false);
  const [playCount, setPlayCount] = useState(0);
  const MAX_PLAYS = 2;

  const playSequence = async (sequence: number[], isMain: boolean = false) => {
    if (isPlaying) return;
    if (isMain && playCount >= MAX_PLAYS) return;
    
    setIsPlaying(true);
    if (isMain) {
      setPlayCount(prev => prev + 1);
    }

    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AudioContext();

    for (let i = 0; i < sequence.length; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(sequence[i], ctx.currentTime);
      
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.5);
      
      await new Promise(r => setTimeout(r, 600)); // wait between tones
    }
    
    setTimeout(() => {
      ctx.close();
      setIsPlaying(false);
    }, 500);
  };

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="mb-12 flex flex-col items-center">
        <motion.button
          whileHover={playCount < MAX_PLAYS && !isPlaying ? { scale: 1.05 } : {}}
          whileTap={playCount < MAX_PLAYS && !isPlaying ? { scale: 0.95 } : {}}
          onClick={() => playSequence(toneSequence, true)}
          disabled={playCount >= MAX_PLAYS || isPlaying}
          className={`w-32 h-32 rounded-full flex items-center justify-center border transition-all ${
            isPlaying 
              ? 'border-[#8b5cf6] bg-[#8b5cf6]/20 shadow-[0_0_30px_rgba(139,92,246,0.3)]' 
              : playCount >= MAX_PLAYS 
                ? 'border-gray-700 bg-gray-900 opacity-50 cursor-not-allowed'
                : 'border-[#8b5cf6]/50 hover:bg-[#8b5cf6]/10 hover:border-[#8b5cf6] cursor-pointer'
          }`}
        >
          {isPlaying ? (
            <Volume2 className="w-12 h-12 text-[#8b5cf6] animate-pulse" />
          ) : (
            <Play className={`w-12 h-12 ml-2 ${playCount >= MAX_PLAYS ? 'text-gray-600' : 'text-[#8b5cf6]'}`} />
          )}
        </motion.button>
        <div className="mt-6 text-sm font-mono text-gray-500 uppercase tracking-widest">
          Target Plays Remaining: {MAX_PLAYS - playCount}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {options.map((opt: any, i: number) => (
          <motion.div
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(opt.id)}
            className="p-6 glass-panel flex flex-col items-center hover:border-[#8b5cf6] transition-colors group cursor-pointer"
          >
            <span className="text-lg text-gray-300 group-hover:text-white mb-2">{opt.description || 'Sequence ' + (i+1)}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); playSequence(opt.sequence, false); }}
              className="text-xs text-[#8b5cf6] uppercase tracking-wider flex items-center gap-2 hover:text-white"
            >
              <Play className="w-3 h-3" /> Preview
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
