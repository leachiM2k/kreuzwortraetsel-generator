import { CrosswordGrid } from '../models/CrosswordGrid';
import { Direction } from '../models/Direction';
import { PlacedWord, getEndRow, getEndCol } from '../models/PlacedWord';
import { WordEntry, normalizeWordEntry } from '../models/WordEntry';

const MAX_GRID_SIZE = 50;

interface PlacementOption {
  row: number;
  col: number;
  direction: Direction;
  score: number;
}

interface GridState {
  grid: CrosswordGrid;
  placedCount: number;
  unplacedWords: WordEntry[];
}

interface BeamState {
  grid: CrosswordGrid;
  placed: Set<number>;
  score: number;
}

export class WordPlacementService {
  // ==================== MAIN ENTRY POINT ====================

  generateLayout(entries: WordEntry[]): CrosswordGrid {
    if (!entries || entries.length === 0) {
      throw new Error('No words provided');
    }

    const normalized = entries.map(normalizeWordEntry);
    const target = normalized.length;

    let bestGrid: CrosswordGrid | null = null;
    let bestCount = 0;
    let bestStrategy = '';

    const updateBest = (result: GridState, name: string) => {
      if (result.placedCount > bestCount) {
        bestGrid = result.grid;
        bestCount = result.placedCount;
        bestStrategy = name;
      }
    };

    // Phase 1: Fast greedy strategies
    for (const strategy of ['longest-first', 'most-connections', 'balanced'] as const) {
      try {
        updateBest(this.tryGreedy(normalized, strategy), `greedy-${strategy}`);
        if (bestCount === target) break;
      } catch {
        // Strategy failed, continue
      }
    }

    // Phase 2: Advanced strategies (only if greedy didn't place all words)
    if (bestCount < target) {
      // Monte Carlo random restarts (fast, good at finding orderings)
      try {
        updateBest(this.tryRandomRestarts(normalized, bestCount), 'random-restarts');
      } catch {
        // Failed, continue
      }

      // Backtracking DFS (thorough, explores placement positions)
      if (bestCount < target) {
        try {
          updateBest(this.tryBacktracking(normalized, bestCount), 'backtracking');
        } catch {
          // Failed, continue
        }
      }

      // Beam search (parallel exploration of multiple partial solutions)
      if (bestCount < target) {
        try {
          updateBest(this.tryBeamSearch(normalized, bestCount), 'beam-search');
        } catch {
          // Failed, continue
        }
      }
    }

    if (!bestGrid || bestCount < 3) {
      throw new Error('Could not place enough words to create a crossword');
    }

    console.log(
      `Best result: placed ${bestCount}/${target} words using ${bestStrategy}`
    );
    return bestGrid;
  }

  // ==================== GREEDY STRATEGY ====================

  private tryGreedy(
    entries: WordEntry[],
    strategy: 'longest-first' | 'most-connections' | 'balanced'
  ): GridState {
    let sortedEntries: WordEntry[];

    switch (strategy) {
      case 'longest-first':
        sortedEntries = entries
          .slice()
          .sort((a, b) => b.answer.length - a.answer.length);
        break;
      case 'most-connections':
        sortedEntries = this.sortByConnectionPotential(entries);
        break;
      case 'balanced':
        sortedEntries = entries
          .slice()
          .sort((a, b) => {
            const scoreA = a.answer.length + this.getUniqueChars(a.answer).size * 2;
            const scoreB = b.answer.length + this.getUniqueChars(b.answer).size * 2;
            return scoreB - scoreA;
          });
        break;
    }

    const gridSize = this.calculateGridSize(entries);
    const grid = new CrosswordGrid(gridSize, gridSize);

    // Place first word horizontally at center
    const firstEntry = sortedEntries[0];
    this.placeFirstWord(grid, firstEntry, Direction.HORIZONTAL, gridSize);

    // Try to place remaining words
    const unplaced: WordEntry[] = [];
    for (let i = 1; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      if (!this.placeWordGreedy(grid, entry, sortedEntries, i)) {
        unplaced.push(entry);
      }
    }

    // Second pass for unplaced words
    const stillUnplaced: WordEntry[] = [];
    for (const entry of unplaced) {
      if (!this.placeWordGreedy(grid, entry, sortedEntries, sortedEntries.length)) {
        stillUnplaced.push(entry);
      }
    }

    this.optimizeGrid(grid);
    this.assignNumbers(grid);

    return {
      grid,
      placedCount: grid.placedWords.length,
      unplacedWords: stillUnplaced,
    };
  }

