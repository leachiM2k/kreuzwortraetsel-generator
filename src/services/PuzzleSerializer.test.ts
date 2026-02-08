import { describe, it, expect } from 'vitest';
import { serializeEntries, deserializeEntries } from './PuzzleSerializer';

describe('PuzzleSerializer - Entries', () => {
  describe('serializeEntries and deserializeEntries', () => {
    it('should serialize and deserialize entries correctly', () => {
      const data = {
        title: 'Test Kreuzworträtsel',
        entries: [
          { clue: 'Bester Freund des Menschen', answer: 'HUND' },
          { clue: 'Größtes Landsäugetier', answer: 'ELEFANT' },
          { clue: 'Schnellstes Landtier', answer: 'GEPARD' },
        ],
      };

      const encoded = serializeEntries(data);

      // Should start with 'E' prefix
      expect(encoded).toMatch(/^E/);

      // Should be reasonably short (compressed)
      expect(encoded.length).toBeLessThan(500);

      const decoded = deserializeEntries(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.title).toBe(data.title);
      expect(decoded?.entries).toHaveLength(3);
      expect(decoded?.entries[0]).toEqual(data.entries[0]);
      expect(decoded?.entries[1]).toEqual(data.entries[1]);
      expect(decoded?.entries[2]).toEqual(data.entries[2]);
    });

    it('should handle German umlauts', () => {
      const data = {
        title: 'Tiere Kreuzworträtsel',
        entries: [
          { clue: 'Waldtier mit Geweih', answer: 'HIRSCH' },
          { clue: 'Großes Raubtier', answer: 'BÄR' },
          { clue: 'Flugtier', answer: 'MÖWE' },
        ],
      };

      const encoded = serializeEntries(data);
      const decoded = deserializeEntries(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.title).toBe('Tiere Kreuzworträtsel');
      expect(decoded?.entries[1].answer).toBe('BÄR');
      expect(decoded?.entries[2].answer).toBe('MÖWE');
    });

    it('should handle clues with pipe characters', () => {
      const data = {
        title: 'Test with pipes',
        entries: [
          { clue: 'Question with | pipe', answer: 'ANSWER1' },
          { clue: 'Multiple || pipes ||| here', answer: 'ANSWER2' },
        ],
      };

      const encoded = serializeEntries(data);
      const decoded = deserializeEntries(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.entries[0].clue).toBe('Question with | pipe');
      expect(decoded?.entries[1].clue).toBe('Multiple || pipes ||| here');
    });

    it('should handle empty entries array', () => {
      const data = {
        title: 'Empty Test',
        entries: [],
      };

      const encoded = serializeEntries(data);
      const decoded = deserializeEntries(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.title).toBe('Empty Test');
      expect(decoded?.entries).toHaveLength(0);
    });

    it('should handle long titles and clues', () => {
      const data = {
        title: 'Dies ist ein sehr langer Titel für ein Kreuzworträtsel mit vielen Wörtern und Zeichen',
        entries: [
          {
            clue: 'Eine sehr lange Frage mit vielen Details und Erklärungen die viel Platz benötigt',
            answer: 'LANGANTWORT'
          },
        ],
      };

      const encoded = serializeEntries(data);
      const decoded = deserializeEntries(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.title).toBe(data.title);
      expect(decoded?.entries[0].clue).toBe(data.entries[0].clue);
    });

    it('should return null for invalid hash', () => {
      const decoded = deserializeEntries('invalid-hash');
      expect(decoded).toBeNull();
    });

    it('should return null for hash with wrong prefix', () => {
      const decoded = deserializeEntries('Zabc123def456');
      expect(decoded).toBeNull();
    });

    it('should compress better than plain JSON', () => {
      const data = {
        title: 'Compression Test',
        entries: [
          { clue: 'Question 1', answer: 'ANSWER1' },
          { clue: 'Question 2', answer: 'ANSWER2' },
          { clue: 'Question 3', answer: 'ANSWER3' },
          { clue: 'Question 4', answer: 'ANSWER4' },
          { clue: 'Question 5', answer: 'ANSWER5' },
        ],
      };

      const encoded = serializeEntries(data);
      const plainJson = btoa(JSON.stringify(data));

      // Compressed version should be shorter
      expect(encoded.length).toBeLessThan(plainJson.length);
    });

    it('should handle 12 entries (berufe.json size)', () => {
      const data = {
        title: 'Berufe',
        entries: [
          { clue: 'Medizinischer Beruf', answer: 'ARZT' },
          { clue: 'Unterrichtet Schüler', answer: 'LEHRER' },
          { clue: 'Backt Brot', answer: 'BAECKER' },
          { clue: 'Baut Häuser', answer: 'ARCHITEKT' },
          { clue: 'Verkauft Waren', answer: 'VERKAEUFER' },
          { clue: 'Repariert Autos', answer: 'MECHANIKER' },
          { clue: 'Schreibt Code', answer: 'PROGRAMMIERER' },
          { clue: 'Fliegt Flugzeuge', answer: 'PILOT' },
          { clue: 'Kocht Essen', answer: 'KOCH' },
          { clue: 'Malt Bilder', answer: 'MALER' },
          { clue: 'Spielt Musik', answer: 'MUSIKER' },
          { clue: 'Entwirft Mode', answer: 'DESIGNER' },
        ],
      };

      const encoded = serializeEntries(data);
      const decoded = deserializeEntries(encoded);

      expect(decoded).not.toBeNull();
      expect(decoded?.entries).toHaveLength(12);
      expect(decoded?.entries[0].answer).toBe('ARZT');
      expect(decoded?.entries[11].answer).toBe('DESIGNER');
    });
  });
});
