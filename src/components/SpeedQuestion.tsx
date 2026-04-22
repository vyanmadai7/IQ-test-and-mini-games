import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';

export function SpeedQuestion({ question, onAnswer }: { question: any, onAnswer: (optionId: string) => void }) {
  const { statement1, statement2, options } = question.questionData;
  const [timeLeft, setTimeLeft] = useState(question.timeLimit || 10);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onAnswer(''); // Timeout
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [onAnswer, question.timeLimit]);

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      
      <div className="absolute top-8 right-8 flex items-center gap-3">
        <span className="text-xs tracking-widest text-[#ef4444] uppercase font-mono animate-pulse">Time Limit</span>
        <div className="text-3xl font-mono text-[#ef4444] font-light mt-[-2px]">{timeLeft}s</div>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-8 mb-16 w-full justify-center">
        <div className="p-8 glass-panel w-full sm:w-1/2 flex items-center justify-center min-h-[120px]">
          <span className="text-2xl font-mono text-white text-center">{statement1}</span>
        </div>
        <div className="text-[rgba(255,255,255,0.2)] text-2xl font-light">vs</div>
        <div className="p-8 glass-panel w-full sm:w-1/2 flex items-center justify-center min-h-[120px]">
          <span className="text-2xl font-mono text-white text-center">{statement2}</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-center gap-4 w-full">
        {options.map((opt: any, i: number) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAnswer(opt.id)}
            className="w-full sm:w-48 py-4 glass-panel text-lg hover:border-[#ef4444] transition-colors text-white font-sans tracking-wide"
          >
            {opt.content}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
