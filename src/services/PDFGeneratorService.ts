import jsPDF from 'jspdf';
import { CrosswordPuzzle } from '../models/CrosswordPuzzle';

export class PDFGeneratorService {
  private readonly PAGE_MARGIN = 20;
  private readonly MAX_CELL_SIZE = 20;
  private readonly MIN_CELL_SIZE = 8;
  private readonly FONT_SIZE = 6;
  private readonly NUMBER_FONT_SIZE = 9;

  generatePDF(puzzle: CrosswordPuzzle): void {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(puzzle.title, pageWidth / 2, 15, { align: 'center' });

    // Calculate dynamic cell size to fit page width
    const availableWidth = pageWidth - 2 * this.PAGE_MARGIN;
    const cellSize = Math.min(
      this.MAX_CELL_SIZE,
      Math.max(this.MIN_CELL_SIZE, availableWidth / puzzle.grid.width)
    );

    // Calculate grid dimensions
    const gridWidth = puzzle.grid.width * cellSize;
    const gridHeight = puzzle.grid.height * cellSize;
    const gridX = (pageWidth - gridWidth) / 2;
    const gridY = 25;

    // Draw grid
    this.drawGrid(doc, puzzle, gridX, gridY, cellSize);

    // Check if clues should go on new page
    const cluesStartY = gridY + gridHeight + 15;
    const needsNewPage = cluesStartY > pageHeight - 100;

    if (needsNewPage) {
      doc.addPage();
      this.drawClues(doc, puzzle, 20);
    } else {
      this.drawClues(doc, puzzle, cluesStartY);
    }

    // Save PDF
    doc.save(`${puzzle.title.replace(/[^a-z0-9]/gi, '_')}.pdf`);
  }

  private drawGrid(
    doc: jsPDF,
    puzzle: CrosswordPuzzle,
    startX: number,
    startY: number,
    cellSize: number
  ): void {
    const grid = puzzle.grid;

    doc.setLineWidth(0.3);
    const fontSize = Math.max(this.FONT_SIZE, Math.min(this.FONT_SIZE * 0.4, cellSize * 0.5));
    const numberFontSize = Math.max(this.NUMBER_FONT_SIZE, Math.min(this.NUMBER_FONT_SIZE * 0.4, cellSize));
    doc.setFontSize(fontSize);

    // Draw cells
    for (let row = 0; row < grid.height; row++) {
      for (let col = 0; col < grid.width; col++) {
        const x = startX + col * cellSize;
        const y = startY + row * cellSize;
        const cell = grid.getCell(row, col);

        if (cell !== ' ') {
          // Draw cell box
          doc.rect(x, y, cellSize, cellSize);

          // Find word number if this is a word start
          const wordNumber = this.getWordNumberAt(puzzle, row, col);
          if (wordNumber) {
            doc.setFontSize(numberFontSize);
            doc.text(
              wordNumber.toString(),
              x + cellSize * 0.12,
              y + cellSize * 0.4
            );
            doc.setFontSize(fontSize);
          }
        }
      }
    }
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

  private drawClues(doc: jsPDF, puzzle: CrosswordPuzzle, startY: number): void {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const columnWidth = (pageWidth - 3 * this.PAGE_MARGIN) / 2;
    const maxTextWidth = columnWidth - 5;

    doc.setFontSize(11);
    let y = startY;

    // Across clues (left column)
    doc.setFont('helvetica', 'bold');
    doc.text('Waagerecht:', this.PAGE_MARGIN, y);
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const clue of puzzle.acrossClues) {
      const text = `${clue.number}. ${clue.clue}`;
      const lines = doc.splitTextToSize(text, maxTextWidth);

      // Check if we need a new page
      if (y + lines.length * 5 > pageHeight - 20) {
        doc.addPage();
        y = 20;
      }

      doc.text(lines, this.PAGE_MARGIN, y);
      y += lines.length * 5 + 2;
    }

    // Down clues (right column or continue)
    const downStartY = startY;
    let downY = downStartY;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Senkrecht:', pageWidth / 2, downY);
    downY += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    for (const clue of puzzle.downClues) {
      const text = `${clue.number}. ${clue.clue}`;
      const lines = doc.splitTextToSize(text, maxTextWidth);

      // Check if we need a new page
      if (downY + lines.length * 5 > pageHeight - 20) {
        doc.addPage();
        downY = 20;
      }

      doc.text(lines, pageWidth / 2, downY);
      downY += lines.length * 5 + 2;
    }
  }
}