  // ==================== BACKTRACKING DFS ====================

  private tryBacktracking(entries: WordEntry[], currentBest: number): GridState {
    const deadline = Date.now() + 5000;
    let bestGrid: CrosswordGrid | null = null;
    let bestCount = currentBest;

    const gridSize = this.calculateGridSize(entries);

    // Sort entries by connection potential for better pruning
    const sortedEntries = this.sortByConnectionPotential(entries);

    // Try different first words and directions
    for (let firstIdx = 0; firstIdx < sortedEntries.length; firstIdx++) {
      for (const firstDir of [Direction.HORIZONTAL, Direction.VERTICAL]) {
        if (Date.now() > deadline) break;

        const grid = new CrosswordGrid(gridSize, gridSize);
        this.placeFirstWord(grid, sortedEntries[firstIdx], firstDir, gridSize);

        const remaining = sortedEntries.filter((_, i) => i !== firstIdx);

        const result = this.backtrackDFS(grid, remaining, bestCount, deadline);

        if (result && result.placedWords.length > bestCount) {
          bestGrid = result;
          bestCount = result.placedWords.length;
          if (bestCount === entries.length) break;
        }
      }
      if (bestCount === entries.length || Date.now() > deadline) break;
    }

    if (!bestGrid) {
      throw new Error('Backtracking found no solution');
    }

    this.optimizeGrid(bestGrid);
    this.assignNumbers(bestGrid);

    return {
      grid: bestGrid,
      placedCount: bestCount,
      unplacedWords: [],
    };
  }

  private backtrackDFS(
    grid: CrosswordGrid,
    remaining: WordEntry[],
    bestSoFar: number,
    deadline: number
  ): CrosswordGrid | null {
    if (Date.now() > deadline) return null;

    // Pruning: can't beat current best even if all remaining words are placed
    if (grid.placedWords.length + remaining.length <= bestSoFar) return null;

    if (remaining.length === 0) return grid.clone();

    // Compute valid options for each remaining word
    const wordOptions: { entry: WordEntry; options: PlacementOption[] }[] = [];
    for (const entry of remaining) {
      const allOptions = this.findAllPlacementOptions(grid, entry.answer);
      const validOptions = allOptions.filter(opt =>
        this.canPlaceWord(grid, entry.answer, opt)
      );
      wordOptions.push({ entry, options: validOptions });
    }

    // MRV heuristic: pick word with fewest valid options (but > 0)
    const placeable = wordOptions.filter(w => w.options.length > 0);

    if (placeable.length === 0) {
      // No more words can be placed
      if (grid.placedWords.length > bestSoFar) {
        return grid.clone();
      }
      return null;
    }

    placeable.sort((a, b) => a.options.length - b.options.length);

    const chosen = placeable[0];
    const newRemaining = remaining.filter(e => e !== chosen.entry);

    // Score and sort placement options
    for (const opt of chosen.options) {
      opt.score = this.calculatePlacementScore(
        grid, chosen.entry.answer, opt, newRemaining, 0
      );
    }
    chosen.options.sort((a, b) => b.score - a.score);

    let bestResult: CrosswordGrid | null = null;
    let localBest = bestSoFar;

    // Try each placement option (limited branching factor)
    const maxTries = Math.min(chosen.options.length, 8);
    for (let i = 0; i < maxTries; i++) {
      if (Date.now() > deadline) break;

      const option = chosen.options[i];

      // Place word
      grid.addPlacedWord({
        word: chosen.entry.answer,
        clue: chosen.entry.clue,
        row: option.row,
        col: option.col,
        direction: option.direction,
        number: 0,
      });

      // Recurse
      const result = this.backtrackDFS(grid, newRemaining, localBest, deadline);

      if (result && result.placedWords.length > localBest) {
        bestResult = result;
        localBest = result.placedWords.length;
      }

      // Undo
      grid.removeLastPlacedWord();

      // Early exit if all remaining words were placed
      if (localBest === remaining.length + grid.placedWords.length) {
        return bestResult;
      }
    }

    // Try skipping this word (maybe placing others first enables better solutions)
    if (Date.now() <= deadline) {
      const skipResult = this.backtrackDFS(grid, newRemaining, localBest, deadline);
      if (skipResult && skipResult.placedWords.length > localBest) {
        bestResult = skipResult;
      }
    }

    return bestResult;
  }

