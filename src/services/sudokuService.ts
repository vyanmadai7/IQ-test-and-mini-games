export type SudokuDifficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export function generateSudoku(difficulty: SudokuDifficulty) {
  const board = Array(9).fill(null).map(() => Array(9).fill(0));

  const isValid = (b: number[][], row: number, col: number, num: number) => {
    for (let i = 0; i < 9; i++) {
      if (b[row][i] === num) return false;
      if (b[i][col] === num) return false;
      const boxRow = 3 * Math.floor(row / 3) + Math.floor(i / 3);
      const boxCol = 3 * Math.floor(col / 3) + (i % 3);
      if (b[boxRow][boxCol] === num) return false;
    }
    return true;
  };

  const fill = (b: number[][]) => {
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (b[i][j] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(b, i, j, num)) {
              b[i][j] = num;
              if (fill(b)) return true;
              b[i][j] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  };

  // Generate a fully valid solved board
  fill(board);
  const solution = board.map(row => [...row]);

  // Determine how many cells to remove based on difficulty
  let removeCount = 30; // EASY
  if (difficulty === 'MEDIUM') removeCount = 45;
  if (difficulty === 'HARD') removeCount = 55;
  if (difficulty === 'EXPERT') removeCount = 64;

  const puzzle = solution.map(row => [...row]);
  let removed = 0;
  
  // Randomly remove cells to create the puzzle
  while (removed < removeCount) {
    const r = Math.floor(Math.random() * 9);
    const c = Math.floor(Math.random() * 9);
    if (puzzle[r][c] !== 0) {
      puzzle[r][c] = 0;
      removed++;
    }
  }

  return { puzzle, solution };
}

export function checkConflicts(board: number[][]) {
  const conflicts = Array(9).fill(null).map(() => Array(9).fill(false));
  let hasConflict = false;

  const markConflict = (r1: number, c1: number, r2: number, c2: number) => {
    conflicts[r1][c1] = true;
    conflicts[r2][c2] = true;
    hasConflict = true;
  };

  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const num = board[i][j];
      if (num === 0) continue;

      // Check row
      for (let c = j + 1; c < 9; c++) {
        if (board[i][c] === num) markConflict(i, j, i, c);
      }
      // Check column
      for (let r = i + 1; r < 9; r++) {
        if (board[r][j] === num) markConflict(i, j, r, j);
      }
      // Check box
      const boxStartRow = Math.floor(i / 3) * 3;
      const boxStartCol = Math.floor(j / 3) * 3;
      for (let r = boxStartRow; r < boxStartRow + 3; r++) {
        for (let c = boxStartCol; c < boxStartCol + 3; c++) {
          if ((r !== i || c !== j) && board[r][c] === num) {
            markConflict(i, j, r, c);
          }
        }
      }
    }
  }

  return { conflicts, hasConflict };
}
