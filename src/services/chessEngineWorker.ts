import { Chess, Move } from 'chess.js';

// Piece values
const pieceValues = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 900,
  k: 20000
};

// PSTs (Piece-Square Tables) for positional evaluation
const pawnEvalWhite = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [50, 50, 50, 50, 50, 50, 50, 50],
  [10, 10, 20, 30, 30, 20, 10, 10],
  [ 5,  5, 10, 25, 25, 10,  5,  5],
  [ 0,  0,  0, 20, 20,  0,  0,  0],
  [ 5, -5,-10,  0,  0,-10, -5,  5],
  [ 5, 10, 10,-20,-20, 10, 10,  5],
  [ 0,  0,  0,  0,  0,  0,  0,  0]
];
const pawnEvalBlack = pawnEvalWhite.slice().reverse();

const knightEval = [
  [-50,-40,-30,-30,-30,-30,-40,-50],
  [-40,-20,  0,  0,  0,  0,-20,-40],
  [-30,  0, 10, 15, 15, 10,  0,-30],
  [-30,  5, 15, 20, 20, 15,  5,-30],
  [-30,  0, 15, 20, 20, 15,  0,-30],
  [-30,  5, 10, 15, 15, 10,  5,-30],
  [-40,-20,  0,  5,  5,  0,-20,-40],
  [-50,-40,-30,-30,-30,-30,-40,-50]
];

const bishopEvalWhite = [
  [-20,-10,-10,-10,-10,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5, 10, 10,  5,  0,-10],
  [-10,  5,  5, 10, 10,  5,  5,-10],
  [-10,  0, 10, 10, 10, 10,  0,-10],
  [-10, 10, 10, 10, 10, 10, 10,-10],
  [-10,  5,  0,  0,  0,  0,  5,-10],
  [-20,-10,-10,-10,-10,-10,-10,-20]
];
const bishopEvalBlack = bishopEvalWhite.slice().reverse();

const rookEvalWhite = [
  [ 0,  0,  0,  0,  0,  0,  0,  0],
  [ 5, 10, 10, 10, 10, 10, 10,  5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [-5,  0,  0,  0,  0,  0,  0, -5],
  [ 0,  0,  0,  5,  5,  0,  0,  0]
];
const rookEvalBlack = rookEvalWhite.slice().reverse();

const evalQu = [
  [-20,-10,-10, -5, -5,-10,-10,-20],
  [-10,  0,  0,  0,  0,  0,  0,-10],
  [-10,  0,  5,  5,  5,  5,  0,-10],
  [ -5,  0,  5,  5,  5,  5,  0, -5],
  [  0,  0,  5,  5,  5,  5,  0, -5],
  [-10,  5,  5,  5,  5,  5,  0,-10],
  [-10,  0,  5,  0,  0,  0,  0,-10],
  [-20,-10,-10, -5, -5,-10,-10,-20]
];

const kingEvalWhite = [
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-30,-40,-40,-50,-50,-40,-40,-30],
  [-20,-30,-30,-40,-40,-30,-30,-20],
  [-10,-20,-20,-20,-20,-20,-20,-10],
  [ 20, 20,  0,  0,  0,  0, 20, 20],
  [ 20, 30, 10,  0,  0, 10, 30, 20]
];
const kingEvalBlack = kingEvalWhite.slice().reverse();

function evaluateBoard(game: Chess): number {
  let totalEvaluation = 0;
  const board = game.board();
  for (let i = 0; i < 8; i++) {
    for (let j = 0; j < 8; j++) {
      totalEvaluation += getPieceValue(board[i][j], i, j);
    }
  }
  return totalEvaluation;
}

