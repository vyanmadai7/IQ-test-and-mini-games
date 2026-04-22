import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, RefreshCw, Trophy, Loader2 } from 'lucide-react';
import { Chess } from 'chess.js';
import ChessWorker from '../services/chessEngineWorker?worker';

type ChessDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export function ChessGame({ onBack }: { onBack: () => void }) {
  const savedState = useMemo(() => {
    try {
      const saved = localStorage.getItem('chess_save');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  }, []);

  const [difficulty, setDifficulty] = useState<ChessDifficulty>(savedState?.difficulty || 'MEDIUM');
  const [playerColor, setPlayerColor] = useState<'w' | 'b'>(savedState?.playerColor || 'w');
  const [game, setGame] = useState(() => {
    if (savedState?.fen) {
      try {
        return new Chess(savedState.fen);
      } catch (err) {
        return new Chess();
      }
    }
    return new Chess();
  });
  const [boardWidth, setBoardWidth] = useState(400); // Desktop default
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [validMoves, setValidMoves] = useState<string[]>([]);
  const [gameStatus, setGameStatus] = useState<'PLAYING' | 'CHECKMATE_WIN' | 'CHECKMATE_LOSE' | 'DRAW'>(savedState?.gameStatus || 'PLAYING');
  const [isBotThinking, setIsBotThinking] = useState(false);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    localStorage.setItem('chess_save', JSON.stringify({
      difficulty,
      playerColor,
      fen: game.fen(),
      gameStatus
    }));
  }, [difficulty, playerColor, game.fen(), gameStatus]);

  useEffect(() => {
    workerRef.current = new ChessWorker();
    
    workerRef.current.onmessage = (e) => {
       const { bestMove } = e.data;
       if (bestMove) {
          setGame((prevGame) => {
             const gameCopy = new Chess(prevGame.fen());
             try {
                gameCopy.move(bestMove);
             } catch (err) {
                console.error(err);
             }
             updateGameStatus(gameCopy);
             setIsBotThinking(false);
             return gameCopy;
          });
       }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  useEffect(() => {
    const handleResize = () => {
      const ww = window.innerWidth;
      if (ww < 640) setBoardWidth(ww - 32); // Slightly less padding for mobile
      else setBoardWidth(480);
    };
    handleResize(); // Initial setup
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const botColor = playerColor === 'w' ? 'b' : 'w';

  const requestBotMove = useCallback(() => {
    if (game.isGameOver()) return;
    setIsBotThinking(true);
    
    // Slight delay so UI doesn't look completely robotic
    setTimeout(() => {
      workerRef.current?.postMessage({
        fen: game.fen(),
        depth: difficulty === 'EASY' ? 1 : difficulty === 'MEDIUM' ? 2 : difficulty === 'HARD' ? 3 : 4,
        difficulty
      });
    }, 400);
  }, [game, difficulty]);

  const updateGameStatus = (currentGame: Chess) => {
     if (currentGame.isCheckmate()) {
        setGameStatus(currentGame.turn() === playerColor ? 'CHECKMATE_LOSE' : 'CHECKMATE_WIN');
     } else if (currentGame.isDraw() || currentGame.isStalemate() || currentGame.isThreefoldRepetition() || currentGame.isInsufficientMaterial()) {
        setGameStatus('DRAW');
     } else {
        setGameStatus('PLAYING');
     }
  };

  useEffect(() => {
    if (game.turn() === botColor && gameStatus === 'PLAYING') {
      requestBotMove();
    }
  }, [game, gameStatus, requestBotMove, botColor]);

  const onSquareClick = (square: string) => {
    if (gameStatus !== 'PLAYING' || game.turn() === botColor || isBotThinking) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    const moves = game.moves({ square, verbose: true }) as any[];
    
    if (selectedSquare === square) {
      setSelectedSquare(null);
      setValidMoves([]);
      return;
    }

    if (validMoves.includes(square) && selectedSquare) {
      try {
         const gameCopy = new Chess(game.fen());
         const moveMap = game.moves({ verbose: true }) as any[];
         const specificMove = moveMap.find(m => m.from === selectedSquare && m.to === square);
         
         if (specificMove) {
             gameCopy.move({
               from: selectedSquare,
               to: square,
               promotion: 'q', // Always promote to Queen for ease
             });
             setGame(gameCopy);
             updateGameStatus(gameCopy);
         }
         
         setSelectedSquare(null);
         setValidMoves([]);
      } catch (e) {
         console.error(e);
         setSelectedSquare(null);
         setValidMoves([]);
      }
    } else {
      // Pick piece
      const piece = game.get(square as any);
      if (piece && piece.color === playerColor) {
        setSelectedSquare(square);
        setValidMoves(moves.map(m => m.to));
      } else {
        setSelectedSquare(null);
        setValidMoves([]);
      }
    }
  };

  const getUnicodePiece = (type: string, color: string) => {
     const pieces: any = {
         'p': { w: '♙', b: '♟︎' },
         'n': { w: '♘', b: '♞' },
         'b': { w: '♗', b: '♝' },
         'r': { w: '♖', b: '♜' },
         'q': { w: '♕', b: '♛' },
         'k': { w: '♔', b: '♚' }
     };
     return pieces[type]?.[color] || '';
  };

  const isFlipped = playerColor === 'b';
  let initialBoardArr = game.board(); // 8x8 array
  const boardArr = isFlipped ? [...initialBoardArr].reverse().map(row => [...row].reverse()) : initialBoardArr;
  
  const squareSize = boardWidth / 8;

  const handleStartGame = (color: 'w' | 'b' | 'random') => {
      const c = color === 'random' ? (Math.random() > 0.5 ? 'w' : 'b') : color;
      setPlayerColor(c);
      setGame(new Chess());
      setGameStatus('PLAYING');
      setSelectedSquare(null);
      setValidMoves([]);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="max-w-4xl w-full flex flex-col items-center pb-12"
    >
      <div className="w-full flex justify-between items-center mb-6">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors uppercase tracking-widest text-xs font-bold"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Hub
        </button>
        <div className="flex bg-white/5 rounded-lg border border-white/10 p-1">
          {(['EASY', 'MEDIUM', 'HARD', 'EXPERT'] as ChessDifficulty[]).map((level) => (
            <button
              key={level}
              onClick={() => {
                setDifficulty(level);
                setGame(new Chess());
                setGameStatus('PLAYING');
                setSelectedSquare(null);
                setValidMoves([]);
              }}
              className={`px-3 py-1.5 text-[10px] sm:text-xs uppercase tracking-widest font-bold rounded transition-colors ${
                difficulty === level 
                  ? 'bg-yellow-500/20 text-yellow-400' 
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="text-center mb-6 relative w-full flex flex-col items-center">
        <h2 className="text-4xl font-light tracking-tight mb-2">Tactical Chess</h2>
        <p className="text-slate-400 text-sm mb-4">
          {difficulty === 'EASY' && "Playing 400 ELO Bot"}
          {difficulty === 'MEDIUM' && "Playing 1000 ELO Bot"}
          {difficulty === 'HARD' && "Playing 1900 ELO Bot"}
          {difficulty === 'EXPERT' && "Playing 2500 ELO Bot"}
        </p>
        
        <div className="flex gap-2 mb-4 bg-white/5 border border-white/10 p-1 rounded-lg backdrop-blur-md">
            <button 
                onClick={() => handleStartGame('w')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${playerColor === 'w' ? 'bg-white text-slate-900' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
                Play White
            </button>
            <button 
                onClick={() => handleStartGame('b')}
                className={`px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors ${playerColor === 'b' ? 'bg-slate-900 text-white border border-white/20' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            >
                Play Black
            </button>
            <button 
                onClick={() => handleStartGame('random')}
                className="px-4 py-2 text-xs font-bold uppercase tracking-widest rounded transition-colors text-slate-400 hover:bg-white/10 hover:text-white"
            >
                Random
            </button>
        </div>

        {isBotThinking && (
           <div className="absolute top-1/2 -right-8 sm:-right-12 -translate-y-1/2 flex items-center gap-2 text-yellow-500">
             <Loader2 className="w-5 h-5 animate-spin" />
             <span className="text-xs font-bold uppercase tracking-widest hidden sm:inline">Thinking</span>
           </div>
        )}
      </div>

      <div className="relative glass-panel p-2 md:p-4 rounded-xl shadow-[0_4px_30px_rgba(0,0,0,0.3)]">
         <div 
           className="grid border-[0.5px] border-white/20 rounded-md overflow-hidden" 
           style={{ 
             gridTemplateColumns: `repeat(8, ${squareSize}px)`, 
             gridTemplateRows: `repeat(8, ${squareSize}px)` 
           }}
         >
           {boardArr.map((row, r) => 
               row.map((cell, c) => {
                 const isLight = (r + c) % 2 === 0;
                 // Calculate true rank/file based on whether the board is flipped
                 const trueRow = isFlipped ? 7 - r : r;
                 const trueCol = isFlipped ? 7 - c : c;

                 const squareRank = 8 - trueRow;
                 const squareFile = String.fromCharCode(97 + trueCol);
                 const square = `${squareFile}${squareRank}`;
                 
                 const isSelected = selectedSquare === square;
                 const isValidMove = validMoves.includes(square);
                 const inCheck = game.inCheck() && cell?.type === 'k' && cell?.color === game.turn();

                 let bgClass = isLight ? 'bg-slate-300' : 'bg-slate-500';
                 if (isSelected) bgClass = 'bg-emerald-400/80';
                 else if (isValidMove && cell) bgClass = 'bg-red-400/80'; // Capture
                 else if (isValidMove) bgClass = isLight ? 'bg-emerald-300/60' : 'bg-emerald-500/60';
                 else if (inCheck) bgClass = 'bg-red-500';

                 return (
                   <div 
                     key={square}
                     onClick={() => onSquareClick(square)}
                     className={`flex items-center justify-center cursor-pointer transition-colors relative ${bgClass}`}
                     style={{ width: squareSize, height: squareSize }}
                   >
                       {cell && (
                           <span 
                             className="select-none leading-none drop-shadow-md pb-1"
                             style={{ 
                               fontSize: `${squareSize * 0.75}px`,
                               color: cell.color === 'w' ? '#ffffff' : '#000000',
                             }}
                           >
                              {getUnicodePiece(cell.type, cell.color)}
                           </span>
                       )}
                       {isValidMove && !cell && (
                           <div className="w-1/4 h-1/4 bg-black/20 rounded-full" />
                       )}
                   </div>
                 );
               })
           )}
         </div>

         {gameStatus !== 'PLAYING' && (
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm"
            >
               <Trophy className={`w-20 h-20 mb-4 ${gameStatus === 'CHECKMATE_WIN' ? 'text-yellow-400' : 'text-slate-500'}`} />
               <h3 className="text-4xl font-bold tracking-tight text-white mb-2">
                  {gameStatus === 'CHECKMATE_WIN' && 'You Win!'}
                  {gameStatus === 'CHECKMATE_LOSE' && 'Checkmate'}
                  {gameStatus === 'DRAW' && 'Draw'}
               </h3>
               <button 
                 onClick={() => {
                   setGame(new Chess());
                   setGameStatus('PLAYING');
                 }}
                 className="mt-6 px-6 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded hover:bg-slate-200"
               >
                 Play Again
               </button>
            </motion.div>
         )}
      </div>

      <div className="mt-8">
        <button
          onClick={() => {
             setGame(new Chess());
             setGameStatus('PLAYING');
             setSelectedSquare(null);
             setValidMoves([]);
          }}
          className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 rounded border border-white/10 text-slate-300 text-xs uppercase tracking-widest font-bold transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Restart Game
        </button>
      </div>
    </motion.div>
  );
}
