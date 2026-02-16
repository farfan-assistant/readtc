// Background service worker

// Set badge when a legal page is detected
chrome.runtime.onMessage.addListener((message, sender) => {
  if (message.action === 'legalPageDetected' && sender.tab) {
    chrome.action.setBadgeText({ text: 'T&C', tabId: sender.tab.id });
    chrome.action.setBadgeBackgroundColor({ color: '#ef4444', tabId: sender.tab.id });
  }
});

// Clear badge when navigating away
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading') {
    chrome.action.setBadgeText({ text: '', tabId });
  }
});

// Context menu: right-click → Analyze selected text
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'readtc-analyze-selection',
    title: '📜 Analyze selected text with Read T&C',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'readtc-analyze-selection' && info.selectionText) {
    // Store selection for popup to pick up
    await chrome.storage.session.set({
      pendingAnalysis: {
        text: info.selectionText,
        url: tab.url,
        title: tab.title,
        isSelection: true,
      },
    });
    // Open the popup (we can't programmatically open it, so open as a tab)
    chrome.tabs.create({
      url: chrome.runtime.getURL('src/popup/popup.html?selection=true'),
    });
  }
});

// Keyboard shortcut handler
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'analyze-page') {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      // Open popup
      chrome.action.openPopup();
    }
  }
});
