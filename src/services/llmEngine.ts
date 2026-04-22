import { GoogleGenAI } from '@google/genai';
import { TestQuestion, Modality, Difficulty } from './proceduralEngine';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateIQQuestionFromLLM(modality: Modality, difficulty: Difficulty): Promise<TestQuestion | null> {
  let prompt = '';
  
  if (modality === 'LOGICAL') {
     prompt = `Generate a rigorous logical reasoning IQ test question. Difficulty: ${difficulty}. Ensure variety in question structure (syllogisms, truth-teller logic, relational).
     Output purely in JSON format like this:
     {
       "instruction": "Read the following premises...",
       "questionText": "What can be concluded?",
       "options": [
          { "id": "1", "content": "Conclusion A", "isCorrect": true },
          { "id": "2", "content": "Conclusion B", "isCorrect": false },
          { "id": "3", "content": "Conclusion C", "isCorrect": false },
          { "id": "4", "content": "Conclusion D", "isCorrect": false }
       ]
     }`;
  } else if (modality === 'NUMERICAL') {
     prompt = `Generate a numerical sequence IQ test question. Difficulty: ${difficulty}. Ensure mathematical variety (fibonacci combinations, exponent patterns, interleaved sequences).
     Output purely in JSON format like this:
     {
       "instruction": "What number comes next?",
       "sequence": ["2", "4", "8", "16", "?"],
       "options": [
          { "id": "1", "content": "32", "isCorrect": true },
          { "id": "2", "content": "24", "isCorrect": false },
          { "id": "3", "content": "48", "isCorrect": false },
          { "id": "4", "content": "64", "isCorrect": false }
       ]
     }`;
  } else if (modality === 'VISUAL_MATRIX') {
     prompt = `Generate a visual logic pattern matrix puzzle. Difficulty: ${difficulty}. The matrix must contain exactly 8 items, representing a 3x3 grid with the 9th item missing.
     Valid shapes: 'circle', 'square', 'triangle', 'diamond', 'hexagon', 'star', 'cross'.
     Valid fills: 'solid', 'outline', 'dotted'.
     Valid colors: Hex codes like "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6".
     Output purely in JSON format like this:
     {
       "instruction": "What completes the pattern?",
       "matrix": [
         { "shape": "circle", "color": "#ef4444", "fill": "solid" },
         { "shape": "circle", "color": "#10b981", "fill": "outline" },
         { "shape": "circle", "color": "#3b82f6", "fill": "solid" },
         { "shape": "square", "color": "#ef4444", "fill": "solid" },
         { "shape": "square", "color": "#10b981", "fill": "outline" },
         { "shape": "square", "color": "#3b82f6", "fill": "solid" },
         { "shape": "triangle", "color": "#ef4444", "fill": "solid" },
         { "shape": "triangle", "color": "#10b981", "fill": "outline" }
       ],
       "options": [
          { "id": "1", "item": { "shape": "triangle", "color": "#x", "fill": "x" }, "isCorrect": false },
          { "id": "2", "item": { "shape": "triangle", "color": "#3b82f6", "fill": "solid" }, "isCorrect": true },
          { "id": "3", "item": { "shape": "x", "color": "x", "fill": "x" }, "isCorrect": false },
          { "id": "4", "item": { "shape": "x", "color": "x", "fill": "x" }, "isCorrect": false }
       ]
     }`;
  } else if (modality === 'MEMORY') {
     prompt = `Generate a short-term memory task. Difficulty: ${difficulty}. Provide a list of highly unusual words, coordinates, or symbols ranging from 5 to 15 items long based on difficulty.
     Output purely in JSON format like this:
     {
       "instruction": "Memorize this exact sequence constraints.",
       "itemsToMemorize": ["Quantum", "Nebula", "Cipher", "Vortex", "Prism"],
       "questionText": "What was the 3rd item?",
       "options": [
          { "id": "1", "content": "Cipher", "isCorrect": true },
          { "id": "2", "content": "Vortex", "isCorrect": false },
          { "id": "3", "content": "Aurora", "isCorrect": false },
          { "id": "4", "content": "Nebula", "isCorrect": false }
       ]
     }`;
  } else if (modality === 'SPEED') {
      prompt = `Generate a processing speed task. Difficulty: ${difficulty}. The user must rapidly verify if two complex statements (like massive chaotic alphanumeric strings, or identical phrases with a 1 character mutation) match.
     Output purely in JSON format like this:
     {
       "instruction": "Are these two sets exactly identical?",
       "statement1": "X8K9LQ22VZ1M",
       "statement2": "X8K9LQ22VZ7M",
       "options": [
          { "id": "1", "content": "Yes", "isCorrect": false },
          { "id": "2", "content": "No", "isCorrect": true }
       ]
     }`;
  } else if (modality === 'AUDIO_TONES') {
     prompt = `Generate an audio memory/pattern question. Difficulty: ${difficulty}. 
     Given these allowed frequencies [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00, 493.88, 523.25], generate a sequence array of floats tracking a melody.
     Output purely in JSON format like this:
     {
       "instruction": "Listen to the tones. Which sequence matches what you heard exactly?",
       "toneSequence": [261.63, 329.63, 392.00],
       "options": [
         { "id": "1", "sequence": [261.63, 329.63, 392.00], "description": "Sequence A", "isCorrect": true },
         { "id": "2", "sequence": [261.63, 293.66, 440.00], "description": "Sequence B", "isCorrect": false },
         { "id": "3", "sequence": [329.63, 261.63, 392.00], "description": "Sequence C", "isCorrect": false },
         { "id": "4", "sequence": [261.63, 329.63, 523.25], "description": "Sequence D", "isCorrect": false }
       ]
     }`;
  } else {
     return null;
  }

  try {
     const response = await ai.models.generateContent({
        model: 'gemini-3.1-flash-core', // use fast model
        contents: prompt
     });

     let text = response.text || '';
     text = text.replace(/```json/g, '').replace(/```/g, '').trim();
     
     const parsed = JSON.parse(text);

     let timeLimit = 30;
     if(difficulty === 'HARD' || difficulty === 'EXPERT') timeLimit = 45;

     return {
        id: Math.random().toString(36).substring(7),
        modality,
        difficulty,
        instruction: parsed.instruction,
        questionData: parsed,
        options: parsed.options,
        timeLimit
     };
  } catch (err) {
     return null;
  }
}
