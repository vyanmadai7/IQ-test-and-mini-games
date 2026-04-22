import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrainCircuit, Fingerprint, Activity, Share2, X, Star, ArrowRight, Layers, Cpu, Globe, Boxes } from 'lucide-react';
import { generateQuestion, generateInsight, generateCognitiveArt, Modality, Difficulty, TestQuestion } from './services/geminiService';
import { calculateIQ, calculatePoints, AnswerRecord } from './services/engine';
import { VisualQuestion } from './components/VisualQuestion';
import { NumericalQuestion } from './components/NumericalQuestion';
import { LogicQuestion } from './components/LogicQuestion';
import { MemoryQuestion } from './components/MemoryQuestion';
import { AudioQuestion } from './components/AudioQuestion';
import { SpeedQuestion } from './components/SpeedQuestion';
import { CognitiveProfileChart } from './components/CognitiveProfileChart';
import { SudokuGame } from './components/SudokuGame';
import { ReflexGame } from './components/ReflexGame';
import { SpatialGame } from './components/SpatialGame';
import { ChessGame } from './components/ChessGame';
import { useAntiCheat } from './hooks/useAntiCheat';

const MODALITIES: Modality[] = [
  'VISUAL_MATRIX',
  'NUMERICAL',
  'MEMORY',
  'AUDIO_TONES',
  'LOGICAL',
  'SPEED'
];

export function generateTestSequence(length: number): Modality[] {
  const seq: Modality[] = [];
  while (seq.length < length) {
    const block = [...MODALITIES].sort(() => Math.random() - 0.5);
    seq.push(...block);
  }
  return seq.slice(0, length);
}