function getPieceValue(piece: any, x: number, y: number): number {
  if (piece === null) return 0;
  
  let val = pieceValues[piece.type as keyof typeof pieceValues];
  
  if (piece.type === 'p') {
    val += (piece.color === 'w' ? pawnEvalWhite[x][y] : pawnEvalBlack[x][y]);
  } else if (piece.type === 'n') {
    val += knightEval[x][y];
  } else if (piece.type === 'b') {
    val += (piece.color === 'w' ? bishopEvalWhite[x][y] : bishopEvalBlack[x][y]);
  } else if (piece.type === 'r') {
    val += (piece.color === 'w' ? rookEvalWhite[x][y] : rookEvalBlack[x][y]);
  } else if (piece.type === 'q') {
    val += evalQu[x][y];
  } else if (piece.type === 'k') {
    val += (piece.color === 'w' ? kingEvalWhite[x][y] : kingEvalBlack[x][y]);
  }
  
  return piece.color === 'w' ? val : -val;
}

function minimax(game: Chess, depth: number, alpha: number, beta: number, isMaximizingPlayer: boolean): number {
  if (depth === 0 || game.isGameOver()) {
    return evaluateBoard(game);
  }

  const moves = game.moves();
  
  if (isMaximizingPlayer) {
    let bestVal = -Infinity;
    for (const move of moves) {
      game.move(move);
      bestVal = Math.max(bestVal, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
      game.undo();
      alpha = Math.max(alpha, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  } else {
    let bestVal = Infinity;
    for (const move of moves) {
      game.move(move);
      bestVal = Math.min(bestVal, minimax(game, depth - 1, alpha, beta, !isMaximizingPlayer));
      game.undo();
      beta = Math.min(beta, bestVal);
      if (beta <= alpha) break;
    }
    return bestVal;
  }
}

function getBestMove(game: Chess, depth: number): string | null {
  const moves = game.moves();
  if (moves.length === 0) return null;

  // Ordering captures first speeds up alpha beta
  moves.sort((a, b) => {
     if (a.includes('x') && !b.includes('x')) return -1;
     if (b.includes('x') && !a.includes('x')) return 1;
     return 0;
  });

  let bestMove = null;
  const isMaximizingPlayer = game.turn() === 'w';

  if (isMaximizingPlayer) {
    let bestVal = -Infinity;
    for (const move of moves) {
      game.move(move);
      const moveVal = minimax(game, depth - 1, -Infinity, Infinity, false);
      game.undo();
      if (moveVal > bestVal) {
        bestVal = moveVal;
        bestMove = move;
      }
    }
  } else {
    let bestVal = Infinity;
    for (const move of moves) {
      game.move(move);
      const moveVal = minimax(game, depth - 1, -Infinity, Infinity, true);
      game.undo();
      if (moveVal < bestVal) {
        bestVal = moveVal;
        bestMove = move;
      }
    }
  }

  return bestMove || moves[Math.floor(Math.random() * moves.length)];
}

self.onmessage = function(e) {
  const { fen, depth, difficulty } = e.data;
  
  const game = new Chess(fen);
  
  // Easy: 400 ELO (Depth 1 + random errors)
  // Medium: 1000 ELO (Depth 2)
  // Hard: 1900 ELO (Depth 3)
  // Expert: 2500 ELO (Depth 4)
  
  let selectedMove = null;

  if (difficulty === 'EASY') {
     // Very high chance of blunder, Depth 1
     if (Math.random() > 0.4) {
         selectedMove = getBestMove(game, 1);
     } else {
         const m = game.moves();
         selectedMove = m[Math.floor(Math.random() * m.length)];
     }
  } else if (difficulty === 'MEDIUM') {
     selectedMove = getBestMove(game, 2);
  } else if (difficulty === 'HARD') {
     selectedMove = getBestMove(game, 3);
  } else if (difficulty === 'EXPERT') {
     selectedMove = getBestMove(game, 4); // Depth 4 is computationally heavy in JS without wasm! Max out here to avoid freezing.
  }

  if (!selectedMove) {
      const m = game.moves();
      selectedMove = m[Math.floor(Math.random() * m.length)];
  }

  self.postMessage({ bestMove: selectedMove });
};
