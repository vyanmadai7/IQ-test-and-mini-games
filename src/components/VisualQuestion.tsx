import React from 'react';
import { motion } from 'motion/react';
import { Shape } from './Shape';

export function VisualQuestion({ question, onAnswer }: { question: any, onAnswer: (optionId: string) => void }) {
  const { matrix, options } = question.questionData;

  // matrix is 8 items. 9th is the question mark.
  const gridItems = [...(matrix || []), null]; 

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-8 sm:mb-12 p-4 sm:p-6 glass-panel max-w-[400px] w-full">
        {gridItems.map((item, i) => (
          <div key={i} className="aspect-square w-full flex items-center justify-center border border-[rgba(255,255,255,0.1)] rounded-xl bg-[rgba(255,255,255,0.02)]">
            {item ? (
              <Shape shape={item.shape} color={item.color} fill={item.fill} />
            ) : (
              <span className="text-3xl sm:text-4xl text-[rgba(255,255,255,0.2)] font-mono">?</span>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 w-full">
        {options.map((opt: any, i: number) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => onAnswer(opt.id)}
            className="p-4 sm:p-6 glass-panel flex flex-col items-center justify-center gap-2 sm:gap-4 hover:border-emerald-500 transition-colors group"
          >
            <div className="flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16">
               <Shape shape={opt.item.shape} color={opt.item.color} fill={opt.item.fill} size={32} />
            </div>
            <span className="text-[10px] sm:text-xs uppercase tracking-widest text-slate-400 group-hover:text-white transition-colors">
              Option {i + 1}
            </span>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