export default function App() {
  const [appState, setAppState] = useState<'HOME' | 'LOADING' | 'TEST' | 'RESULTS' | 'GAMES' | 'SUDOKU' | 'REFLEX' | 'SPATIAL' | 'CHESS'>('HOME');
  useAntiCheat(appState === 'TEST');
  const [testLength, setTestLength] = useState<number>(40);
  const [testSequence, setTestSequence] = useState<Modality[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('MEDIUM');
  const [currentQuestion, setCurrentQuestion] = useState<TestQuestion | null>(null);
  const [records, setRecords] = useState<AnswerRecord[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const [liveScore, setLiveScore] = useState<number>(0);
  
  // Results
  const [results, setResults] = useState<{ iq: number, radar: any[], rawPct: number, totalScore: number } | null>(null);
  const [insight, setInsight] = useState<string>('');
  const [shareText, setShareText] = useState<string>('Share');
  const [cognitiveArt, setCognitiveArt] = useState<string | null>(null);

  const prefetchPromise = useRef<{ index: number; diff: Difficulty; promise: Promise<TestQuestion> } | null>(null);

  const triggerPrefetch = (index: number, diff: Difficulty, seq: Modality[]) => {
    if (index >= seq.length) return;
    const promise = generateQuestion(seq[index], diff);
    prefetchPromise.current = { index, diff, promise };
    promise.catch(() => {});
  };

  const startTest = () => {
    setRecords([]);
    setLiveScore(0);
    setCurrentQuestionIndex(0);
    const newSeq = generateTestSequence(testLength);
    setTestSequence(newSeq);
    loadNextQuestion(0, difficulty, newSeq);
  };

  const loadNextQuestion = async (index: number, diff: Difficulty, seq: Modality[] = testSequence) => {
    setAppState('LOADING');
    try {
      const modality = seq[index];
      let q: TestQuestion;
      if (prefetchPromise.current && prefetchPromise.current.index === index) {
        q = await prefetchPromise.current.promise;
      } else {
        q = await generateQuestion(modality, diff);
      }
      setCurrentQuestion(q);
      
      // Extremely fast transition (just enough for a quick flicker animation)
      setTimeout(() => {
        setAppState('TEST');
        setStartTime(Date.now());
      }, 50); // 50ms is practically instant but triggers animation
      
      triggerPrefetch(index + 1, diff, seq);
    } catch (e) {
      console.error(e);
      prefetchPromise.current = null;
      setTimeout(() => loadNextQuestion(index, diff, seq), 500);
    }
  };

  const processAnswer = async (optionId: string) => {
    if (!currentQuestion) return;
    const timeTaken = (Date.now() - startTime) / 1000;
    
    // Check if correct
    let isCorrect = false;
    const correctOption = currentQuestion.options.find(o => o.isCorrect);
    if (correctOption && correctOption.id === optionId) {
      isCorrect = true;
    }

    const newRecord: AnswerRecord = {
      modality: currentQuestion.modality,
      difficulty: currentQuestion.difficulty,
      isCorrect,
      timeTaken,
      timeLimit: currentQuestion.timeLimit
    };
    
    const pts = calculatePoints(newRecord);
    setLiveScore(prev => prev + pts.earned);

    const newRecords = [...records, newRecord];
    setRecords(newRecords);

    // Adapt difficulty for next
    let nextDiff = difficulty;
    if (newRecords.length >= 2) {
      const lastTwo = newRecords.slice(-2);
      if (lastTwo.every(r => r.isCorrect)) {
        if (nextDiff === 'MEDIUM') nextDiff = 'HARD';
        else if (nextDiff === 'HARD') nextDiff = 'EXPERT';
      } else if (lastTwo.every(r => !r.isCorrect)) {
        if (nextDiff === 'EXPERT') nextDiff = 'HARD';
        else if (nextDiff === 'HARD') nextDiff = 'MEDIUM';
        else if (nextDiff === 'MEDIUM') nextDiff = 'EASY';
      }
    }
    setDifficulty(nextDiff);

    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < testSequence.length) {
      setCurrentQuestionIndex(nextIndex);
      loadNextQuestion(nextIndex, nextDiff);
    } else {
      // Finish
      finishTest(newRecords);
    }
  };

  const finishTest = async (finalRecords: AnswerRecord[]) => {
    setAppState('LOADING');
    const computed = calculateIQ(finalRecords);
    setResults(computed as any);
    
    // Concurrently fetch insight and art
    const sortedRadar = [...computed.radar].sort((a, b) => b.score - a.score);
    const topStrength = sortedRadar[0]?.subject || 'Cognitive Processing';

    try {
      const [insightText, artBase64] = await Promise.all([
        generateInsight(computed.iq, computed.radar),
        generateCognitiveArt(topStrength, computed.iq).catch(() => null) // Ignore image errors (e.g. rate limit)
      ]);

      setInsight(insightText);
      if(artBase64) setCognitiveArt(artBase64);
    } catch (e) {
      console.error(e);
      setInsight("Due to high system load, insight generation failed.");
    }
    
    setAppState('RESULTS');
  };

  const handleShare = async () => {
    if (!results) return;
    
    const sortedRadar = [...results.radar].sort((a, b) => b.score - a.score);
    const topStrength = sortedRadar[0]?.subject || 'Cognitive';
    
    const text = `🧠 I scored an estimated ${results.iq} (${results.totalScore} pts) on the AI IQ-Test! My top strength is ${topStrength}.\n\nTry it out!`;
    const shareData = {
      title: 'IQ-Test Results',
      text: text,
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(`${shareData.text}\n${shareData.url}`);
        setShareText('Copied!');
        setTimeout(() => setShareText('Share'), 2000);
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const renderCurrentQuestion = () => {
    if(!currentQuestion) return null;
    
    const props = {
      question: currentQuestion,
      onAnswer: processAnswer
    };

    switch(currentQuestion.modality) {
      case 'VISUAL_MATRIX': return <VisualQuestion {...props} />;
      case 'NUMERICAL': return <NumericalQuestion {...props} />;
      case 'LOGICAL': return <LogicQuestion {...props} />;
      case 'AUDIO_TONES': return <AudioQuestion {...props} />;
      case 'MEMORY': return <MemoryQuestion {...props} />;
      case 'SPEED': return <SpeedQuestion {...props} />;
      default: return null;
    }
  };

  const isHome = appState === 'HOME';

  return (
    <div className={`min-h-screen relative overflow-x-hidden font-sans bg-[#030712] text-white`}>
      <div className="atmosphere-bg"></div>
      <div className="grid-pattern"></div>

      {!isHome && (
        <header className="absolute top-0 left-0 w-full px-4 py-4 sm:p-6 flex justify-between items-center z-50">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <BrainCircuit className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
          </div>
          <div className="leading-none">
            <h1 className="text-xl sm:text-2xl font-display font-bold tracking-tight">Mini Games & IQ</h1>
            <p className="text-[9px] sm:text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">Cognitive Evaluator</p>
          </div>
        </div>
        {appState === 'TEST' && (
           <div className="flex gap-4 sm:gap-8 items-center bg-slate-900/40 backdrop-blur-md px-4 sm:px-6 py-2 rounded-2xl border border-white/5 shadow-2xl">
             <div className="text-right hidden sm:block">
                <p className="stat-label mb-1">Score</p>
                <p className="text-sm font-semibold accent-blue">
                  <motion.span
                    key={liveScore}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {liveScore} <span className="opacity-50 text-xs text-white">pts</span>
                  </motion.span>
                </p>
             </div>
             <div className="hidden sm:block h-8 w-[1px] bg-white/10"></div>
             <div className="text-right hidden sm:block">
                <p className="stat-label mb-1">Test Type</p>
                <p className="text-sm font-semibold accent-emerald">{currentQuestion?.modality?.replace('_', ' ')}</p>
             </div>
             <div className="hidden sm:block h-8 w-[1px] bg-white/10"></div>
             <div className="text-right">
                <p className="stat-label mb-1">Progress</p>
                <p className="text-sm font-semibold text-white">{currentQuestionIndex + 1} <span className="opacity-30">/ {testSequence.length}</span></p>
             </div>
             <div className="h-8 w-[1px] bg-white/10"></div>
             <div className="text-right hidden sm:block">
                <p className="stat-label mb-1">Vector</p>
                 <p className="text-sm font-semibold accent-blue">{difficulty}</p>
             </div>
             <div className="hidden sm:block h-8 w-[1px] bg-white/10"></div>
             <button 
                onClick={() => setAppState('HOME')}
                className="group flex flex-col items-center justify-center hover:text-rose-400 transition-colors"
                title="Abort Test"
             >
                <X className="w-5 h-5 text-slate-400 group-hover:text-rose-400 transition-colors mb-0.5" />
                <span className="text-[9px] uppercase tracking-widest text-slate-500 font-bold group-hover:text-rose-400/70">Abort</span>
             </button>
          </div>
        )}
      </header>
      )}

      <main className={`relative z-10 w-full min-h-screen flex items-center justify-center ${isHome ? '' : 'p-4 sm:p-6 pt-24 sm:pt-28'}`}>
        <AnimatePresence mode="wait">
          
          {appState === 'HOME' && (
            <motion.div
              key="home"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="absolute inset-0 w-full min-h-screen text-white z-50 overflow-y-auto overflow-x-hidden p-0"
            >
              {/* Hero Container */}
              <div className="relative w-full max-w-[1600px] mx-auto min-h-screen flex flex-col justify-center px-4 sm:px-8 md:px-16 overflow-hidden">
                
                {/* Glows */}
                <div className="absolute top-0 left-0 w-[500px] md:w-[700px] h-[500px] md:h-[700px] bg-[#60B1FF] rounded-full blur-[100px] md:blur-[150px] opacity-20 pointer-events-none -translate-x-1/4 -translate-y-1/4" />
                <div className="absolute top-[10%] left-[10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-[#319AFF] rounded-full blur-[80px] md:blur-[120px] opacity-10 pointer-events-none" />

                <div className="flex flex-col lg:flex-row items-center justify-between gap-12 z-10 w-full relative h-full">
                  
                  {/* Left Column */}
                  <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left w-full max-w-2xl mt-12 lg:mt-0 z-10">
                    
                    <div className="w-full max-w-lg mb-12 flex flex-col gap-8 glass-panel p-8">
                      {/* Difficulty Level */}
                      <div className="w-full flex flex-col items-center lg:items-start">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">IQ Test Level</p>
                        <div className="flex gap-2 w-full bg-white/5 p-1 rounded-2xl border border-white/10">
                          {(['EASY', 'MEDIUM', 'HARD'] as Difficulty[]).map((level) => (
                            <button
                              key={level}
                              onClick={() => setDifficulty(level)}
                              className={`flex-1 py-3 px-4 rounded-[14px] text-xs sm:text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                                difficulty === level 
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
                                  : 'text-slate-400 hover:text-white hover:bg-white/10'
                              }`}
                            >
                              {level}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Question Frequency / Length */}
                      <div className="w-full flex flex-col items-center lg:items-start">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Number of Questions</p>
                        <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 w-full">
                          {[10, 20, 30, 40, 50, 60, 70, 80].map((len) => (
                            <button
                              key={len}
                              onClick={() => setTestLength(len)}
                              className={`w-12 h-12 flex items-center justify-center rounded-[14px] text-sm font-bold transition-all duration-300 ${
                                testLength === len 
                                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' 
                                  : 'bg-white/5 text-slate-300 border border-white/10 hover:bg-white/15'
                              }`}
                            >
                              {len}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 w-full min-w-[320px]">
                      <button
                        onClick={startTest}
                        className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 btn-primary rounded-[16px] text-white shadow-[inset_0_4px_4px_0_rgba(255,255,255,0.2),0_10px_20px_rgba(79,70,229,0.3)] hover:scale-[1.02] transition-transform duration-300"
                      >
                        <span className="font-semibold text-[20px] tracking-tight">Test Your IQ</span>
                        <div className="w-6 h-6 rounded-full bg-white flex items-center justify-center group-hover:translate-x-1 transition-transform">
                          <ArrowRight className="w-3 h-3 text-indigo-600" />
                        </div>
                      </button>
                      <button
                        onClick={() => setAppState('GAMES')}
                        className="group w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 btn-secondary rounded-[16px] text-white hover:scale-[1.02] transition-all duration-300"
                      >
                         <BrainCircuit className="w-5 h-5 text-indigo-400" /> 
                         <span className="font-semibold text-[20px] tracking-tight">Play Mini Games</span>
                      </button>
                    </div>

                  </div>

                  {/* Right Column (Glassy Orb) */}
                  <div className="flex-1 w-full flex items-center justify-center relative min-h-[450px] lg:min-h-[600px] pointer-events-none">
                     <video
                       autoPlay
                       loop
                       muted
                       playsInline
                       className="absolute left-1/2 top-1/2 -translate-y-1/2 -translate-x-1/2 lg:translate-x-0 lg:left-10 lg:-right-32 scale-110 md:scale-125 w-[140%] md:w-[120%] lg:w-[150%] max-w-none mix-blend-screen opacity-90"
                       style={{ filter: "hue-rotate(30deg) saturate(150%) brightness(1.2)" }}
                       src="https://future.co/images/homepage/glassy-orb/orb-purple.webm"
                     />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {appState === 'GAMES' && (
            <motion.div
              key="games"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl w-full flex flex-col items-center"
            >
              <h2 className="text-4xl font-light tracking-tight mb-2">Mental Sandbox</h2>
              <p className="text-slate-400 mb-12">Sharpen your cognitive abilities with these mini-games.</p>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
                {/* Game 1 */}
                <div onClick={() => setAppState('SUDOKU')} className="glass-panel p-6 flex flex-col items-center text-center hover:border-emerald-500 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Activity className="w-8 h-8 text-emerald-500" />
                  </div>
                  <h3 className="font-bold mb-2">Sudoku Logic</h3>
                  <p className="text-xs text-slate-400 mb-6">Classic 9x9 number grid puzzle.</p>
                  <button className="mt-auto px-4 py-2 bg-emerald-500/10 rounded text-xs uppercase tracking-widest font-bold w-full text-emerald-400 group-hover:bg-emerald-500/20">Play Now</button>
                </div>

                {/* Game 2 */}
                <div onClick={() => setAppState('REFLEX')} className="glass-panel p-6 flex flex-col items-center text-center hover:border-blue-400 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Fingerprint className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="font-bold mb-2">Reflex Rapid</h3>
                  <p className="text-xs text-slate-400 mb-6">Test your micro-reaction times.</p>
                  <button className="mt-auto px-4 py-2 bg-blue-500/10 rounded text-xs uppercase tracking-widest font-bold w-full text-blue-400 group-hover:bg-blue-500/20">Play Now</button>
                </div>

                {/* Game 3 */}
                <div onClick={() => setAppState('SPATIAL')} className="glass-panel p-6 flex flex-col items-center text-center hover:border-purple-500 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-purple-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <BrainCircuit className="w-8 h-8 text-purple-400" />
                  </div>
                  <h3 className="font-bold mb-2">Spatial Match</h3>
                  <p className="text-xs text-slate-400 mb-6">Remember and match hidden shapes.</p>
                  <button className="mt-auto px-4 py-2 bg-purple-500/10 rounded text-xs uppercase tracking-widest font-bold w-full text-purple-400 group-hover:bg-purple-500/20">Play Now</button>
                </div>

                {/* Game 4: Tactical Chess */}
                <div onClick={() => setAppState('CHESS')} className="glass-panel p-6 flex flex-col items-center text-center hover:border-yellow-500 transition-colors cursor-pointer group">
                  <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform text-yellow-500 font-bold text-4xl leading-none">
                    ♞
                  </div>
                  <h3 className="font-bold mb-2">Tactical Chess</h3>
                  <p className="text-xs text-slate-400 mb-6">Standard rules against a random bot.</p>
                  <button className="mt-auto px-4 py-2 bg-yellow-500/10 rounded text-xs uppercase tracking-widest font-bold w-full text-yellow-400 group-hover:bg-yellow-500/20">Play Now</button>
                </div>
              </div>

              <button 
                onClick={() => setAppState('HOME')}
                className="mt-12 px-6 py-2 border border-white/20 rounded-full text-xs uppercase tracking-widest hover:bg-white/5 transition-colors"
              >
                Return to Lab Hub
              </button>
            </motion.div>
          )}

          {appState === 'LOADING' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center gap-8"
            >
              <div className="relative w-24 h-24 flex items-center justify-center">
                <motion.div 
                  animate={{ rotate: 360 }} 
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 border border-dashed border-blue-400 rounded-full opacity-60"
                />
                <motion.div 
                  animate={{ rotate: -360 }} 
                  transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-2 border border-dotted border-emerald-500 rounded-full opacity-60"
                />
                <Activity className="w-8 h-8 accent-blue" />
              </div>
              <div className="stat-label flex flex-col items-center gap-2">
                <span>Preparing next question...</span>
              </div>
            </motion.div>
          )}

          {appState === 'TEST' && currentQuestion && (
            <motion.div
              key={`q-${currentQuestion.id}`}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="w-full flex justify-center py-12"
            >
              <div className="w-full">
                <div className="text-center mb-12">
                  <h3 className="text-xl font-light mb-2">{currentQuestion.instruction}</h3>
                </div>
                {renderCurrentQuestion()}
              </div>
            </motion.div>
          )}

          {appState === 'RESULTS' && results && (
             <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full max-w-6xl grid grid-cols-1 md:grid-cols-12 md:grid-rows-6 gap-5 items-stretch min-h-[600px] mb-12"
             >
               {/* IQ Area */}
               <div className="glass-panel relative overflow-hidden flex flex-col justify-center items-center text-center md:col-span-5 md:row-span-3 min-h-[250px]">
                 {cognitiveArt && (
                   <motion.div 
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 0.25 }}
                     transition={{ duration: 1.5 }}
                     className="absolute inset-0 z-0 bg-cover bg-center"
                     style={{ backgroundImage: `url(${cognitiveArt})` }}
                   />
                 )}
                 <div className="relative z-10 p-8 flex flex-col items-center justify-center w-full h-full bg-slate-950/40">
                   <p className="stat-label mb-2">Estimated IQ Score</p>
                   <div className="relative">
                     <h2 className="text-7xl lg:text-8xl font-black accent-blue tracking-tighter">
                       {results.iq}
                     </h2>
                     <div className="absolute -top-1 -right-4 px-1.5 py-0.5 bg-emerald-500/20 text-emerald-400 rounded text-[10px] font-bold">+1.2%</div>
                   </div>
                   <p className="text-xs opacity-50 mt-2">Global Percentile: {results.iq > 100 ? Math.min(99, Math.round(50 + ((results.iq - 100) / 15) * 34)) : '< 50'}th</p>
                   {results.totalScore !== undefined && (
                     <p className="text-sm font-bold mt-4 text-white bg-white/10 px-4 py-1 rounded-full border border-white/10">
                       Total Score: <span className="text-blue-400">{results.totalScore}</span> pts
                     </p>
                   )}
                 </div>
               </div>

               {/* Cognitive Radar Area */}
               <div className="glass-panel p-6 flex flex-col items-center justify-center md:col-span-7 md:row-span-4 min-h-[350px]">
                 <span className="stat-label mb-4 text-center block">Cognitive Distribution Radar</span>
                 <CognitiveProfileChart data={results.radar} />
               </div>

               {/* AI Insight Area */}
               <div className="glass-panel p-6 flex flex-col justify-between bg-gradient-to-br from-blue-600/10 to-transparent md:col-span-5 md:row-span-3">
                 <div className="flex justify-between items-start mb-4">
                   <div className="space-y-1">
                     <p className="stat-label text-blue-400">AI Cognitive Insight</p>
                     <p className="text-sm italic leading-relaxed opacity-80 pt-2">
                       "{insight}"
                     </p>
                   </div>
                   <div className="w-10 h-10 border border-white/10 rounded-full flex items-center justify-center bg-white/5 opacity-80 shrink-0 ml-4">
                     <BrainCircuit className="w-5 h-5 text-blue-400" />
                   </div>
                 </div>
                 <div className="flex gap-4 mt-auto pt-4">
                    <motion.button 
                      onClick={() => setAppState('HOME')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 bg-white text-slate-900 font-bold py-3 rounded text-xs uppercase tracking-widest hover:bg-slate-200"
                    >
                      Retake Test
                    </motion.button>
                    <motion.button 
                      onClick={handleShare}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="px-6 border border-white/20 hover:bg-white/5 rounded text-xs uppercase font-bold tracking-widest flex items-center gap-2"
                    >
                      <Share2 className="w-4 h-4" /> {shareText}
                    </motion.button>
                 </div>
               </div>

               {/* Cognitive Breakdown Area */}
               <div className="glass-panel p-6 flex flex-col md:col-span-7 md:row-span-2 overflow-y-auto custom-scrollbar">
                 <p className="stat-label mb-4 text-emerald-400">Profile Breakdown</p>
                 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                   <div className="space-y-1">
                     <span className="text-xs font-bold text-white">Visual Pattern</span>
                     <p className="text-[10px] text-slate-400 leading-relaxed">Assesses spatial reasoning and ability to identify abstract geometric relationships.</p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs font-bold text-white">Logical Reasoning</span>
                     <p className="text-[10px] text-slate-400 leading-relaxed">Measures deductive capacity and syllogistic problem-solving without prior knowledge.</p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs font-bold text-white">Working Memory</span>
                     <p className="text-[10px] text-slate-400 leading-relaxed">Evaluates short-term recall and continuous information retention under pressure.</p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs font-bold text-white">Numerical Extrapolation</span>
                     <p className="text-[10px] text-slate-400 leading-relaxed">Evaluates mathematical sequence detection and quantitative extrapolation.</p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs font-bold text-white">Auditory Processing</span>
                     <p className="text-[10px] text-slate-400 leading-relaxed">Tests pitch differentiation and auditory sequence recognition memory.</p>
                   </div>
                   <div className="space-y-1">
                     <span className="text-xs font-bold text-white">Processing Speed</span>
                     <p className="text-[10px] text-slate-400 leading-relaxed">Measures rapid decision making and cognitive reaction time to stimuli.</p>
                   </div>
                 </div>
               </div>
             </motion.div>
          )}

          {appState === 'SUDOKU' && <SudokuGame onBack={() => setAppState('GAMES')} />}
          {appState === 'REFLEX' && <ReflexGame onBack={() => setAppState('GAMES')} />}
          {appState === 'SPATIAL' && <SpatialGame onBack={() => setAppState('GAMES')} />}
          {appState === 'CHESS' && <ChessGame onBack={() => setAppState('GAMES')} />}

        </AnimatePresence>
      </main>
    </div>
  );
}

