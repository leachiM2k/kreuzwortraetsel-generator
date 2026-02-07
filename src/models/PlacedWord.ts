import { Direction } from './Direction';

export interface PlacedWord {
  word: string;
  clue: string;
  row: number;
  col: number;
  direction: Direction;
  number: number;
}

export function getLength(word: PlacedWord): number {
  return word.word.length;
}

export function getCharAt(word: PlacedWord, index: number): string {
  return word.word.charAt(index);
}

export function getEndRow(word: PlacedWord): number {
  return word.direction === Direction.VERTICAL
    ? word.row + word.word.length - 1
    : word.row;
}

export function getEndCol(word: PlacedWord): number {
  return word.direction === Direction.HORIZONTAL
    ? word.col + word.word.length - 1
    : word.col;
}
