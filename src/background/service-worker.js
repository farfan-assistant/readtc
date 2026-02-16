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
