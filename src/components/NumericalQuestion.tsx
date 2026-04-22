import React from 'react';
import { motion } from 'motion/react';

export function NumericalQuestion({ question, onAnswer }: { question: any, onAnswer: (optionId: string) => void }) {
  const { sequence, options } = question.questionData;
  
  // ensure last item is ? or add it if not exists. Usually we asked Gemini to put ? at the end.
  const seq = Array.isArray(sequence) ? sequence : [];

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 mb-16">
        {seq.map((item, i) => (
          <React.Fragment key={i}>
            <div className={`text-4xl sm:text-6xl font-mono font-light ${item === '?' ? 'text-blue-400' : 'text-white'}`}>
              {item}
            </div>
            {i < seq.length - 1 && (
              <div className="text-[rgba(255,255,255,0.2)] text-2xl font-light">,</div>
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
        {options.map((opt: any, i: number) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onAnswer(opt.id)}
            className="p-6 glass-panel text-2xl font-mono hover:border-blue-400 transition-colors text-slate-400 hover:text-white"
          >
            {opt.content}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
