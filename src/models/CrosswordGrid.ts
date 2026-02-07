import { Direction } from './Direction';
import { PlacedWord } from './PlacedWord';

export class CrosswordGrid {
  grid: string[][];
  width: number;
  height: number;
  placedWords: PlacedWord[];

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.placedWords = [];

    // Initialize grid with empty spaces
    this.grid = Array(height)
      .fill(null)
      .map(() => Array(width).fill(' '));
  }

  isInBounds(row: number, col: number): boolean {
    return row >= 0 && row < this.height && col >= 0 && col < this.width;
  }

  getCell(row: number, col: number): string {
    if (!this.isInBounds(row, col)) {
      return ' ';
    }
    return this.grid[row][col];
  }

  setCell(row: number, col: number, value: string): void {
    if (this.isInBounds(row, col)) {
      this.grid[row][col] = value;
    }
  }

  isEmpty(row: number, col: number): boolean {
    return this.getCell(row, col) === ' ';
  }

  addPlacedWord(word: PlacedWord): void {
    this.placedWords.push(word);

    // Place word in grid
    for (let i = 0; i < word.word.length; i++) {
      let r = word.row;
      let c = word.col;

      if (word.direction === Direction.HORIZONTAL) {
        c += i;
      } else {
        r += i;
      }

      this.setCell(r, c, word.word.charAt(i));
    }
  }

  toAscii(): string {
    let result = '';
    for (let i = 0; i < this.height; i++) {
      for (let j = 0; j < this.width; j++) {
        const c = this.grid[i][j];
        result += (c === ' ' ? '.' : c) + ' ';
      }
      result += '\n';
    }
    return result;
  }

  setGrid(newGrid: string[][]): void {
    this.grid = newGrid;
  }
}
