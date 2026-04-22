export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';
export type Modality = 'VISUAL_MATRIX' | 'NUMERICAL' | 'LOGICAL' | 'AUDIO_TONES' | 'MEMORY' | 'SPEED';

export interface TestQuestion {
  id: string;
  modality: Modality;
  difficulty: Difficulty;
  instruction: string;
  questionData: any; // specific to modality
  options: { id: string; content?: any; item?: any; sequence?: any; isCorrect: boolean }[];
  timeLimit: number;
}

export function generateProceduralQuestion(modality: Modality, difficulty: Difficulty): TestQuestion {
  let timeLimit = 30;
  if(difficulty === 'HARD' || difficulty === 'EXPERT') timeLimit = 45;
  if(modality === 'SPEED') timeLimit = 10;
  if(modality === 'MEMORY') timeLimit = 20;

  let parsed: any = {};
  
  if (modality === 'VISUAL_MATRIX') {
    const shapes = ['circle', 'square', 'triangle', 'diamond', 'hexagon', 'star', 'cross'];
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];
    
    const rShape1 = shapes[Math.floor(Math.random() * shapes.length)];
    const rShape2 = shapes[Math.floor(Math.random() * shapes.length)];
    const rShape3 = shapes[Math.floor(Math.random() * shapes.length)];
    
    // Scramble colors
    const rColors = [...colors].sort(() => Math.random() - 0.5);
    
    if (difficulty === 'EASY' || difficulty === 'MEDIUM') {
      parsed = {
        instruction: "What comes next in the pattern?",
        matrix: [
          { shape: rShape1, color: rColors[0], fill: "solid" }, { shape: rShape1, color: rColors[1], fill: "outline" }, { shape: rShape1, color: rColors[2], fill: "solid" },
          { shape: rShape2, color: rColors[0], fill: "solid" }, { shape: rShape2, color: rColors[1], fill: "outline" }, { shape: rShape2, color: rColors[2], fill: "solid" },
          { shape: rShape3, color: rColors[0], fill: "solid" }, { shape: rShape3, color: rColors[1], fill: "outline" }
        ],
        options: [
          { id: "1", item: { shape: rShape3, color: rColors[2], fill: "outline" }, isCorrect: false },
          { id: "2", item: { shape: rShape3, color: rColors[2], fill: "solid" }, isCorrect: true },
          { id: "3", item: { shape: rShape2, color: rColors[2], fill: "solid" }, isCorrect: false },
          { id: "4", item: { shape: shapes[Math.floor(Math.random()*shapes.length)], color: rColors[1], fill: "dotted" }, isCorrect: false }
        ].sort(() => Math.random() - 0.5)
      };
    } else {
      // Hard / Expert visual logic (diagonal cycling)
      parsed = {
        instruction: "What completes the visual logical matrix?",
        matrix: [
          { shape: shapes[0], color: colors[0], fill: "solid" }, { shape: shapes[1], color: colors[1], fill: "outline" }, { shape: shapes[2], color: colors[2], fill: "solid" },
          { shape: shapes[1], color: colors[1], fill: "outline" }, { shape: shapes[2], color: colors[2], fill: "dotted" }, { shape: shapes[0], color: colors[0], fill: "outline" },
          { shape: shapes[2], color: colors[2], fill: "solid" }, { shape: shapes[0], color: colors[0], fill: "outline" }
        ],
        options: [
          { id: "1", item: { shape: shapes[1], color: colors[1], fill: "solid" }, isCorrect: true },
          { id: "2", item: { shape: shapes[0], color: colors[2], fill: "outline" }, isCorrect: false },
          { id: "3", item: { shape: shapes[2], color: colors[1], fill: "dotted" }, isCorrect: false },
          { id: "4", item: { shape: shapes[1], color: colors[0], fill: "solid" }, isCorrect: false }
        ].sort(() => Math.random() - 0.5)
      };
    }
  } else if (modality === 'NUMERICAL') {
    const start = Math.floor(Math.random() * 20) + 1;
    let seq = [];
    let answer = 0;
    
    if (difficulty === 'EASY') {
      const step = Math.floor(Math.random() * 10) + 2;
      seq = [start, start + step, start + step * 2, start + step * 3];
      answer = start + step * 4;
    } else if (difficulty === 'MEDIUM') {
      const step = Math.floor(Math.random() * 4) + 2;
      seq = [start, start * step, start * Math.pow(step, 2), start * Math.pow(step, 3)];
      answer = start * Math.pow(step, 4);
    } else if (difficulty === 'HARD') {
      seq = [start, start + 1];
      for (let i = 2; i < 5; i++) {
        seq.push(seq[i-1] + seq[i-2]);
      }
      answer = seq[4] + seq[3];
    } else {
      // Expert: Alternating pattern
      const p1 = Math.floor(Math.random() * 5) + 2;
      const p2 = Math.floor(Math.random() * 3) + 2;
      seq = [start, start * p1, (start * p1) - p2, ((start * p1) - p2) * p1, (((start * p1) - p2) * p1) - p2];
      answer = ((((start * p1) - p2) * p1) - p2) * p1;
    }
    
    parsed = {
      instruction: "What number comes next?",
      sequence: [...seq.map(s => s.toString()), "?"],
      options: [
        { id: "1", content: (answer + Math.floor(Math.random()*5)+1).toString(), isCorrect: false },
        { id: "2", content: answer.toString(), isCorrect: true },
        { id: "3", content: (answer - Math.floor(Math.random()*5)-1).toString(), isCorrect: false },
        { id: "4", content: (answer * 2).toString(), isCorrect: false }
      ].sort(() => Math.random() - 0.5)
    };
  } else if (modality === 'LOGICAL') {
    const nouns = ['Zorbs', 'Gloops', 'Flarks', 'Blyps', 'Cromps', 'Quarks', 'Snirps'].sort(() => Math.random() - 0.5);
    
    if (difficulty === 'EASY') {
      parsed = {
        instruction: `All ${nouns[0]} are ${nouns[1]}. ${nouns[2]} is a ${nouns[0]}.`,
        questionText: `Is ${nouns[2]} a ${nouns[1]}?`,
        options: [
          { id: "1", content: "Yes, definitely", isCorrect: true },
          { id: "2", content: "No, definitely not", isCorrect: false },
          { id: "3", content: "It is impossible to tell", isCorrect: false }
        ].sort(() => Math.random() - 0.5)
      };
    } else if (difficulty === 'MEDIUM') {
      parsed = {
        instruction: `All ${nouns[0]} are ${nouns[1]}. Some ${nouns[1]} are ${nouns[2]}.`,
        questionText: `Are all ${nouns[0]} ${nouns[2]}?`,
        options: [
          { id: "1", content: "Yes, definitely", isCorrect: false },
          { id: "2", content: "No, definitely not", isCorrect: false },
          { id: "3", content: "It is impossible to tell", isCorrect: true },
          { id: "4", content: "Some are, some are not", isCorrect: false }
        ].sort(() => Math.random() - 0.5)
      };
    } else if (difficulty === 'HARD') {
      parsed = {
        instruction: `No ${nouns[0]} are ${nouns[1]}. All ${nouns[2]} are ${nouns[0]}.`,
        questionText: `Can a ${nouns[2]} be a ${nouns[1]}?`,
        options: [
          { id: "1", content: "Yes, definitely", isCorrect: false },
          { id: "2", content: "No, definitely not", isCorrect: true },
          { id: "3", content: "Only if it is also a " + nouns[3], isCorrect: false },
          { id: "4", content: "Impossible to tell", isCorrect: false }
        ].sort(() => Math.random() - 0.5)
      };
    } else {
      parsed = {
        instruction: `If it rains, the ${nouns[0]} turn green. The ${nouns[0]} are not green. ${nouns[1]} only sleep when it rains.`,
        questionText: `Are the ${nouns[1]} sleeping?`,
        options: [
          { id: "1", content: "Yes, they are sleeping.", isCorrect: false },
          { id: "2", content: "No, they are not sleeping.", isCorrect: true },
          { id: "3", content: "It is impossible to tell.", isCorrect: false }
        ].sort(() => Math.random() - 0.5)
      };
    }
  } else if (modality === 'AUDIO_TONES') {
    // Generate scale-based audio based on difficulty
    const cScale = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];
    const chromatic = [261.63, 277.18, 293.66, 311.13, 329.63, 349.23, 369.99, 392.00, 415.30, 440.00];

    const pool = (difficulty === 'HARD' || difficulty === 'EXPERT') ? chromatic : cScale;
    const len = difficulty === 'EASY' ? 3 : difficulty === 'MEDIUM' ? 4 : difficulty === 'HARD' ? 6 : 8;

    const seq = [];
    for(let i=0; i<len; i++) {
        seq.push(pool[Math.floor(Math.random() * pool.length)]);
    }
    
    // Create subtle fake options
    const fake1 = [...seq]; fake1[fake1.length - 1] = pool[Math.floor(Math.random() * pool.length)];
    if(fake1[fake1.length-1]===seq[seq.length-1]) fake1[fake1.length-1] = pool[0]; // guarantee diff
    
    const fake2 = [...seq].reverse();
    const fake3 = [seq[0], seq[1], ...seq.slice(2).reverse()];

    parsed = {
      instruction: "Listen to the tones. Which sequence matches what you heard exactly?",
      toneSequence: seq,
      options: [
        { id: "1", sequence: seq, description: "Sequence A", isCorrect: true },
        { id: "2", sequence: fake1, description: "Sequence B", isCorrect: false },
        { id: "3", sequence: fake2, description: "Sequence C", isCorrect: false },
        { id: "4", sequence: fake3, description: "Sequence D", isCorrect: false }
      ].sort(() => Math.random() - 0.5)
    };
  } else if (modality === 'MEMORY') {
    const wordBank = ['Quantum', 'Nebula', 'Cipher', 'Vortex', 'Prism', 'Aurora', 'Zenith', 'Echo', 'Flux', 'Pulse', 'Onyx', 'Nova', 'Axiom', 'Nexus'];
    const shuffled = [...wordBank].sort(() => Math.random() - 0.5);
    
    const numItems = difficulty === 'EASY' ? 4 : difficulty === 'MEDIUM' ? 6 : difficulty === 'HARD' ? 9 : 14;
    const items = shuffled.slice(0, numItems);
    
    const targetIdx = Math.floor(Math.random() * numItems);
    
    parsed = {
      instruction: `Memorize these ${numItems} items.`,
      itemsToMemorize: items,
      questionText: `What was item number ${targetIdx + 1}?`,
      options: [
        { id: "1", content: items[targetIdx], isCorrect: true },
        { id: "2", content: items[(targetIdx + 1) % numItems], isCorrect: false },
        { id: "3", content: shuffled[13], isCorrect: false },
        { id: "4", content: shuffled[12], isCorrect: false }
      ].sort(() => Math.random() - 0.5)
    };
  } else {
    // SPEED
    const chars = difficulty === 'EXPERT' ? 'Il1O08B5S2Z' : 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let str1 = '';
    const len = difficulty === 'EASY' ? 5 : difficulty === 'MEDIUM' ? 8 : difficulty === 'HARD' ? 14 : 24;
    
    for(let i=0; i<len; i++) {
        str1 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    let str2 = str1;
    const isMatched = Math.random() > 0.5;
    if (!isMatched) {
      const split = str1.split('');
      const mutateIdx = Math.floor(Math.random() * len);
      // Guarantee mutated char is strictly different
      let newChar = chars.charAt(Math.floor(Math.random() * chars.length));
      while(newChar === split[mutateIdx]) newChar = chars.charAt(Math.floor(Math.random() * chars.length));
      split[mutateIdx] = newChar;
      str2 = split.join('');
    }

    parsed = {
      instruction: "Are these two items exactly the same?",
      statement1: str1,
      statement2: str2,
      options: [
        { id: "1", content: "Yes", isCorrect: isMatched },
        { id: "2", content: "No", isCorrect: !isMatched }
      ]
    };
  }

  return {
    id: Math.random().toString(36).substring(7),
    modality,
    difficulty,
    instruction: parsed.instruction,
    questionData: parsed,
    options: parsed.options,
    timeLimit
  };
}
