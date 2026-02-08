import './style.css';
import { CrosswordLayoutService } from './services/CrosswordLayoutService';
import { PDFGeneratorService } from './services/PDFGeneratorService';
import { serialize } from './services/PuzzleSerializer';
import { WordEntry } from './models/WordEntry';
import { CrosswordPuzzle } from './models/CrosswordPuzzle';

class CrosswordApp {
  private layoutService: CrosswordLayoutService;
  private pdfService: PDFGeneratorService;
  private currentPuzzle: CrosswordPuzzle | null = null;
  private entryCount = 0;
  private readonly STORAGE_KEY = 'crossword-generator-data';

  constructor() {
    this.layoutService = new CrosswordLayoutService();
    this.pdfService = new PDFGeneratorService();
    this.init();
  }

  private init(): void {
    // Try to load saved data first
    const hasLoadedData = this.loadFromLocalStorage();

    // If no saved data, add initial entries
    if (!hasLoadedData) {
      this.addEntry();
      this.addEntry();
      this.addEntry();
    }

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

    // AI Prompt listeners
    document
      .getElementById('ai-prompt-btn')
      ?.addEventListener('click', () => this.toggleAIPrompt());
    document
      .getElementById('close-ai-prompt')
      ?.addEventListener('click', () => this.toggleAIPrompt());
    document
      .getElementById('copy-prompt-btn')
      ?.addEventListener('click', () => this.copyPrompt());
    document
      .getElementById('load-json-btn')
      ?.addEventListener('click', () => this.loadFromJSON());

    // Add listener for title input
    document
      .getElementById('title')
      ?.addEventListener('input', () => this.saveToLocalStorage());
  }

  private toggleAIPrompt(): void {
    const section = document.getElementById('ai-prompt-section');
    if (section) {
      section.style.display = section.style.display === 'none' ? 'block' : 'none';
    }
  }

  private async copyPrompt(): Promise<void> {
    const promptText = document.getElementById('ai-prompt-text')?.textContent;
    const copyBtn = document.getElementById('copy-prompt-btn');

    if (promptText && copyBtn) {
      try {
        await navigator.clipboard.writeText(promptText);
        copyBtn.textContent = '✓ Kopiert!';
        copyBtn.classList.add('copied');

        setTimeout(() => {
          copyBtn.textContent = '📋 Kopieren';
          copyBtn.classList.remove('copied');
        }, 2000);
      } catch (err) {
        this.showMessage('Fehler beim Kopieren. Bitte manuell kopieren.', 'error');
      }
    }
  }

