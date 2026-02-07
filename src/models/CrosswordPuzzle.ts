import { CrosswordGrid } from './CrosswordGrid';
import { PlacedWord } from './PlacedWord';

export interface CrosswordPuzzle {
  grid: CrosswordGrid;
  title: string;
  acrossClues: PlacedWord[];
  downClues: PlacedWord[];
}
