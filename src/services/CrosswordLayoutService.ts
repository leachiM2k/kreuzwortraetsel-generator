import { CrosswordPuzzle } from '../models/CrosswordPuzzle';
import { Direction } from '../models/Direction';
import { WordEntry } from '../models/WordEntry';
import { WordPlacementService } from './WordPlacementService';

export class CrosswordLayoutService {
  private wordPlacementService: WordPlacementService;

  constructor() {
    this.wordPlacementService = new WordPlacementService();
  }

  createPuzzle(title: string, entries: WordEntry[]): CrosswordPuzzle {
    console.log(`Creating crossword: ${title}`);

    const grid = this.wordPlacementService.generateLayout(entries);

    // Separate horizontal and vertical clues
    const acrossClues = grid.placedWords
      .filter((w) => w.direction === Direction.HORIZONTAL)
      .sort((a, b) => a.number - b.number);

    const downClues = grid.placedWords
      .filter((w) => w.direction === Direction.VERTICAL)
      .sort((a, b) => a.number - b.number);

    return {
      grid,
      title,
      acrossClues,
      downClues,
    };
  }

  getSampleEntries(): WordEntry[] {
    return [
      { clue: 'Bester Freund des Menschen', answer: 'HUND' },
      { clue: 'Miau-Tier', answer: 'KATZE' },
      { clue: 'Fliegt im Himmel', answer: 'VOGEL' },
      { clue: 'Tier mit langem Rüssel', answer: 'ELEFANT' },
      { clue: 'Großes Tier im Meer', answer: 'WAL' },
      { clue: 'Tier mit Streifen', answer: 'ZEBRA' },
      { clue: 'König der Tiere', answer: 'LOEWE' },
      { clue: 'Tier das hüpft', answer: 'HASE' },
      { clue: 'Gibt Milch', answer: 'KUH' },
      { clue: 'Kleines Nagetier', answer: 'MAUS' },
      { clue: 'Tier mit Panzer', answer: 'SCHILDKROETE' },
      { clue: 'Schwimmt im Teich', answer: 'FISCH' },
      { clue: 'Tier mit langem Hals', answer: 'GIRAFFE' },
      { clue: 'Rosa Tier im Stall', answer: 'SCHWEIN' },
    ];
  }
}