  // ==================== BEAM SEARCH ====================

  private tryBeamSearch(entries: WordEntry[], currentBest: number): GridState {
    const beamWidth = 200;
    const gridSize = this.calculateGridSize(entries);

    // Initialize beam with different first word placements
    let beam: BeamState[] = [];

    for (let i = 0; i < entries.length; i++) {
      for (const dir of [Direction.HORIZONTAL, Direction.VERTICAL]) {
        const grid = new CrosswordGrid(gridSize, gridSize);
        this.placeFirstWord(grid, entries[i], dir, gridSize);
        beam.push({ grid, placed: new Set([i]), score: 1 });
      }
    }

    let bestState: BeamState | null = null;
    let bestCount = currentBest;

    // Iteratively expand beam
    for (let step = 0; step < entries.length - 1; step++) {
      const nextBeam: BeamState[] = [];

      for (const state of beam) {
        // Find unplaced words
        const unplaced: number[] = [];
        for (let i = 0; i < entries.length; i++) {
          if (!state.placed.has(i)) unplaced.push(i);
        }

        if (unplaced.length === 0) {
          if (state.placed.size > bestCount) {
            bestState = state;
            bestCount = state.placed.size;
          }
          nextBeam.push(state);
          continue;
        }

        let anyPlaced = false;

        // Try placing each unplaced word
        for (const wordIdx of unplaced) {
          const entry = entries[wordIdx];
          const options = this.findAllPlacementOptions(state.grid, entry.answer)
            .filter(opt => this.canPlaceWord(state.grid, entry.answer, opt));

          if (options.length === 0) continue;

          // Score and sort options
          for (const opt of options) {
            opt.score = this.calculatePlacementScoreSimple(
              state.grid, entry.answer, opt
            );
          }
          options.sort((a, b) => b.score - a.score);

          // Take top options per word
          const topK = Math.min(3, options.length);
          for (let k = 0; k < topK; k++) {
            const opt = options[k];
            const newGrid = state.grid.clone();
            newGrid.addPlacedWord({
              word: entry.answer,
              clue: entry.clue,
              row: opt.row,
              col: opt.col,
              direction: opt.direction,
              number: 0,
            });

            const newPlaced = new Set(state.placed);
            newPlaced.add(wordIdx);

            nextBeam.push({
              grid: newGrid,
              placed: newPlaced,
              score: newPlaced.size * 1000 + opt.score,
            });

            anyPlaced = true;
          }
        }

        // If no word could be placed, keep state as terminal
        if (!anyPlaced && state.placed.size > bestCount) {
          bestState = state;
          bestCount = state.placed.size;
        }
      }

      if (nextBeam.length === 0) break;

      // Prune to beam width
      nextBeam.sort((a, b) => b.score - a.score);
      beam = nextBeam.slice(0, beamWidth);

      // Check for perfect solution
      for (const state of beam) {
        if (state.placed.size === entries.length) {
          bestState = state;
          bestCount = entries.length;
          break;
        }
      }
      if (bestCount === entries.length) break;
    }

    // Check remaining beam for best
    for (const state of beam) {
      if (state.placed.size > bestCount) {
        bestState = state;
        bestCount = state.placed.size;
      }
    }

    if (!bestState || bestCount <= currentBest) {
      throw new Error('Beam search did not improve');
    }

    this.optimizeGrid(bestState.grid);
    this.assignNumbers(bestState.grid);

    return {
      grid: bestState.grid,
      placedCount: bestCount,
      unplacedWords: [],
    };
  }

