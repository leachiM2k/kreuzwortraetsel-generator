import './play.css';
import { CrosswordPuzzle } from './models/CrosswordPuzzle';
import { PlacedWord } from './models/PlacedWord';
import { Direction } from './models/Direction';
import { CrosswordGrid } from './models/CrosswordGrid';

interface CellPosition {
  row: number;
  col: number;
}

class CrosswordGame {
  private puzzle: CrosswordPuzzle;
  private currentCell: CellPosition | null = null;
  private currentDirection: Direction = Direction.HORIZONTAL;
  private userAnswers: Map<string, string> = new Map();

  constructor(puzzle: CrosswordPuzzle) {
    this.puzzle = puzzle;
    this.init();
  }

  private init(): void {
    this.renderTitle();
    this.renderGrid();
    this.renderClues();
    this.attachEventListeners();
    this.focusFirstCell();
  }

  private renderTitle(): void {
    const titleElement = document.getElementById('puzzle-title');
    if (titleElement) {
      titleElement.textContent = this.puzzle.title;
    }
  }

  private renderGrid(): void {
    const container = document.getElementById('game-grid-container');
    if (!container) return;

    const grid = this.puzzle.grid;
    const gridElement = document.createElement('div');
    gridElement.className = 'game-grid';
    gridElement.style.gridTemplateColumns = `repeat(${grid.width}, 45px)`;

    for (let row = 0; row < grid.height; row++) {
      for (let col = 0; col < grid.width; col++) {
        const cell = document.createElement('div');
        const cellValue = grid.getCell(row, col);

        if (cellValue === ' ') {
          cell.className = 'game-cell empty';
        } else {
          cell.className = 'game-cell';
          cell.dataset.row = row.toString();
          cell.dataset.col = col.toString();
          cell.dataset.answer = cellValue;

          // Add word number if this is a word start
          const wordNumber = this.getWordNumberAt(row, col);
          if (wordNumber) {
            const numberSpan = document.createElement('span');
            numberSpan.className = 'cell-number';
            numberSpan.textContent = wordNumber.toString();
            cell.appendChild(numberSpan);
          }

          // Add input
          const input = document.createElement('input');
          input.type = 'text';
          input.maxLength = 1;
          input.dataset.row = row.toString();
          input.dataset.col = col.toString();
          cell.appendChild(input);

          // Cell click handler
          cell.addEventListener('click', () => {
            this.selectCell(row, col);
          });

          // Input handlers
          input.addEventListener('input', (e) => {
            this.handleInput(e as InputEvent, row, col);
          });

          input.addEventListener('keydown', (e) => {
            this.handleKeyDown(e as KeyboardEvent, row, col);
          });

          input.addEventListener('focus', () => {
            this.selectCell(row, col);
          });
        }

        gridElement.appendChild(cell);
      }
    }

    container.innerHTML = '';
    container.appendChild(gridElement);

    // Add keyboard hint
    const hint = document.createElement('div');
    hint.className = 'keyboard-hint';
    hint.textContent = '💡 Pfeiltasten zur Navigation • Tab für Richtungswechsel • Rücktaste zum Löschen';
    container.appendChild(hint);
  }

  private getWordNumberAt(row: number, col: number): number | null {
    for (const word of this.puzzle.grid.placedWords) {
      if (word.row === row && word.col === col) {
        return word.number;
      }
    }
    return null;
  }

  private renderClues(): void {
    const acrossContainer = document.getElementById('play-across-clues');
    const downContainer = document.getElementById('play-down-clues');

    if (!acrossContainer || !downContainer) return;

    // Across clues
    acrossContainer.innerHTML = this.puzzle.acrossClues
      .map((clue) => {
        return `
          <div class="clue-item" data-word-id="${clue.number}-${clue.direction}">
            <span class="clue-number">${clue.number}.</span>
            <span class="clue-text">${clue.clue}</span>
          </div>
        `;
      })
      .join('');

    // Down clues
    downContainer.innerHTML = this.puzzle.downClues
      .map((clue) => {
        return `
          <div class="clue-item" data-word-id="${clue.number}-${clue.direction}">
            <span class="clue-number">${clue.number}.</span>
            <span class="clue-text">${clue.clue}</span>
          </div>
        `;
      })
      .join('');

    // Add click handlers to clues
    document.querySelectorAll('.clue-item').forEach((clue) => {
      clue.addEventListener('click', () => {
        const wordId = clue.getAttribute('data-word-id');
        if (wordId) {
          const [number, direction] = wordId.split('-');
          this.selectWordByNumber(
            parseInt(number),
            direction as Direction
          );
        }
      });
    });
  }

