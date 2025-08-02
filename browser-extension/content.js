// PinkSync Content Script - Accessibility Overlay
class PinkSyncOverlay {
  constructor() {
    this.settings = {
      highContrast: false,
      fontSize: 16,
      reducedMotion: false,
      focusIndicators: true,
      signLanguageOverlay: false,
    }

    this.overlayElement = null
    this.signLanguageWidget = null

    this.init()
  }

  async init() {
    await this.loadSettings()
    this.createOverlay()
    this.applySettings()
    this.setupMessageListener()
    this.injectAccessibilityEnhancements()

    console.log("🌈 PinkSync Accessibility Overlay activated")
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get("pinkSyncSettings")
      if (result.pinkSyncSettings) {
        this.settings = { ...this.settings, ...result.pinkSyncSettings }
      }
    } catch (error) {
      console.error("Failed to load settings:", error)
    }
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.type === "APPLY_SETTINGS") {
        this.settings = message.settings
        this.applySettings()
        sendResponse({ success: true })
      }
    })
  }

  createOverlay() {
    // Create main overlay container
    this.overlayElement = document.createElement("div")
    this.overlayElement.id = "pinksync-overlay"
    this.overlayElement.innerHTML = `
      <div class="pinksync-overlay-content">
        <div class="pinksync-header">
          <div class="pinksync-logo">✨</div>
          <span class="pinksync-title">PinkSync Active</span>
          <button class="pinksync-close" id="pinksync-close">×</button>
        </div>
        <div class="pinksync-controls">
          <button class="pinksync-btn" id="pinksync-translate">
            🤟 Translate Page
          </button>
          <button class="pinksync-btn" id="pinksync-interpreter">
            👥 Find Interpreter
          </button>
          <button class="pinksync-btn" id="pinksync-accessibility">
            ♿ Accessibility Scan
          </button>
        </div>
        <div class="pinksync-status">
          Ready to assist
        </div>
      </div>
    `

    // Add overlay to page
    document.body.appendChild(this.overlayElement)

    // Setup event listeners
    document.getElementById("pinksync-close").addEventListener("click", () => {
      this.overlayElement.style.display = "none"
    })

    document.getElementById("pinksync-translate").addEventListener("click", () => {
      this.translatePage()
    })

    document.getElementById("pinksync-interpreter").addEventListener("click", () => {
      this.findInterpreter()
    })

    document.getElementById("pinksync-accessibility").addEventListener("click", () => {
      this.scanAccessibility()
    })
  }

  applySettings() {
    const root = document.documentElement

    // Apply high contrast
    if (this.settings.highContrast) {
      root.classList.add("pinksync-high-contrast")
    } else {
      root.classList.remove("pinksync-high-contrast")
    }

    // Apply font size
    root.style.setProperty("--pinksync-font-size", `${this.settings.fontSize}px`)

    // Apply reduced motion
    if (this.settings.reducedMotion) {
      root.classList.add("pinksync-reduced-motion")
    } else {
      root.classList.remove("pinksync-reduced-motion")
    }

    // Apply focus indicators
    if (this.settings.focusIndicators) {
      root.classList.add("pinksync-enhanced-focus")
    } else {
      root.classList.remove("pinksync-enhanced-focus")
    }

    // Show/hide sign language overlay
    if (this.settings.signLanguageOverlay) {
      this.showSignLanguageWidget()
    } else {
      this.hideSignLanguageWidget()
    }
  }

  injectAccessibilityEnhancements() {
    // Add ARIA labels to elements missing them
    const buttons = document.querySelectorAll("button:not([aria-label]):not([aria-labelledby])")
    buttons.forEach((button) => {
      if (!button.textContent.trim()) {
        button.setAttribute("aria-label", "Button")
      }
    })

    // Add alt text to images missing it
    const images = document.querySelectorAll("img:not([alt])")
    images.forEach((img) => {
      img.setAttribute("alt", "Image")
    })

    // Enhance form labels
    const inputs = document.querySelectorAll("input:not([aria-label]):not([aria-labelledby])")
    inputs.forEach((input) => {
      const label = document.querySelector(`label[for="${input.id}"]`)
      if (!label && input.placeholder) {
        input.setAttribute("aria-label", input.placeholder)
      }
    })

    // Add skip links if not present
    if (!document.querySelector('[href="#main"], [href="#content"]')) {
      this.addSkipLink()
    }
  }

  addSkipLink() {
    const skipLink = document.createElement("a")
    skipLink.href = "#main"
    skipLink.textContent = "Skip to main content"
    skipLink.className = "pinksync-skip-link"
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #FF1CCB;
      color: white;
      padding: 8px;
      text-decoration: none;
      border-radius: 4px;
      z-index: 10000;
      transition: top 0.3s;
    `

    skipLink.addEventListener("focus", () => {
      skipLink.style.top = "6px"
    })

    skipLink.addEventListener("blur", () => {
      skipLink.style.top = "-40px"
    })

    document.body.insertBefore(skipLink, document.body.firstChild)
  }

  showSignLanguageWidget() {
    if (this.signLanguageWidget) return

    this.signLanguageWidget = document.createElement("div")
    this.signLanguageWidget.id = "pinksync-sign-widget"
    this.signLanguageWidget.innerHTML = `
      <div class="pinksync-widget-content">
        <div class="pinksync-widget-header">
          <span>🤟 Sign Language</span>
          <button class="pinksync-widget-close">×</button>
        </div>
        <div class="pinksync-widget-body">
          <button class="pinksync-widget-btn" id="start-translation">
            Start Translation
          </button>
          <div class="pinksync-translation-result" id="translation-result" style="display: none;">
            <div class="translation-text"></div>
            <div class="translation-confidence"></div>
          </div>
        </div>
      </div>
    `

    document.body.appendChild(this.signLanguageWidget)

    // Setup widget event listeners
    this.signLanguageWidget.querySelector(".pinksync-widget-close").addEventListener("click", () => {
      this.hideSignLanguageWidget()
    })

    document.getElementById("start-translation").addEventListener("click", () => {
      this.startSignLanguageTranslation()
    })
  }

  hideSignLanguageWidget() {
    if (this.signLanguageWidget) {
      this.signLanguageWidget.remove()
      this.signLanguageWidget = null
    }
  }

  async translatePage() {
    const status = this.overlayElement.querySelector(".pinksync-status")
    status.textContent = "Analyzing page for translation..."

    try {
      // Extract text content from page
      const textContent = document.body.innerText

      // Send to PinkSync API for translation
      const response = await fetch("https://api.pinksync.io/api/translation/text-to-sign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          text_input: textContent.substring(0, 1000), // Limit for demo
          target_language: "ASL",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        status.textContent = "Page translated! Check sign language widget."
        this.showTranslationResult(result)
      } else {
        status.textContent = "Translation failed. Please try again."
      }
    } catch (error) {
      status.textContent = "Translation service unavailable."
      console.error("Translation error:", error)
    }
  }

  async findInterpreter() {
    const status = this.overlayElement.querySelector(".pinksync-status")
    status.textContent = "Finding interpreters..."

    try {
      const response = await fetch("https://api.pinksync.io/api/interpreters/find", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${await this.getAuthToken()}`,
        },
        body: JSON.stringify({
          service_type: "web_browsing",
          duration: 30,
          location: "remote",
        }),
      })

      if (response.ok) {
        const result = await response.json()
        status.textContent = `Found ${result.matches.length} available interpreters`
        this.showInterpreterMatches(result.matches)
      } else {
        status.textContent = "No interpreters available right now."
      }
    } catch (error) {
      status.textContent = "Interpreter service unavailable."
      console.error("Interpreter error:", error)
    }
  }

  async scanAccessibility() {
    const status = this.overlayElement.querySelector(".pinksync-status")
    status.textContent = "Scanning page accessibility..."

    try {
      // Perform basic accessibility scan
      const issues = this.performAccessibilityScan()

      status.textContent = `Found ${issues.length} accessibility issues`
      this.showAccessibilityResults(issues)
    } catch (error) {
      status.textContent = "Accessibility scan failed."
      console.error("Accessibility scan error:", error)
    }
  }

  performAccessibilityScan() {
    const issues = []

    // Check for missing alt text
    const imagesWithoutAlt = document.querySelectorAll('img:not([alt]), img[alt=""]')
    if (imagesWithoutAlt.length > 0) {
      issues.push({
        type: "missing_alt_text",
        count: imagesWithoutAlt.length,
        description: "Images missing alt text",
      })
    }

    // Check for missing form labels
    const inputsWithoutLabels = document.querySelectorAll("input:not([aria-label]):not([aria-labelledby])")
    const unlabeledInputs = Array.from(inputsWithoutLabels).filter((input) => {
      return !document.querySelector(`label[for="${input.id}"]`)
    })

    if (unlabeledInputs.length > 0) {
      issues.push({
        type: "missing_form_labels",
        count: unlabeledInputs.length,
        description: "Form inputs missing labels",
      })
    }

    // Check for low contrast (simplified check)
    const elements = document.querySelectorAll("*")
    let lowContrastCount = 0

    elements.forEach((el) => {
      const styles = window.getComputedStyle(el)
      const color = styles.color
      const backgroundColor = styles.backgroundColor

      // Simplified contrast check (would need proper color contrast calculation in production)
      if (color === backgroundColor) {
        lowContrastCount++
      }
    })

    if (lowContrastCount > 0) {
      issues.push({
        type: "low_contrast",
        count: lowContrastCount,
        description: "Elements with potential contrast issues",
      })
    }

    return issues
  }

  async getAuthToken() {
    try {
      const result = await chrome.storage.local.get("pinkSyncToken")
      return result.pinkSyncToken || null
    } catch (error) {
      return null
    }
  }

  showTranslationResult(result) {
    // Implementation for showing translation results
    console.log("Translation result:", result)
  }

  showInterpreterMatches(matches) {
    // Implementation for showing interpreter matches
    console.log("Interpreter matches:", matches)
  }

  showAccessibilityResults(issues) {
    // Implementation for showing accessibility scan results
    console.log("Accessibility issues:", issues)
  }
}

// Initialize overlay when page loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new PinkSyncOverlay()
  })
} else {
  new PinkSyncOverlay()
}
</merged_code>