  // ==================== RANDOM RESTARTS ====================

  private tryRandomRestarts(entries: WordEntry[], currentBest: number): GridState {
    const deadline = Date.now() + 3000;
    let bestGrid: CrosswordGrid | null = null;
    let bestCount = currentBest;
    let iterations = 0;

    while (Date.now() < deadline) {
      iterations++;

      const shuffled = this.shuffleArray(entries.slice());
      const firstDir = Math.random() < 0.5
        ? Direction.HORIZONTAL
        : Direction.VERTICAL;

      const gridSize = this.calculateGridSize(entries);
      const grid = new CrosswordGrid(gridSize, gridSize);
      this.placeFirstWord(grid, shuffled[0], firstDir, gridSize);

      // Greedy placement
      for (let i = 1; i < shuffled.length; i++) {
        this.placeWordGreedy(grid, shuffled[i], shuffled, i);
      }

      // Second pass for unplaced words
      const placedWords = new Set(grid.placedWords.map(w => w.word));
      const unplaced = shuffled.filter(e => !placedWords.has(e.answer));
      for (const entry of unplaced) {
        this.placeWordGreedy(grid, entry, shuffled, shuffled.length);
      }

      if (grid.placedWords.length > bestCount) {
        bestGrid = grid;
        bestCount = grid.placedWords.length;
        if (bestCount === entries.length) break;
      }
    }

    if (!bestGrid) {
      throw new Error('Random restarts found no improvement');
    }

    console.log(
      `[random-restarts] Best: ${bestCount}/${entries.length} in ${iterations} iterations`
    );

    this.optimizeGrid(bestGrid);
    this.assignNumbers(bestGrid);

    return {
      grid: bestGrid,
      placedCount: bestCount,
      unplacedWords: [],
    };
  }

  // ==================== SHARED HELPERS ====================

  private calculateGridSize(entries: WordEntry[]): number {
    const totalLength = entries.reduce((sum, e) => sum + e.answer.length, 0);
    const longestWord = Math.max(...entries.map(e => e.answer.length));
    return Math.min(
      MAX_GRID_SIZE,
      Math.max(longestWord + 4, Math.ceil(Math.sqrt(totalLength * 4)))
    );
  }

  private placeFirstWord(
    grid: CrosswordGrid,
    entry: WordEntry,
    direction: Direction,
    gridSize: number
  ): void {
    const word = entry.answer;
    let startRow: number, startCol: number;

    if (direction === Direction.HORIZONTAL) {
      startRow = Math.floor(gridSize / 2);
      startCol = Math.floor((gridSize - word.length) / 2);
    } else {
      startRow = Math.floor((gridSize - word.length) / 2);
      startCol = Math.floor(gridSize / 2);
    }

    grid.addPlacedWord({
      word,
      clue: entry.clue,
      row: startRow,
      col: startCol,
      direction,
      number: 1,
    });
  }

  private placeWordGreedy(
    grid: CrosswordGrid,
    entry: WordEntry,
    allEntries: WordEntry[],
    currentIndex: number
  ): boolean {
    const word = entry.answer;
    const options = this.findAllPlacementOptions(grid, word);

    if (options.length === 0) return false;

    // Score each option
    for (const option of options) {
      option.score = this.calculatePlacementScore(
        grid, word, option, allEntries, currentIndex
      );
    }

    options.sort((a, b) => b.score - a.score);

    const tryCount = Math.min(20, options.length);
    for (let i = 0; i < tryCount; i++) {
      const option = options[i];
      if (this.canPlaceWord(grid, word, option)) {
        grid.addPlacedWord({
          word,
          clue: entry.clue,
          row: option.row,
          col: option.col,
          direction: option.direction,
          number: 0,
        });
        return true;
      }
    }

    return false;
  }

