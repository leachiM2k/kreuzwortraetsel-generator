export interface WordEntry {
  clue: string;
  answer: string;
}

export function normalizeWordEntry(entry: WordEntry): WordEntry {
  const normalized = entry.answer
    .toUpperCase()
    .replace(/[^A-ZÄÖÜ]/g, '')
    .replace(/Ä/g, 'AE')
    .replace(/Ö/g, 'OE')
    .replace(/Ü/g, 'UE')
    .replace(/ß/g, 'SS');

  return {
    clue: entry.clue,
    answer: normalized,
  };
}
