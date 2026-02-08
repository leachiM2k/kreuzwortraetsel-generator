import { describe, it, expect, beforeEach, vi } from 'vitest'
import { JSDOM } from 'jsdom'
import * as fs from 'fs'
import * as path from 'path'

describe('Generator UI Tests', () => {
  let dom: JSDOM
  let document: Document
  let window: Window

  beforeEach(() => {
    // Load the actual HTML file
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../../index.html'),
      'utf-8'
    )

    dom = new JSDOM(html, {
      url: 'http://localhost:3000',
      runScripts: 'dangerously',
      resources: 'usable',
    })

    document = dom.window.document
    window = dom.window as unknown as Window

    // Mock localStorage
    const localStorageMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    }
    Object.defineProperty(window, 'localStorage', {
      value: localStorageMock,
      writable: true,
    })
  })

  describe('Page Structure', () => {
    it('should have title input field', () => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput).toBeTruthy()
      expect(titleInput.tagName).toBe('INPUT')
    })

    it('should have add entry button', () => {
      const addButton = document.getElementById('add-entry-btn')
      expect(addButton).toBeTruthy()
      expect(addButton?.textContent).toContain('Eintrag hinzufügen')
    })

    it('should have preview button', () => {
      const previewButton = document.getElementById('preview-btn')
      expect(previewButton).toBeTruthy()
      expect(previewButton?.textContent).toContain('Vorschau')
    })

    it('should have entries container', () => {
      const container = document.getElementById('entries-container')
      expect(container).toBeTruthy()
    })

    it('should have preview container', () => {
      const preview = document.getElementById('preview-container')
      expect(preview).toBeTruthy()
    })

    it('should have AI prompt section', () => {
      const aiSection = document.getElementById('ai-prompt-section')
      expect(aiSection).toBeTruthy()
    })
  })

  describe('Button States', () => {
    it('should have preview button', () => {
      const previewButton = document.getElementById('preview-btn') as HTMLButtonElement
      expect(previewButton).toBeTruthy()
    })

    it('should have disabled generate button initially', () => {
      const generateButton = document.getElementById('generate-btn') as HTMLButtonElement
      expect(generateButton).toBeTruthy()
      expect(generateButton.disabled).toBe(true)
    })

    it('should have play button', () => {
      const playButton = document.getElementById('play-btn') as HTMLAnchorElement
      expect(playButton).toBeTruthy()
      expect(playButton.classList.contains('btn-disabled')).toBe(true)
    })
  })

  describe('Preview Section', () => {
    it('should have preview container', () => {
      const previewContainer = document.getElementById('preview-container')
      expect(previewContainer).toBeTruthy()
    })

    it('should have clues container', () => {
      const cluesContainer = document.getElementById('clues-container')
      expect(cluesContainer).toBeTruthy()
    })

    it('should have across clues section', () => {
      const acrossClues = document.getElementById('across-clues')
      expect(acrossClues).toBeTruthy()
    })

    it('should have down clues section', () => {
      const downClues = document.getElementById('down-clues')
      expect(downClues).toBeTruthy()
    })
  })

  describe('AI Prompt Feature', () => {
    it('should have AI prompt toggle button', () => {
      const toggleButton = document.getElementById('ai-prompt-btn')
      expect(toggleButton).toBeTruthy()
      expect(toggleButton?.textContent).toContain('AI-Prompt')
    })

    it('should have AI prompt section', () => {
      const aiSection = document.getElementById('ai-prompt-section')
      expect(aiSection).toBeTruthy()
    })

    it('should have close AI prompt button', () => {
      const closeButton = document.getElementById('close-ai-prompt')
      expect(closeButton).toBeTruthy()
    })

    it('should have prompt text area', () => {
      const promptText = document.getElementById('ai-prompt-text')
      expect(promptText).toBeTruthy()
    })

    it('should have copy prompt button', () => {
      const copyButton = document.getElementById('copy-prompt-btn')
      expect(copyButton).toBeTruthy()
      expect(copyButton?.textContent).toContain('Kopieren')
    })

    it('should have JSON input textarea', () => {
      const jsonInput = document.getElementById('json-input') as HTMLTextAreaElement
      expect(jsonInput).toBeTruthy()
      expect(jsonInput.tagName).toBe('TEXTAREA')
    })

    it('should have load JSON button', () => {
      const loadButton = document.getElementById('load-json-btn')
      expect(loadButton).toBeTruthy()
      expect(loadButton?.textContent).toContain('JSON laden')
    })
  })

  describe('Sample Data', () => {
    it('should have load sample button', () => {
      const sampleButton = document.getElementById('sample-btn')
      expect(sampleButton).toBeTruthy()
      expect(sampleButton?.textContent).toContain('Beispiel laden')
    })
  })

  describe('Action Buttons', () => {
    it('should have all main action buttons', () => {
      const buttons = [
        'add-entry-btn',
        'sample-btn',
        'preview-btn',
        'generate-btn',
        'play-btn',
        'ai-prompt-btn',
      ]

      buttons.forEach((buttonId) => {
        const button = document.getElementById(buttonId)
        expect(button).toBeTruthy()
      })
    })
  })

  describe('Form Inputs', () => {
    it('should have title input with correct type', () => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput.type).toBe('text')
    })

    it('should have placeholder text for title', () => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput.placeholder).toBeTruthy()
      expect(titleInput.placeholder.length).toBeGreaterThan(0)
    })

    it('should have default value for title', () => {
      const titleInput = document.getElementById('title') as HTMLInputElement
      expect(titleInput.value).toBe('Mein Kreuzworträtsel')
    })
  })

  describe('Layout Structure', () => {
    it('should have main container', () => {
      const container = document.querySelector('.container')
      expect(container).toBeTruthy()
    })

    it('should have header section', () => {
      const header = document.querySelector('header')
      expect(header).toBeTruthy()
    })

    it('should have main heading', () => {
      const heading = document.querySelector('h1')
      expect(heading).toBeTruthy()
      expect(heading?.textContent).toContain('Kreuzworträtsel')
    })

    it('should have input section', () => {
      const inputSection = document.querySelector('.input-section')
      expect(inputSection).toBeTruthy()
    })

    it('should have preview section', () => {
      const previewSection = document.querySelector('.preview-section')
      expect(previewSection).toBeTruthy()
    })

    it('should have footer', () => {
      const footer = document.querySelector('footer')
      expect(footer).toBeTruthy()
    })
  })

  describe('Error Messaging', () => {
    it('should have error message container', () => {
      const errorMessage = document.getElementById('error-message')
      expect(errorMessage).toBeTruthy()
    })
  })

  describe('Entries Section', () => {
    it('should have entries section', () => {
      const entriesSection = document.querySelector('.entries-section')
      expect(entriesSection).toBeTruthy()
    })

    it('should have entries header', () => {
      const entriesHeader = document.querySelector('.entries-header')
      expect(entriesHeader).toBeTruthy()
    })

    it('should have header buttons container', () => {
      const headerButtons = document.querySelector('.header-buttons')
      expect(headerButtons).toBeTruthy()
    })
  })

  describe('Actions Section', () => {
    it('should have actions container', () => {
      const actions = document.querySelector('.actions')
      expect(actions).toBeTruthy()
    })

    it('should have all action buttons in actions section', () => {
      const actions = document.querySelector('.actions')
      const buttons = actions?.querySelectorAll('button, a')
      expect(buttons?.length).toBeGreaterThanOrEqual(3)
    })
  })
})