  private sortByConnectionPotential(entries: WordEntry[]): WordEntry[] {
    const letterFreq = new Map<string, number>();
    for (const entry of entries) {
      for (const char of entry.answer) {
        letterFreq.set(char, (letterFreq.get(char) || 0) + 1);
      }
    }

    return entries.slice().sort((a, b) => {
      const scoreA = Array.from(a.answer).reduce(
        (sum, char) => sum + (letterFreq.get(char) || 0), 0
      );
      const scoreB = Array.from(b.answer).reduce(
        (sum, char) => sum + (letterFreq.get(char) || 0), 0
      );
      return scoreB - scoreA;
    });
  }

  private getUniqueChars(word: string): Set<string> {
    return new Set(Array.from(word));
  }

  private calculatePlacementScore(
    grid: CrosswordGrid,
    word: string,
    option: PlacementOption,
    remainingEntries: WordEntry[],
    currentIndex: number
  ): number {
    let score = 0;

    // Count intersections with existing words (most important)
    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
      const r = option.row + (option.direction === Direction.VERTICAL ? i : 0);
      const c = option.col + (option.direction === Direction.HORIZONTAL ? i : 0);
      if (grid.getCell(r, c) === word.charAt(i)) {
        intersections++;
      }
    }
    score += intersections * 10;

    // Bonus for central placement
    const centerRow = grid.height / 2;
    const centerCol = grid.width / 2;
    const distance = Math.abs(option.row - centerRow) + Math.abs(option.col - centerCol);
    score -= distance * 0.1;

    // Bonus for future connection opportunities
    const potentialConnections = this.countPotentialConnections(
      word, remainingEntries, currentIndex
    );
    score += potentialConnections * 2;

