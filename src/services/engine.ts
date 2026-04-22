import { Modality, Difficulty } from './geminiService';

export interface AnswerRecord {
  modality: Modality;
  difficulty: Difficulty;
  isCorrect: boolean;
  timeTaken: number;
  timeLimit: number;
}

const MODALITY_WEIGHTS: Record<Modality, number> = {
  VISUAL_MATRIX: 1.0,
  LOGICAL: 1.0,
  NUMERICAL: 1.0,
  AUDIO_TONES: 1.2,
  MEMORY: 1.3,
  SPEED: 1.0
};

const DIFFICULTY_WEIGHTS: Record<Difficulty, number> = {
  EASY: 0.5,
  MEDIUM: 1.0,
  HARD: 1.5,
  EXPERT: 2.0
};

export function calculatePoints(record: AnswerRecord): { earned: number, max: number } {
  const dWeight = DIFFICULTY_WEIGHTS[record.difficulty];
  const mWeight = MODALITY_WEIGHTS[record.modality];
  
  let timeFactor = 1.0;
  if (record.isCorrect) {
    const expectedTime = record.timeLimit * 0.7;
    timeFactor = Math.min(1.5, Math.max(0.5, expectedTime / Math.max(1, record.timeTaken)));
  }

  const maxPoints = dWeight * mWeight * 1.5;
  const earnedPoints = record.isCorrect ? (dWeight * mWeight * timeFactor) : 0;

  return { 
    earned: Math.round(earnedPoints * 100), 
    max: Math.round(maxPoints * 100) 
  };
}

export function calculateIQ(records: AnswerRecord[]) {
  if (records.length === 0) return { iq: 100, radar: [], rawPct: 0, totalScore: 0 };

  let totalR = 0;
  let totalMaxR = 0;
  let totalScore = 0;
  
  const modalityScores: Record<string, { earned: number, max: number }> = {};
  
  Object.keys(MODALITY_WEIGHTS).forEach(m => {
    modalityScores[m] = { earned: 0, max: 0 };
  });

  records.forEach(r => {
    const points = calculatePoints(r);
    totalScore += points.earned;

    // Use raw math for IQ calculations mapping
    const dWeight = DIFFICULTY_WEIGHTS[r.difficulty];
    const mWeight = MODALITY_WEIGHTS[r.modality];
    let timeFactor = 1.0;
    if (r.isCorrect) {
      const expectedTime = r.timeLimit * 0.7; // expects to finish in 70% of time
      timeFactor = Math.min(1.5, Math.max(0.5, expectedTime / Math.max(1, r.timeTaken)));
    }
    const maxP = dWeight * mWeight * 1.5;
    const earnedP = r.isCorrect ? (dWeight * mWeight * timeFactor) : 0;

    totalR += earnedP;
    totalMaxR += maxP;

    modalityScores[r.modality].earned += earnedP;
    modalityScores[r.modality].max += maxP;
  });

  // Calculate raw percentage
  const rawPct = totalMaxR > 0 ? totalR / totalMaxR : 0;
  
  // Map to IQ scale (mean 100, std 15). Let's assume 0.5 rawPct maps to 100 IQ.
  // This is a simulated normal distribution mapping for the app
  const zScore = (rawPct - 0.5) / 0.15; 
  const iq = Math.round(100 + (15 * zScore));
  
  const radar = Object.keys(modalityScores).map(mod => {
    const s = modalityScores[mod];
    return {
      subject: mod.replace('_', ' '),
      score: s.max > 0 ? Math.round((s.earned / s.max) * 100) : 0
    }
  });

  return { iq, radar, rawPct, totalScore };
}