  private loadFromJSON(): void {
    const textarea = document.getElementById('json-input') as HTMLTextAreaElement;
    if (!textarea) return;

    const jsonText = textarea.value.trim();
    if (!jsonText) {
      this.showMessage('Bitte füge die JSON-Ausgabe der KI ein.', 'error');
      return;
    }

    try {
      const data = JSON.parse(jsonText);

      // Validate structure
      if (!data.title || !Array.isArray(data.entries)) {
        throw new Error('Ungültiges JSON-Format');
      }

      // Validate entries
      for (const entry of data.entries) {
        if (!entry.clue || !entry.answer) {
          throw new Error('Jeder Eintrag muss "clue" und "answer" enthalten');
        }
        if (!/^[a-zA-ZäöüÄÖÜß\s]+$/.test(entry.answer)) {
          throw new Error(`Antwort "${entry.answer}" enthält ungültige Zeichen`);
        }
      }

      // Clear existing entries
      const container = document.getElementById('entries-container');
      if (!container) return;
      container.innerHTML = '';
      this.entryCount = 0;

      // Set title
      const titleInput = document.getElementById('title') as HTMLInputElement;
      if (titleInput) {
        titleInput.value = data.title;
      }

      // Add entries
      data.entries.forEach((entry: { clue: string; answer: string }) => {
        this.addEntry();
        const lastEntry = container.lastElementChild;
        if (lastEntry) {
          const clueInput = lastEntry.querySelector('.entry-clue') as HTMLInputElement;
          const answerInput = lastEntry.querySelector('.entry-answer') as HTMLInputElement;
          if (clueInput && answerInput) {
            clueInput.value = entry.clue;
            answerInput.value = entry.answer.toUpperCase();
          }
        }
      });

      // Save and close
      this.saveToLocalStorage();
      this.toggleAIPrompt();
      textarea.value = '';

      this.showMessage(
        `✓ ${data.entries.length} Einträge erfolgreich geladen!`,
        'success'
      );
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Ungültiges JSON-Format';
      this.showMessage(
        `Fehler beim Laden: ${errorMsg}. Bitte überprüfe das JSON-Format.`,
        'error'
      );
    }
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

    // Add input listeners for auto-save
    entry.querySelector('.entry-clue')?.addEventListener('input', () => this.saveToLocalStorage());
    entry.querySelector('.entry-answer')?.addEventListener('input', () => this.saveToLocalStorage());

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
        this.saveToLocalStorage();
      }
    });

    // Save after adding entry
    this.saveToLocalStorage();
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

    // Save to localStorage
    this.saveToLocalStorage();

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

      // Enable PDF and Play buttons
      const generateBtn = document.getElementById(
        'generate-btn'
      ) as HTMLButtonElement;
      if (generateBtn) {
        generateBtn.disabled = false;
      }

      this.setPlayPageLink();

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

    // Calculate responsive cell size
    const cellSize = this.calculateCellSize(grid.width, container);

    // Create grid element
    const gridElement = document.createElement('div');
    gridElement.className = 'crossword-grid';
    gridElement.style.gridTemplateColumns = `repeat(${grid.width}, ${cellSize}px)`;

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

  private calculateCellSize(gridWidth: number, container: HTMLElement): number {
    const containerWidth = container.clientWidth;
    const screenWidth = window.innerWidth;

    // Maximum cell size based on screen width
    let maxCellSize = 40;
    if (screenWidth <= 380) {
      maxCellSize = 18;
    } else if (screenWidth <= 480) {
      maxCellSize = 22;
    } else if (screenWidth <= 768) {
      maxCellSize = 26;
    }

    // Calculate size that fits the container (accounting for gaps and border)
    const availableWidth = containerWidth - 40; // Reserve space for padding/border
    const gapTotal = gridWidth - 1; // 1px gap between cells
    const cellSize = Math.floor((availableWidth - gapTotal) / gridWidth);

    // Use smaller of calculated size or max size, but at least 16px
    return Math.max(16, Math.min(cellSize, maxCellSize));
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

  private setPlayPageLink(): void {
    if (!this.currentPuzzle) {
      this.showMessage('Bitte erstelle zuerst eine Vorschau.', 'error');
      return;
    }

    try {
      const encodedData = serialize(this.currentPuzzle);

      const playBtn = document.getElementById(
          'play-btn'
      ) as HTMLLinkElement;
      if (playBtn) {
        playBtn.href = `./play.html#${encodedData}`;
        playBtn.classList.remove('btn-disabled');
      }

    } catch (err) {
      console.error(err);
      this.showMessage('Fehler beim Öffnen der Spielseite', 'error');
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

  private saveToLocalStorage(): void {
    try {
      const title = (document.getElementById('title') as HTMLInputElement)?.value || '';
      const entries: Array<{ clue: string; answer: string }> = [];

      const entryElements = document.querySelectorAll('.entry');
      entryElements.forEach((entry) => {
        const clue = (entry.querySelector('.entry-clue') as HTMLInputElement)?.value || '';
        const answer = (entry.querySelector('.entry-answer') as HTMLInputElement)?.value || '';
        entries.push({ clue, answer });
      });

      const data = { title, entries };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
      console.error('Fehler beim Speichern in localStorage:', err);
    }
  }

  private loadFromLocalStorage(): boolean {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (!savedData) return false;

      const data = JSON.parse(savedData);

      // Set title
      const titleInput = document.getElementById('title') as HTMLInputElement;
      if (titleInput && data.title) {
        titleInput.value = data.title;
      }

      // Load entries
      if (data.entries && Array.isArray(data.entries)) {
        data.entries.forEach((entry: { clue: string; answer: string }) => {
          this.addEntry();
          const container = document.getElementById('entries-container');
          if (container) {
            const lastEntry = container.lastElementChild;
            if (lastEntry) {
              const clueInput = lastEntry.querySelector('.entry-clue') as HTMLInputElement;
              const answerInput = lastEntry.querySelector('.entry-answer') as HTMLInputElement;
              if (clueInput && answerInput) {
                clueInput.value = entry.clue;
                answerInput.value = entry.answer;
              }
            }
          }
        });
        return true;
      }

      return false;
    } catch (err) {
      console.error('Fehler beim Laden aus localStorage:', err);
      return false;
    }
  }
}

// Initialize app
new CrosswordApp();
