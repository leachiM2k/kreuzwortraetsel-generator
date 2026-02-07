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

export class WordPlacementService {
  generateLayout(entries: WordEntry[]): CrosswordGrid {
    if (!entries || entries.length === 0) {
      throw new Error('No words provided');
    }

    // Normalize and sort words by length (longest first)
    const sortedEntries = entries
      .map(normalizeWordEntry)
      .sort((a, b) => b.answer.length - a.answer.length);

    // Calculate initial grid size
    const totalLength = sortedEntries.reduce(
      (sum, e) => sum + e.answer.length,
      0
    );
    const initialSize = Math.min(
      MAX_GRID_SIZE,
      Math.max(15, Math.floor(Math.sqrt(totalLength * 3)))
    );

    const grid = new CrosswordGrid(initialSize, initialSize);

    // Place first word horizontally in the middle
    const firstEntry = sortedEntries[0];
    const firstWord = firstEntry.answer;
    const startRow = Math.floor(initialSize / 2);
    const startCol = Math.floor((initialSize - firstWord.length) / 2);

    const firstPlaced: PlacedWord = {
      word: firstWord,
      clue: firstEntry.clue,
      row: startRow,
      col: startCol,
      direction: Direction.HORIZONTAL,
      number: 1,
    };

    grid.addPlacedWord(firstPlaced);
    console.log(
      `Placed first word: ${firstWord} at (${startRow}, ${startCol})`
    );

    // Place remaining words
    const unplaced: WordEntry[] = [];
    for (let i = 1; i < sortedEntries.length; i++) {
      const entry = sortedEntries[i];
      if (!this.placeWord(grid, entry)) {
        unplaced.push(entry);
        console.warn(`Could not place word: ${entry.answer}`);
      }
    }

    if (grid.placedWords.length < 3) {
      throw new Error('Could not place enough words to create a crossword');
    }

    // Optimize grid by trimming empty space
    this.optimizeGrid(grid);

    // Assign numbers to words
    this.assignNumbers(grid);

    console.log(
      `Successfully placed ${grid.placedWords.length} out of ${sortedEntries.length} words`
    );
    return grid;
  }

  private placeWord(grid: CrosswordGrid, entry: WordEntry): boolean {
    const word = entry.answer;
    const options = this.findAllPlacementOptions(grid, word);

    if (options.length === 0) {
      return false;
    }

    // Sort by score (number of intersections)
    options.sort((a, b) => b.score - a.score);

    // Try best options
    const tryCount = Math.min(10, options.length);
    for (let i = 0; i < tryCount; i++) {
      const option = options[i];
      if (this.canPlaceWord(grid, word, option)) {
        const placed: PlacedWord = {
          word,
          clue: entry.clue,
          row: option.row,
          col: option.col,
          direction: option.direction,
          number: 0, // Will be assigned later
        };

        grid.addPlacedWord(placed);
        console.log(
          `Placed word: ${word} at (${option.row}, ${option.col}) ${option.direction}`
        );
        return true;
      }
    }

    return false;
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
    grid: CrosswordGrid,
    newWord: string,
    existingWord: PlacedWord
  ): PlacementOption[] {
    const intersections: PlacementOption[] = [];
    const newDirection =
      existingWord.direction === Direction.HORIZONTAL
        ? Direction.VERTICAL
        : Direction.HORIZONTAL;

    // Find common letters
    for (let i = 0; i < newWord.length; i++) {
      const newChar = newWord.charAt(i);

      for (let j = 0; j < existingWord.word.length; j++) {
        const existingChar = existingWord.word.charAt(j);

        if (newChar === existingChar) {
          // Calculate position for new word
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
    // Check bounds
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

    // Check each position
    for (let i = 0; i < word.length; i++) {
      const r = option.row + (option.direction === Direction.VERTICAL ? i : 0);
      const c = option.col + (option.direction === Direction.HORIZONTAL ? i : 0);

      const existing = grid.getCell(r, c);
      const newChar = word.charAt(i);

      if (existing !== ' ') {
        if (existing !== newChar) {
          return false; // Conflict
        }
        intersectionCount++;
      } else {
        // Check perpendicular cells (no touching words except at intersections)
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

    // Must have at least one intersection
    if (intersectionCount === 0) {
      return false;
    }

    // Check before and after word
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
    if (grid.placedWords.length === 0) {
      return;
    }

    // Find actual bounds
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

    // Add padding
    minRow = Math.max(0, minRow - 1);
    minCol = Math.max(0, minCol - 1);
    maxRow = Math.min(grid.height - 1, maxRow + 1);
    maxCol = Math.min(grid.width - 1, maxCol + 1);

    const newHeight = maxRow - minRow + 1;
    const newWidth = maxCol - minCol + 1;

    // Create new grid
    const newGrid: string[][] = Array(newHeight)
      .fill(null)
      .map(() => Array(newWidth).fill(' '));

    // Shift all words
    for (const word of grid.placedWords) {
      word.row -= minRow;
      word.col -= minCol;

      // Place in new grid
      for (let i = 0; i < word.word.length; i++) {
        const r = word.row + (word.direction === Direction.VERTICAL ? i : 0);
        const c = word.col + (word.direction === Direction.HORIZONTAL ? i : 0);
        newGrid[r][c] = word.word.charAt(i);
      }
    }

    grid.setGrid(newGrid);
    grid.width = newWidth;
    grid.height = newHeight;

    console.log(`Optimized grid to ${newWidth}x${newHeight}`);
  }

  private assignNumbers(grid: CrosswordGrid): void {
    // Sort words by position (top to bottom, left to right)
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
}
