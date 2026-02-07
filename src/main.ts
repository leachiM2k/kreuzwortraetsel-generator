import './style.css';
import { CrosswordLayoutService } from './services/CrosswordLayoutService';
import { PDFGeneratorService } from './services/PDFGeneratorService';
import { WordEntry } from './models/WordEntry';
import { CrosswordPuzzle } from './models/CrosswordPuzzle';
import { Direction } from './models/Direction';

class CrosswordApp {
  private layoutService: CrosswordLayoutService;
  private pdfService: PDFGeneratorService;
  private currentPuzzle: CrosswordPuzzle | null = null;
  private entryCount = 0;

  constructor() {
    this.layoutService = new CrosswordLayoutService();
    this.pdfService = new PDFGeneratorService();
    this.init();
  }

  private init(): void {
    // Add initial entries
    this.addEntry();
    this.addEntry();
    this.addEntry();

    // Event listeners
    document
      .getElementById('add-entry-btn')
      ?.addEventListener('click', () => this.addEntry());
    document
      .getElementById('sample-btn')
      ?.addEventListener('click', () => this.loadSample());
    document
      .getElementById('preview-btn')
      ?.addEventListener('click', () => this.generatePreview());
    document
      .getElementById('generate-btn')
      ?.addEventListener('click', () => this.generatePDF());
  }

