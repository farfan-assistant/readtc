// Content script companion: handles selected text for context menu analysis

(function () {
  'use strict';

  // Listen for context menu analysis request
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'getSelectedText') {
      const selection = window.getSelection();
      const text = selection ? selection.toString().trim() : '';
      sendResponse({
        text: text,
        url: window.location.href,
        title: document.title,
        charCount: text.length,
        isSelection: true,
      });
    }
    return true;
  });
})();