    return score;
  }

  private calculatePlacementScoreSimple(
    grid: CrosswordGrid,
    word: string,
    option: PlacementOption
  ): number {
    let score = 0;

    // Count intersections
    let intersections = 0;
    for (let i = 0; i < word.length; i++) {
      const r = option.row + (option.direction === Direction.VERTICAL ? i : 0);
      const c = option.col + (option.direction === Direction.HORIZONTAL ? i : 0);
      if (grid.getCell(r, c) === word.charAt(i)) {
        intersections++;
      }
    }
    score += intersections * 10;

    // Prefer central placement
    const centerRow = grid.height / 2;
    const centerCol = grid.width / 2;
    const distance = Math.abs(option.row - centerRow) + Math.abs(option.col - centerCol);
    score -= distance * 0.1;

    return score;
  }

  private countPotentialConnections(
    word: string,
    remainingEntries: WordEntry[],
    currentIndex: number
  ): number {
    let count = 0;
    for (let i = currentIndex + 1; i < remainingEntries.length; i++) {
      const remainingWord = remainingEntries[i].answer;
      for (const char of word) {
        if (remainingWord.includes(char)) {
          count++;
          break;
        }
      }
    }
    return count;
  }

  private findAllPlacementOptions(
    grid: CrosswordGrid,
    word: string
  ): PlacementOption[] {
    const options: PlacementOption[] = [];
    for (const placed of grid.placedWords) {
      options.push(...this.findIntersections(grid, word, placed));
    }
    return options;
  }

  private findIntersections(
    _grid: CrosswordGrid,
    newWord: string,
    existingWord: PlacedWord
  ): PlacementOption[] {
    const intersections: PlacementOption[] = [];
    const newDirection =
      existingWord.direction === Direction.HORIZONTAL
        ? Direction.VERTICAL
        : Direction.HORIZONTAL;

    for (let i = 0; i < newWord.length; i++) {
      const newChar = newWord.charAt(i);

      for (let j = 0; j < existingWord.word.length; j++) {
        const existingChar = existingWord.word.charAt(j);

        if (newChar === existingChar) {
          let newRow: number, newCol: number;

          if (newDirection === Direction.HORIZONTAL) {
            newRow =
              existingWord.row +
              (existingWord.direction === Direction.VERTICAL ? j : 0);
            newCol =
              existingWord.col +
              (existingWord.direction === Direction.HORIZONTAL ? j : 0) -
              i;
          } else {
            newRow =
              existingWord.row +
              (existingWord.direction === Direction.VERTICAL ? j : 0) -
              i;
            newCol =
              existingWord.col +
              (existingWord.direction === Direction.HORIZONTAL ? j : 0);
          }

          intersections.push({
            row: newRow,
            col: newCol,
            direction: newDirection,
            score: 1,
          });
        }
      }
    }

    return intersections;
  }

  private canPlaceWord(
    grid: CrosswordGrid,
    word: string,
    option: PlacementOption
  ): boolean {
    const endRow =
      option.row + (option.direction === Direction.VERTICAL ? word.length - 1 : 0);
    const endCol =
      option.col + (option.direction === Direction.HORIZONTAL ? word.length - 1 : 0);

    if (
      !grid.isInBounds(option.row, option.col) ||
      !grid.isInBounds(endRow, endCol)
    ) {
      return false;
    }

    let intersectionCount = 0;

    for (let i = 0; i < word.length; i++) {
      const r = option.row + (option.direction === Direction.VERTICAL ? i : 0);
      const c = option.col + (option.direction === Direction.HORIZONTAL ? i : 0);

      const existing = grid.getCell(r, c);
      const newChar = word.charAt(i);

      if (existing !== ' ') {
        if (existing !== newChar) {
          return false;
        }
        intersectionCount++;
      } else {
        // Check perpendicular cells for adjacent parallel words
        if (option.direction === Direction.HORIZONTAL) {
          if (!grid.isEmpty(r - 1, c) || !grid.isEmpty(r + 1, c)) {
            return false;
          }
        } else {
          if (!grid.isEmpty(r, c - 1) || !grid.isEmpty(r, c + 1)) {
            return false;
          }
        }
      }
    }

    if (intersectionCount === 0) {
      return false;
    }

    // Check cells before and after the word
    if (option.direction === Direction.HORIZONTAL) {
      if (
        !grid.isEmpty(option.row, option.col - 1) ||
        !grid.isEmpty(option.row, endCol + 1)
      ) {
        return false;
      }
    } else {
      if (
        !grid.isEmpty(option.row - 1, option.col) ||
        !grid.isEmpty(endRow + 1, option.col)
      ) {
        return false;
      }
    }

    return true;
  }

  private optimizeGrid(grid: CrosswordGrid): void {
    if (grid.placedWords.length === 0) return;

    let minRow = Number.MAX_SAFE_INTEGER;
    let maxRow = Number.MIN_SAFE_INTEGER;
    let minCol = Number.MAX_SAFE_INTEGER;
    let maxCol = Number.MIN_SAFE_INTEGER;

    for (const word of grid.placedWords) {
      minRow = Math.min(minRow, word.row);
      maxRow = Math.max(maxRow, getEndRow(word));
      minCol = Math.min(minCol, word.col);
      maxCol = Math.max(maxCol, getEndCol(word));
    }

    minRow = Math.max(0, minRow - 1);
    minCol = Math.max(0, minCol - 1);
    maxRow = Math.min(grid.height - 1, maxRow + 1);
    maxCol = Math.min(grid.width - 1, maxCol + 1);

    const newHeight = maxRow - minRow + 1;
    const newWidth = maxCol - minCol + 1;

    const newGrid: string[][] = Array(newHeight)
      .fill(null)
      .map(() => Array(newWidth).fill(' '));

    for (const word of grid.placedWords) {
      word.row -= minRow;
      word.col -= minCol;

      for (let i = 0; i < word.word.length; i++) {
        const r = word.row + (word.direction === Direction.VERTICAL ? i : 0);
        const c = word.col + (word.direction === Direction.HORIZONTAL ? i : 0);
        newGrid[r][c] = word.word.charAt(i);
      }
    }

    grid.setGrid(newGrid);
    grid.width = newWidth;
    grid.height = newHeight;
  }

  private assignNumbers(grid: CrosswordGrid): void {
    const sorted = grid.placedWords
      .slice()
      .sort((a, b) => {
        if (a.row !== b.row) return a.row - b.row;
        return a.col - b.col;
      });

    const positionNumbers = new Map<string, number>();
    let number = 1;

    for (const word of sorted) {
      const key = `${word.row},${word.col}`;
      if (!positionNumbers.has(key)) {
        positionNumbers.set(key, number++);
      }
      word.number = positionNumbers.get(key)!;
    }
  }

  private shuffleArray<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}