  private addEntry(): void {
    this.entryCount++;
    const container = document.getElementById('entries-container');
    if (!container) return;

    const entry = document.createElement('div');
    entry.className = 'entry';
    entry.dataset.id = this.entryCount.toString();

    entry.innerHTML = `
      <div class="entry-header">
        <span class="entry-number">Eintrag ${this.entryCount}</span>
        <button class="remove-btn" data-id="${this.entryCount}">✕</button>
      </div>
      <input type="text" placeholder="Frage (z.B. Bester Freund des Menschen)" class="entry-clue" />
      <input type="text" placeholder="Antwort (z.B. Hund)" class="entry-answer" />
    `;

    container.appendChild(entry);

    // Add remove handler
    entry.querySelector('.remove-btn')?.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const id = target.dataset.id;
      const entryToRemove = document.querySelector(
        `.entry[data-id="${id}"]`
      ) as HTMLElement;
      if (entryToRemove) {
        entryToRemove.remove();
        this.renumberEntries();
      }
    });
  }

  private renumberEntries(): void {
    const entries = document.querySelectorAll('.entry');
    entries.forEach((entry, index) => {
      const numberSpan = entry.querySelector('.entry-number');
      if (numberSpan) {
        numberSpan.textContent = `Eintrag ${index + 1}`;
      }
    });
  }

  private loadSample(): void {
    // Clear existing entries
    const container = document.getElementById('entries-container');
    if (!container) return;
    container.innerHTML = '';
    this.entryCount = 0;

    // Set title
    const titleInput = document.getElementById('title') as HTMLInputElement;
    if (titleInput) {
      titleInput.value = 'Tiere - Kreuzworträtsel für Kinder';
    }

    // Add sample entries
    const sampleEntries = this.layoutService.getSampleEntries();
    sampleEntries.forEach((entry) => {
      this.addEntry();
      const lastEntry = container.lastElementChild;
      if (lastEntry) {
        const clueInput = lastEntry.querySelector(
          '.entry-clue'
        ) as HTMLInputElement;
        const answerInput = lastEntry.querySelector(
          '.entry-answer'
        ) as HTMLInputElement;
        if (clueInput && answerInput) {
          clueInput.value = entry.clue;
          answerInput.value = entry.answer;
        }
      }
    });

    this.showMessage('Beispiel geladen!', 'success');
  }

  private getEntries(): WordEntry[] {
    const entries: WordEntry[] = [];
    const entryElements = document.querySelectorAll('.entry');

    entryElements.forEach((entry) => {
      const clue = (
        entry.querySelector('.entry-clue') as HTMLInputElement
      )?.value.trim();
      const answer = (
        entry.querySelector('.entry-answer') as HTMLInputElement
      )?.value.trim();

      if (clue && answer) {
        entries.push({ clue, answer });
      }
    });

    return entries;
  }

  private validateEntries(): string | null {
    const entries = this.getEntries();

    if (entries.length < 3) {
      return 'Bitte gib mindestens 3 Frage-Antwort-Paare ein.';
    }

    if (entries.length > 50) {
      return 'Maximal 50 Einträge erlaubt.';
    }

    for (const entry of entries) {
      if (!/^[a-zA-ZäöüÄÖÜß\s]+$/.test(entry.answer)) {
        return `Antwort "${entry.answer}" enthält ungültige Zeichen. Nur Buchstaben erlaubt.`;
      }
    }

    const title = (
      document.getElementById('title') as HTMLInputElement
    )?.value.trim();
    if (!title) {
      return 'Bitte gib einen Titel ein.';
    }

    return null;
  }

  private generatePreview(): void {
    const error = this.validateEntries();
    if (error) {
      this.showMessage(error, 'error');
      return;
    }

    this.hideMessage();

    try {
      const title = (
        document.getElementById('title') as HTMLInputElement
      ).value.trim();
      const entries = this.getEntries();

      this.currentPuzzle = this.layoutService.createPuzzle(title, entries);

      this.renderPreview(this.currentPuzzle);
      this.renderClues(this.currentPuzzle);

      // Enable PDF button
      const generateBtn = document.getElementById(
        'generate-btn'
      ) as HTMLButtonElement;
      if (generateBtn) {
        generateBtn.disabled = false;
      }

      this.showMessage(
        `Kreuzworträtsel erfolgreich erstellt! ${this.currentPuzzle.grid.placedWords.length} Wörter platziert.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      this.showMessage(
        err instanceof Error ? err.message : 'Fehler beim Erstellen des Kreuzworträtsels',
        'error'
      );
    }
  }

  private renderPreview(puzzle: CrosswordPuzzle): void {
    const container = document.getElementById('preview-container');
    if (!container) return;

    const grid = puzzle.grid;

    // Create grid element
    const gridElement = document.createElement('div');
    gridElement.className = 'crossword-grid';
    gridElement.style.gridTemplateColumns = `repeat(${grid.width}, 40px)`;

    // Create cells
    for (let row = 0; row < grid.height; row++) {
      for (let col = 0; col < grid.width; col++) {
        const cell = document.createElement('div');
        const cellValue = grid.getCell(row, col);

        if (cellValue === ' ') {
          cell.className = 'crossword-cell empty';
        } else {
          cell.className = 'crossword-cell';

          // Check if this is a word start
          const wordNumber = this.getWordNumberAt(puzzle, row, col);
          if (wordNumber) {
            const numberSpan = document.createElement('span');
            numberSpan.className = 'cell-number';
            numberSpan.textContent = wordNumber.toString();
            cell.appendChild(numberSpan);
          }
        }

        gridElement.appendChild(cell);
      }
    }

    container.innerHTML = '';
    container.appendChild(gridElement);
  }

  private getWordNumberAt(
    puzzle: CrosswordPuzzle,
    row: number,
    col: number
  ): number | null {
    for (const word of puzzle.grid.placedWords) {
      if (word.row === row && word.col === col) {
        return word.number;
      }
    }
    return null;
  }

  private renderClues(puzzle: CrosswordPuzzle): void {
    const cluesContainer = document.getElementById('clues-container');
    const acrossContainer = document.getElementById('across-clues');
    const downContainer = document.getElementById('down-clues');

    if (!cluesContainer || !acrossContainer || !downContainer) return;

    cluesContainer.style.display = 'grid';

    // Render across clues
    acrossContainer.innerHTML = puzzle.acrossClues
      .map(
        (clue) => `
        <div class="clue-item">
          <span class="clue-number">${clue.number}.</span> ${clue.clue}
        </div>
      `
      )
      .join('');

    // Render down clues
    downContainer.innerHTML = puzzle.downClues
      .map(
        (clue) => `
        <div class="clue-item">
          <span class="clue-number">${clue.number}.</span> ${clue.clue}
        </div>
      `
      )
      .join('');
  }

  private generatePDF(): void {
    if (!this.currentPuzzle) {
      this.showMessage('Bitte erstelle zuerst eine Vorschau.', 'error');
      return;
    }

    try {
      this.pdfService.generatePDF(this.currentPuzzle);
      this.showMessage('PDF erfolgreich erstellt und heruntergeladen!', 'success');
    } catch (err) {
      console.error(err);
      this.showMessage('Fehler beim Erstellen des PDFs', 'error');
    }
  }

  private showMessage(message: string, type: 'error' | 'success'): void {
    const errorElement = document.getElementById('error-message');
    if (!errorElement) return;

    errorElement.textContent = message;
    errorElement.className = 'error-message visible';

    if (type === 'success') {
      errorElement.style.background = 'rgba(16, 185, 129, 0.1)';
      errorElement.style.borderLeftColor = '#10b981';
      errorElement.style.color = '#10b981';
    } else {
      errorElement.style.background = 'rgba(239, 68, 68, 0.1)';
      errorElement.style.borderLeftColor = '#ef4444';
      errorElement.style.color = '#ef4444';
    }

    // Auto-hide success messages
    if (type === 'success') {
      setTimeout(() => this.hideMessage(), 3000);
    }
  }

  private hideMessage(): void {
    const errorElement = document.getElementById('error-message');
    if (errorElement) {
      errorElement.className = 'error-message';
    }
  }
}

// Initialize app
new CrosswordApp();