  private selectWordByNumber(number: number, direction: Direction): void {
    const word = this.puzzle.grid.placedWords.find(
      (w) => w.number === number && w.direction === direction
    );
    if (word) {
      this.currentDirection = direction;
      this.selectCell(word.row, word.col);
    }
  }

  private attachEventListeners(): void {
    document.getElementById('check-btn')?.addEventListener('click', () => {
      this.checkSolution();
    });

    document.getElementById('clear-btn')?.addEventListener('click', () => {
      this.clearAll();
    });

    document.getElementById('reveal-btn')?.addEventListener('click', () => {
      this.revealSolution();
    });
  }

  private selectCell(row: number, col: number): void {
    // If clicking the same cell, toggle direction
    if (
      this.currentCell &&
      this.currentCell.row === row &&
      this.currentCell.col === col
    ) {
      this.currentDirection =
        this.currentDirection === Direction.HORIZONTAL
          ? Direction.VERTICAL
          : Direction.HORIZONTAL;
    }

    this.currentCell = { row, col };
    this.updateHighlights();
    this.focusCell(row, col);
  }

  private updateHighlights(): void {
    // Clear all highlights
    document
      .querySelectorAll('.game-cell')
      .forEach((cell) => cell.classList.remove('active', 'highlighted'));
    document
      .querySelectorAll('.clue-item')
      .forEach((clue) => clue.classList.remove('active'));

    if (!this.currentCell) return;

    // Find current word
    const currentWord = this.getCurrentWord();
    if (!currentWord) return;

    // Highlight current word cells
    for (let i = 0; i < currentWord.word.length; i++) {
      const r =
        currentWord.row + (currentWord.direction === Direction.VERTICAL ? i : 0);
      const c =
        currentWord.col + (currentWord.direction === Direction.HORIZONTAL ? i : 0);
      const cell = document.querySelector(
        `.game-cell[data-row="${r}"][data-col="${c}"]`
      );
      if (cell) {
        if (r === this.currentCell.row && c === this.currentCell.col) {
          cell.classList.add('active');
        } else {
          cell.classList.add('highlighted');
        }
      }
    }

    // Highlight current clue
    const clue = document.querySelector(
      `.clue-item[data-word-id="${currentWord.number}-${currentWord.direction}"]`
    );
    if (clue) {
      clue.classList.add('active');
      clue.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  private getCurrentWord(): PlacedWord | null {
    if (!this.currentCell) return null;

    // Find word that contains current cell in current direction
    return (
      this.puzzle.grid.placedWords.find((word) => {
        if (word.direction !== this.currentDirection) return false;

        for (let i = 0; i < word.word.length; i++) {
          const r = word.row + (word.direction === Direction.VERTICAL ? i : 0);
          const c = word.col + (word.direction === Direction.HORIZONTAL ? i : 0);
          if (r === this.currentCell!.row && c === this.currentCell!.col) {
            return true;
          }
        }
        return false;
      }) || null
    );
  }

  private focusCell(row: number, col: number): void {
    const input = document.querySelector(
      `input[data-row="${row}"][data-col="${col}"]`
    ) as HTMLInputElement;
    if (input) {
      input.focus();
      input.select();
    }
  }

  private focusFirstCell(): void {
    const firstInput = document.querySelector(
      '.game-cell:not(.empty) input'
    ) as HTMLInputElement;
    if (firstInput) {
      const row = parseInt(firstInput.dataset.row || '0');
      const col = parseInt(firstInput.dataset.col || '0');
      this.selectCell(row, col);
    }
  }

  private handleInput(e: InputEvent, row: number, col: number): void {
    const input = e.target as HTMLInputElement;
    const value = input.value.toUpperCase();

    if (value.length > 0) {
      input.value = value.charAt(value.length - 1);
      this.userAnswers.set(`${row},${col}`, input.value);
      this.moveToNextCell(row, col);
    }
  }

  private handleKeyDown(e: KeyboardEvent, row: number, col: number): void {
    const input = e.target as HTMLInputElement;

    switch (e.key) {
      case 'Backspace':
        if (input.value === '') {
          e.preventDefault();
          this.moveToPreviousCell(row, col);
        } else {
          this.userAnswers.delete(`${row},${col}`);
        }
        break;

      case 'Delete':
        this.userAnswers.delete(`${row},${col}`);
        break;

      case 'Tab':
        e.preventDefault();
        this.currentDirection =
          this.currentDirection === Direction.HORIZONTAL
            ? Direction.VERTICAL
            : Direction.HORIZONTAL;
        this.updateHighlights();
        break;

      case 'ArrowUp':
        e.preventDefault();
        this.moveToCell(row - 1, col);
        break;

      case 'ArrowDown':
        e.preventDefault();
        this.moveToCell(row + 1, col);
        break;

      case 'ArrowLeft':
        e.preventDefault();
        this.moveToCell(row, col - 1);
        break;

      case 'ArrowRight':
        e.preventDefault();
        this.moveToCell(row, col + 1);
        break;
    }
  }

  private moveToNextCell(row: number, col: number): void {
    const currentWord = this.getCurrentWord();
    if (!currentWord) return;

    // Find position in current word
    let position = -1;
    for (let i = 0; i < currentWord.word.length; i++) {
      const r = currentWord.row + (currentWord.direction === Direction.VERTICAL ? i : 0);
      const c = currentWord.col + (currentWord.direction === Direction.HORIZONTAL ? i : 0);
      if (r === row && c === col) {
        position = i;
        break;
      }
    }

    // Move to next cell in word
    if (position >= 0 && position < currentWord.word.length - 1) {
      const nextPos = position + 1;
      const nextRow =
        currentWord.row + (currentWord.direction === Direction.VERTICAL ? nextPos : 0);
      const nextCol =
        currentWord.col + (currentWord.direction === Direction.HORIZONTAL ? nextPos : 0);
      this.selectCell(nextRow, nextCol);
    }
  }

  private moveToPreviousCell(row: number, col: number): void {
    const currentWord = this.getCurrentWord();
    if (!currentWord) return;

    // Find position in current word
    let position = -1;
    for (let i = 0; i < currentWord.word.length; i++) {
      const r = currentWord.row + (currentWord.direction === Direction.VERTICAL ? i : 0);
      const c = currentWord.col + (currentWord.direction === Direction.HORIZONTAL ? i : 0);
      if (r === row && c === col) {
        position = i;
        break;
      }
    }

    // Move to previous cell in word
    if (position > 0) {
      const prevPos = position - 1;
      const prevRow =
        currentWord.row + (currentWord.direction === Direction.VERTICAL ? prevPos : 0);
      const prevCol =
        currentWord.col + (currentWord.direction === Direction.HORIZONTAL ? prevPos : 0);
      this.selectCell(prevRow, prevCol);

      // Clear the cell we moved to
      const input = document.querySelector(
        `input[data-row="${prevRow}"][data-col="${prevCol}"]`
      ) as HTMLInputElement;
      if (input) {
        input.value = '';
        this.userAnswers.delete(`${prevRow},${prevCol}`);
      }
    }
  }

  private moveToCell(row: number, col: number): void {
    const cell = document.querySelector(
      `.game-cell[data-row="${row}"][data-col="${col}"]`
    );
    if (cell && !cell.classList.contains('empty')) {
      this.selectCell(row, col);
    }
  }

  private checkSolution(): void {
    let allCorrect = true;
    let hasEmpty = false;

    // Clear previous highlights
    document
      .querySelectorAll('.game-cell')
      .forEach((cell) =>
        cell.classList.remove('correct', 'incorrect')
      );

    // Check each cell
    for (let row = 0; row < this.puzzle.grid.height; row++) {
      for (let col = 0; col < this.puzzle.grid.width; col++) {
        const correctAnswer = this.puzzle.grid.getCell(row, col);
        if (correctAnswer === ' ') continue;

        const userAnswer = this.userAnswers.get(`${row},${col}`) || '';
        const cell = document.querySelector(
          `.game-cell[data-row="${row}"][data-col="${col}"]`
        );

        if (userAnswer === '') {
          hasEmpty = true;
          allCorrect = false;
        } else if (userAnswer === correctAnswer) {
          cell?.classList.add('correct');
        } else {
          cell?.classList.add('incorrect');
          allCorrect = false;
        }
      }
    }

    // Show result
    const resultElement = document.getElementById('result-message');
    if (resultElement) {
      resultElement.className = 'result-message visible';

      if (allCorrect && !hasEmpty) {
        resultElement.classList.add('success');
        resultElement.textContent = '🎉 Perfekt! Alle Antworten sind korrekt!';
      } else if (hasEmpty) {
        resultElement.classList.add('info');
        resultElement.textContent = 'ℹ️ Bitte fülle alle Felder aus.';
      } else {
        resultElement.classList.add('error');
        resultElement.textContent = '❌ Einige Antworten sind falsch. Versuche es nochmal!';
      }

      setTimeout(() => {
        if (!allCorrect || hasEmpty) {
          document
            .querySelectorAll('.game-cell')
            .forEach((cell) =>
              cell.classList.remove('correct', 'incorrect')
            );
        }
      }, 2000);
    }
  }

  private clearAll(): void {
    this.userAnswers.clear();
    document.querySelectorAll('.game-cell input').forEach((input) => {
      (input as HTMLInputElement).value = '';
    });
    document
      .querySelectorAll('.game-cell')
      .forEach((cell) =>
        cell.classList.remove('correct', 'incorrect')
      );
    this.hideResultMessage();
  }

  private revealSolution(): void {
    for (let row = 0; row < this.puzzle.grid.height; row++) {
      for (let col = 0; col < this.puzzle.grid.width; col++) {
        const answer = this.puzzle.grid.getCell(row, col);
        if (answer === ' ') continue;

        const input = document.querySelector(
          `input[data-row="${row}"][data-col="${col}"]`
        ) as HTMLInputElement;
        if (input) {
          input.value = answer;
          this.userAnswers.set(`${row},${col}`, answer);
        }
      }
    }

    document
      .querySelectorAll('.game-cell:not(.empty)')
      .forEach((cell) => cell.classList.add('correct'));

    const resultElement = document.getElementById('result-message');
    if (resultElement) {
      resultElement.className = 'result-message visible info';
      resultElement.textContent = '💡 Lösung wurde angezeigt';
    }
  }

  private hideResultMessage(): void {
    const resultElement = document.getElementById('result-message');
    if (resultElement) {
      resultElement.className = 'result-message';
    }
  }
}

// Initialize game
function loadPuzzle(): CrosswordPuzzle | null {
  try {
    const hash = window.location.hash.substring(1);
    if (!hash) {
      throw new Error('No puzzle data in URL');
    }

    const decodedData = atob(hash);
    const puzzleData = JSON.parse(decodedData);

    // Reconstruct CrosswordGrid instance from plain object
    const grid = new CrosswordGrid(
      puzzleData.grid.width,
      puzzleData.grid.height
    );
    grid.grid = puzzleData.grid.grid;
    grid.placedWords = puzzleData.grid.placedWords;

    const puzzle: CrosswordPuzzle = {
      grid,
      title: puzzleData.title,
      acrossClues: puzzleData.acrossClues,
      downClues: puzzleData.downClues,
    };

    return puzzle;
  } catch (err) {
    console.error('Failed to load puzzle:', err);
    alert('Fehler beim Laden des Kreuzworträtsels. Bitte erstelle ein neues.');
    window.location.href = '/';
    return null;
  }
}

const puzzle = loadPuzzle();
if (puzzle) {
  new CrosswordGame(puzzle);
}
