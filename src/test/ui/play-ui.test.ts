import { describe, it, expect, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'
import * as fs from 'fs'
import * as path from 'path'

describe('Play Page UI Tests', () => {
  let dom: JSDOM
  let document: Document
  let window: Window

  beforeEach(() => {
    // Load the actual play.html file
    const html = fs.readFileSync(
      path.resolve(__dirname, '../../../play.html'),
      'utf-8'
    )

    dom = new JSDOM(html, {
      url: 'http://localhost:3000/play.html',
      runScripts: 'dangerously',
      resources: 'usable',
    })

    document = dom.window.document
    window = dom.window as unknown as Window
  })

  describe('Page Structure', () => {
    it('should have play container', () => {
      const playContainer = document.querySelector('.play-container')
      expect(playContainer).toBeTruthy()
    })

    it('should have puzzle title element', () => {
      const title = document.getElementById('puzzle-title')
      expect(title).toBeTruthy()
    })

    it('should have grid container', () => {
      const gridContainer = document.getElementById('game-grid-container')
      expect(gridContainer).toBeTruthy()
    })

    it('should have clues section', () => {
      const cluesSection = document.querySelector('.clues-section')
      expect(cluesSection).toBeTruthy()
    })

    it('should have back link', () => {
      const backLink = document.querySelector('.back-link')
      expect(backLink).toBeTruthy()
      expect(backLink?.tagName).toBe('A')
    })
  })

  describe('Header Elements', () => {
    it('should have play header', () => {
      const header = document.querySelector('.play-header')
      expect(header).toBeTruthy()
    })

    it('should have puzzle title in header', () => {
      const title = document.getElementById('puzzle-title')
      expect(title).toBeTruthy()
      expect(title?.tagName).toBe('H1')
    })

    it('should have check button in header', () => {
      const checkButton = document.getElementById('check-btn')
      expect(checkButton).toBeTruthy()
    })
  })

  describe('Game Controls', () => {
    it('should have check button', () => {
      const checkButton = document.getElementById('check-btn')
      expect(checkButton).toBeTruthy()
      expect(checkButton?.textContent).toContain('prüfen')
    })

    it('should have reveal button', () => {
      const revealButton = document.getElementById('reveal-btn')
      expect(revealButton).toBeTruthy()
      expect(revealButton?.textContent).toContain('zeigen')
    })

    it('should have clear button', () => {
      const clearButton = document.getElementById('clear-btn')
      expect(clearButton).toBeTruthy()
      expect(clearButton?.textContent).toContain('Löschen')
    })
  })

  describe('Clues Display', () => {
    it('should have across clues container', () => {
      const acrossClues = document.getElementById('play-across-clues')
      expect(acrossClues).toBeTruthy()
    })

    it('should have down clues container', () => {
      const downClues = document.getElementById('play-down-clues')
      expect(downClues).toBeTruthy()
    })

    it('should have clues section with columns', () => {
      const cluesColumns = document.querySelectorAll('.clues-column')
      expect(cluesColumns.length).toBe(2)
    })

    it('should have headings for clue sections', () => {
      const headings = document.querySelectorAll('.clues-column h3')
      expect(headings.length).toBe(2)
    })
  })

  describe('Controls Section', () => {
    it('should have controls container', () => {
      const controls = document.querySelector('.controls')
      expect(controls).toBeTruthy()
    })

    it('should have clear and reveal buttons in controls', () => {
      const controls = document.querySelector('.controls')
      const buttons = controls?.querySelectorAll('button')
      expect(buttons?.length).toBe(2)
    })
  })

  describe('Layout Structure', () => {
    it('should have play container wrapper', () => {
      const container = document.querySelector('.play-container')
      expect(container).toBeTruthy()
    })

    it('should have play content area', () => {
      const content = document.querySelector('.play-content')
      expect(content).toBeTruthy()
    })

    it('should have grid section', () => {
      const gridSection = document.querySelector('.grid-section')
      expect(gridSection).toBeTruthy()
    })
  })

  describe('Result Message', () => {
    it('should have result message container', () => {
      const resultMessage = document.getElementById('result-message')
      expect(resultMessage).toBeTruthy()
    })

    it('should have result-message class', () => {
      const resultMessage = document.getElementById('result-message')
      expect(resultMessage?.classList.contains('result-message')).toBe(true)
    })
  })

  describe('Accessibility', () => {
    it('should have back link with href', () => {
      const backLink = document.querySelector('.back-link') as HTMLAnchorElement
      expect(backLink).toBeTruthy()
      expect(backLink.href).toBeTruthy()
    })

    it('should have buttons with text content', () => {
      const buttons = document.querySelectorAll('button')
      buttons.forEach((button) => {
        expect(button.textContent?.trim().length).toBeGreaterThan(0)
      })
    })

    it('should have meaningful button labels', () => {
      const checkBtn = document.getElementById('check-btn')
      const clearBtn = document.getElementById('clear-btn')
      const revealBtn = document.getElementById('reveal-btn')

      expect(checkBtn?.textContent).toBeTruthy()
      expect(clearBtn?.textContent).toBeTruthy()
      expect(revealBtn?.textContent).toBeTruthy()
    })
  })

  describe('Grid Container', () => {
    it('should have game grid container', () => {
      const gridContainer = document.getElementById('game-grid-container')
      expect(gridContainer).toBeTruthy()
    })

    it('should be in grid section', () => {
      const gridSection = document.querySelector('.grid-section')
      const gridContainer = gridSection?.querySelector('#game-grid-container')
      expect(gridContainer).toBeTruthy()
    })
  })

  describe('Clues Lists', () => {
    it('should have clues list class on across clues', () => {
      const acrossClues = document.getElementById('play-across-clues')
      expect(acrossClues?.classList.contains('clues-list')).toBe(true)
    })

    it('should have clues list class on down clues', () => {
      const downClues = document.getElementById('play-down-clues')
      expect(downClues?.classList.contains('clues-list')).toBe(true)
    })
  })

  describe('Navigation', () => {
    it('should have back link pointing to root', () => {
      const backLink = document.querySelector('.back-link') as HTMLAnchorElement
      expect(backLink.href).toContain('/')
    })

    it('should have back arrow in link text', () => {
      const backLink = document.querySelector('.back-link')
      expect(backLink?.textContent).toContain('←')
    })
  })
})
