import { describe, it, expect } from 'vitest'
import { normalizeWordEntry, WordEntry } from '../../models/WordEntry'

describe('WordEntry', () => {
  describe('normalizeWordEntry', () => {
    it('should convert to uppercase', () => {
      const entry: WordEntry = { clue: 'Test', answer: 'hund' }
      const result = normalizeWordEntry(entry)
      expect(result.answer).toBe('HUND')
    })

    it('should replace German umlauts', () => {
      const entry: WordEntry = { clue: 'Test', answer: 'Bär' }
      const result = normalizeWordEntry(entry)
      expect(result.answer).toBe('BAER')
    })

    it('should replace ö with OE', () => {
      const entry: WordEntry = { clue: 'Test', answer: 'schön' }
      const result = normalizeWordEntry(entry)
      expect(result.answer).toBe('SCHOEN')
    })

    it('should replace ü with UE', () => {
      const entry: WordEntry = { clue: 'Test', answer: 'Tür' }
      const result = normalizeWordEntry(entry)
      expect(result.answer).toBe('TUER')
    })

    it('should replace ß with SS', () => {
      const entry: WordEntry = { clue: 'Test', answer: 'Straße' }
      const result = normalizeWordEntry(entry)
      expect(result.answer).toBe('STRASSE')
    })

    it('should remove spaces and special characters', () => {
      const entry: WordEntry = { clue: 'Test', answer: 'New York!' }
      const result = normalizeWordEntry(entry)
      expect(result.answer).toBe('NEWYORK')
    })

    it('should preserve the clue', () => {
      const entry: WordEntry = { clue: 'A test question', answer: 'answer' }
      const result = normalizeWordEntry(entry)
      expect(result.clue).toBe('A test question')
    })

    it('should handle empty strings', () => {
      const entry: WordEntry = { clue: '', answer: '' }
      const result = normalizeWordEntry(entry)
      expect(result.answer).toBe('')
    })

    it('should handle multiple umlauts', () => {
      const entry: WordEntry = { clue: 'Test', answer: 'Äpfel Öl Übung' }
      const result = normalizeWordEntry(entry)
      expect(result.answer).toBe('AEPFELOELUEBUNG')
    })
  })
})
