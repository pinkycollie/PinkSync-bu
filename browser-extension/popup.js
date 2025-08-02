// PinkSync Browser Extension Popup
class PinkSyncPopup {
  constructor() {
    this.settings = {
      highContrast: false,
      fontSize: 16,
      reducedMotion: false,
      focusIndicators: true,
      signLanguageOverlay: false,
    }

    this.init()
  }

  async init() {
    await this.loadSettings()
    this.setupEventListeners()
    this.updateUI()
    this.checkConnectionStatus()
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

  async saveSettings() {
    try {
      await chrome.storage.sync.set({ pinkSyncSettings: this.settings })

      // Send message to content script to apply settings
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
      if (tab) {
        chrome.tabs.sendMessage(tab.id, {
          type: "APPLY_SETTINGS",
          settings: this.settings,
        })
      }
    } catch (error) {
      console.error("Failed to save settings:", error)
    }
  }

  setupEventListeners() {
    // Toggle switches
    const switches = ["highContrast", "reducedMotion", "focusIndicators", "signLanguageOverlay"]
    switches.forEach((switchId) => {
      const element = document.getElementById(switchId)
      element.addEventListener("click", () => {
        this.settings[switchId] = !this.settings[switchId]
        this.updateUI()
        this.saveSettings()
      })
    })

    // Font size slider
    const fontSizeSlider = document.getElementById("fontSize")
    const fontSizeValue = document.getElementById("fontSizeValue")

    fontSizeSlider.addEventListener("input", (e) => {
      this.settings.fontSize = Number.parseInt(e.target.value)
      fontSizeValue.textContent = `${this.settings.fontSize}px`
      this.saveSettings()
    })

    // Reset button
    document.getElementById("resetBtn").addEventListener("click", () => {
      this.resetSettings()
    })

    // Dashboard button
    document.getElementById("dashboardBtn").addEventListener("click", () => {
      chrome.tabs.create({ url: "https://pinksync.io/dashboard" })
    })
  }

  updateUI() {
    // Update toggle switches
    const switches = ["highContrast", "reducedMotion", "focusIndicators", "signLanguageOverlay"]
    switches.forEach((switchId) => {
      const element = document.getElementById(switchId)
      if (this.settings[switchId]) {
        element.classList.add("active")
      } else {
        element.classList.remove("active")
      }
    })

    // Update font size
    document.getElementById("fontSize").value = this.settings.fontSize
    document.getElementById("fontSizeValue").textContent = `${this.settings.fontSize}px`
  }

  async checkConnectionStatus() {
    const statusElement = document.getElementById("status")
    const statusText = document.getElementById("statusText")

    try {
      // Check if user is logged in to PinkSync
      const result = await chrome.storage.local.get("pinkSyncToken")

      if (result.pinkSyncToken) {
        // Verify token with API
        const response = await fetch("https://api.pinksync.io/api/auth/verify", {
          headers: {
            Authorization: `Bearer ${result.pinkSyncToken}`,
          },
        })

        if (response.ok) {
          statusElement.className = "status connected"
          statusText.textContent = "✅ Connected to PinkSync"
        } else {
          statusElement.className = "status disconnected"
          statusText.textContent = "❌ Authentication expired"
        }
      } else {
        statusElement.className = "status disconnected"
        statusText.textContent = "⚠️ Not logged in to PinkSync"
      }
    } catch (error) {
      statusElement.className = "status disconnected"
      statusText.textContent = "❌ Connection failed"
    }
  }

  resetSettings() {
    this.settings = {
      highContrast: false,
      fontSize: 16,
      reducedMotion: false,
      focusIndicators: true,
      signLanguageOverlay: false,
    }

    this.updateUI()
    this.saveSettings()
  }
}

// Initialize popup when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new PinkSyncPopup()
})
</merged_code>
