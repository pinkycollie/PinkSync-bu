class PinkSyncBackground {
  constructor() {
    this.init()
  }

  init() {
    this.setupInstallListener()
    this.setupTabUpdateListener()
    this.setupMessageListener()
    this.setupContextMenus()
  }

  setupInstallListener() {
    chrome.runtime.onInstalled.addListener((details) => {
      if (details.reason === "install") {
        // Set default settings
        chrome.storage.sync.set({
          pinkSyncSettings: {
            highContrast: false,
            fontSize: 16,
            reducedMotion: false,
            focusIndicators: true,
            signLanguageOverlay: false,
          },
        })

        // Open welcome page
        chrome.tabs.create({
          url: "https://pinksync.io/extension/welcome",
        })
      }
    })
  }

  setupTabUpdateListener() {
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (changeInfo.status === "complete" && tab.url) {
        // Inject content script if not already injected
        this.injectContentScript(tabId)
      }
    })
  }

  setupMessageListener() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      switch (message.type) {
        case "GET_AUTH_TOKEN":
          this.getAuthToken().then(sendResponse)
          return true

        case "SET_AUTH_TOKEN":
          this.setAuthToken(message.token).then(sendResponse)
          return true

        case "ANALYZE_PAGE":
          this.analyzePage(sender.tab.id).then(sendResponse)
          return true

        default:
          sendResponse({ error: "Unknown message type" })
      }
    })
  }

  setupContextMenus() {
    chrome.contextMenus.create({
      id: "pinksync-translate",
      title: "Translate with PinkSync",
      contexts: ["selection"],
    })

    chrome.contextMenus.create({
      id: "pinksync-accessibility",
      title: "Check Accessibility",
      contexts: ["page"],
    })

    chrome.contextMenus.onClicked.addListener((info, tab) => {
      switch (info.menuItemId) {
        case "pinksync-translate":
          this.translateSelection(tab.id, info.selectionText)
          break

        case "pinksync-accessibility":
          this.checkAccessibility(tab.id)
          break
      }
    })
  }

  async injectContentScript(tabId) {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: ["content.js"],
      })
    } catch (error) {
      console.error("Failed to inject content script:", error)
    }
  }

  async getAuthToken() {
    try {
      const result = await chrome.storage.local.get("pinkSyncToken")
      return { token: result.pinkSyncToken || null }
    } catch (error) {
      return { error: "Failed to get auth token" }
    }
  }

  async setAuthToken(token) {
    try {
      await chrome.storage.local.set({ pinkSyncToken: token })
      return { success: true }
    } catch (error) {
      return { error: "Failed to set auth token" }
    }
  }

  async translateSelection(tabId, text) {
    try {
      chrome.tabs.sendMessage(tabId, {
        type: "TRANSLATE_TEXT",
        text: text,
      })
    } catch (error) {
      console.error("Failed to translate selection:", error)
    }
  }

  async checkAccessibility(tabId) {
    try {
      chrome.tabs.sendMessage(tabId, {
        type: "CHECK_ACCESSIBILITY",
      })
    } catch (error) {
      console.error("Failed to check accessibility:", error)
    }
  }

  async analyzePage(tabId) {
    try {
      const result = await chrome.scripting.executeScript({
        target: { tabId },
        function: () => {
          return {
            title: document.title,
            url: window.location.href,
            textContent: document.body.innerText.substring(0, 5000),
            imageCount: document.querySelectorAll("img").length,
            formCount: document.querySelectorAll("form").length,
            headingCount: document.querySelectorAll("h1, h2, h3, h4, h5, h6").length,
          }
        },
      })

      return { pageData: result[0].result }
    } catch (error) {
      return { error: "Failed to analyze page" }
    }
  }
}

// Initialize background script
new PinkSyncBackground()
</merged_code>
