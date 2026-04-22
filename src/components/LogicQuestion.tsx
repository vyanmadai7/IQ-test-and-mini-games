import React from 'react';
import { motion } from 'motion/react';

export function LogicQuestion({ question, onAnswer }: { question: any, onAnswer: (optionId: string) => void }) {
  const { questionText, options } = question.questionData;

  return (
    <div className="flex flex-col items-center w-full max-w-2xl mx-auto">
      <div className="mb-12 p-8 glass-panel w-full border-l-4 border-l-[#3b82f6]">
        <p className="text-xl sm:text-2xl font-sans font-light leading-relaxed text-gray-200">
          {questionText}
        </p>
      </div>

      <div className="flex flex-col gap-4 w-full">
        {options.map((opt: any, i: number) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.01, x: 8 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => onAnswer(opt.id)}
            className="p-6 text-left glass-panel text-lg font-sans hover:border-[#3b82f6] transition-all text-[#8E9299] hover:text-white"
          >
            {opt.content}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
