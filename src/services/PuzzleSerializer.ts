import { deflate, inflate } from 'pako';
import { CrosswordPuzzle } from '../models/CrosswordPuzzle';
import { CrosswordGrid } from '../models/CrosswordGrid';
import { Direction } from '../models/Direction';
import { PlacedWord } from '../models/PlacedWord';

const FORMAT_PREFIX = 'Z';

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  // Restore standard base64
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/');
  // Add padding
  while (b64.length % 4 !== 0) {
    b64 += '=';
  }
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function toCompactFormat(puzzle: CrosswordPuzzle): string {
  const grid = puzzle.grid;
  const lines: string[] = [];

  // Version
  lines.push('v1');

  // Title
  lines.push(puzzle.title);

  // Dimensions
  lines.push(`${grid.width},${grid.height}`);

  // Grid rows (. for empty, letter otherwise)
  for (let row = 0; row < grid.height; row++) {
    let rowStr = '';
    for (let col = 0; col < grid.width; col++) {
      const c = grid.getCell(row, col);
      rowStr += c === ' ' ? '.' : c;
    }
    lines.push(rowStr);
  }

  // Empty separator line
  lines.push('');

  // Placed words: number|direction(H/V)|row|col|word|clue
  for (const word of grid.placedWords) {
    const dir = word.direction === Direction.HORIZONTAL ? 'H' : 'V';
    lines.push(`${word.number}|${dir}|${word.row}|${word.col}|${word.word}|${word.clue}`);
  }

  return lines.join('\n');
}

function fromCompactFormat(text: string): CrosswordPuzzle {
  const lines = text.split('\n');

  // Version check
  if (lines[0] !== 'v1') {
    throw new Error(`Unknown format version: ${lines[0]}`);
  }

  // Title
  const title = lines[1];

  // Dimensions
  const [widthStr, heightStr] = lines[2].split(',');
  const width = parseInt(widthStr, 10);
  const height = parseInt(heightStr, 10);

  // Grid rows start at line 3, go for height lines
  const grid = new CrosswordGrid(width, height);
  for (let row = 0; row < height; row++) {
    const rowStr = lines[3 + row];
    for (let col = 0; col < width; col++) {
      const c = rowStr[col];
      grid.setCell(row, col, c === '.' ? ' ' : c);
    }
  }

  // After grid rows, there's an empty separator line, then placed words
  const wordsStart = 3 + height + 1; // +1 for empty line
  const placedWords: PlacedWord[] = [];

  for (let i = wordsStart; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Split with limit: number|dir|row|col|word|clue (clue may contain |)
    const parts = line.split('|');
    const number = parseInt(parts[0], 10);
    const direction = parts[1] === 'H' ? Direction.HORIZONTAL : Direction.VERTICAL;
    const row = parseInt(parts[2], 10);
    const col = parseInt(parts[3], 10);
    const word = parts[4];
    // Clue is everything after the 5th pipe (may contain pipes itself)
    const clue = parts.slice(5).join('|');

    placedWords.push({ word, clue, row, col, direction, number });
  }

  grid.placedWords = placedWords;

  // Reconstruct across/down clues
  const acrossClues = placedWords
    .filter(w => w.direction === Direction.HORIZONTAL)
    .sort((a, b) => a.number - b.number);
  const downClues = placedWords
    .filter(w => w.direction === Direction.VERTICAL)
    .sort((a, b) => a.number - b.number);

  return { grid, title, acrossClues, downClues };
}

export function serialize(puzzle: CrosswordPuzzle): string {
  const compact = toCompactFormat(puzzle);
  const encoder = new TextEncoder();
  const compressed = deflate(encoder.encode(compact));
  return FORMAT_PREFIX + base64UrlEncode(compressed);
}

export function deserialize(hash: string): CrosswordPuzzle {
  if (hash.startsWith(FORMAT_PREFIX)) {
    // New compact format
    const encoded = hash.substring(FORMAT_PREFIX.length);
    const compressed = base64UrlDecode(encoded);
    const decoder = new TextDecoder();
    const text = decoder.decode(inflate(compressed));
    return fromCompactFormat(text);
  }

  // Legacy format: plain base64 JSON
  const decodedData = atob(hash);
  const puzzleData = JSON.parse(decodedData);

  const grid = new CrosswordGrid(puzzleData.grid.width, puzzleData.grid.height);
  grid.grid = puzzleData.grid.grid;
  grid.placedWords = puzzleData.grid.placedWords;

  return {
    grid,
    title: puzzleData.title,
    acrossClues: puzzleData.acrossClues,
    downClues: puzzleData.downClues,
  };
}
