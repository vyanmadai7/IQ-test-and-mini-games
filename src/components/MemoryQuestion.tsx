import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

export function MemoryQuestion({ question, onAnswer }: { question: any, onAnswer: (optionId: string) => void }) {
  const { itemsToMemorize, questionText, options } = question.questionData;
  const [phase, setPhase] = useState<'MEMORIZE' | 'RECALL'>('MEMORIZE');
  const [timeLeft, setTimeLeft] = useState(5);

  useEffect(() => {
    if (phase === 'MEMORIZE') {
      const interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setPhase('RECALL');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [phase]);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto h-[400px] justify-center">
      <AnimatePresence mode="wait">
        {phase === 'MEMORIZE' ? (
          <motion.div
            key="memorize"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, filter: 'blur(10px)' }}
            className="flex flex-col items-center w-full"
          >
            <div className="text-slate-400 stat-label mb-8 flex items-center gap-4">
              <span className="w-8 h-[1px] bg-white/20"></span>
              Memorize This
              <span className="w-8 h-[1px] bg-white/20"></span>
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-12">
              {itemsToMemorize.map((item: string, i: number) => (
                <div key={i} className="px-6 py-4 glass-panel text-2xl font-sans text-white border border-blue-500/50">
                  {item}
                </div>
              ))}
            </div>

            <div className="text-3xl font-mono text-blue-400">
              00:0{timeLeft}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="recall"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex justify-center flex-col items-center"
          >
            <div className="text-2xl font-light mb-12 text-center text-white">
              {questionText}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
              {options.map((opt: any, i: number) => (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onAnswer(opt.id)}
                  className="p-6 glass-panel text-xl hover:border-[#f59e0b] transition-colors text-[#8E9299] hover:text-white"
                >
                  {opt.content}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
