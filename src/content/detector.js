// Content script: detects T&C / Privacy Policy pages and extracts text

(function () {
  'use strict';

  const TC_KEYWORDS = [
    'terms of service', 'terms and conditions', 'terms of use',
    'privacy policy', 'cookie policy', 'user agreement',
    'end user license agreement', 'eula', 'acceptable use policy',
    'data processing agreement', 'legal notice', 'disclaimer',
    'refund policy', 'cancellation policy', 'subscriber agreement'
  ];

  function isLegalPage() {
    const title = document.title.toLowerCase();
    const url = window.location.href.toLowerCase();
    const h1 = document.querySelector('h1');
    const h1Text = h1 ? h1.textContent.toLowerCase() : '';

    const textsToCheck = [title, url, h1Text];

    for (const text of textsToCheck) {
      for (const keyword of TC_KEYWORDS) {
        if (text.includes(keyword)) return true;
      }
    }

    // Check meta tags
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      const content = metaDesc.getAttribute('content')?.toLowerCase() || '';
      for (const keyword of TC_KEYWORDS) {
        if (content.includes(keyword)) return true;
      }
    }

    return false;
  }

  function extractPageText() {
    // Try to get the main content area first
    const selectors = [
      'main', 'article', '[role="main"]',
      '.content', '.main-content', '#content', '#main',
      '.terms', '.privacy', '.legal', '.policy',
      '.entry-content', '.post-content', '.page-content'
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el && el.textContent.trim().length > 500) {
        return cleanText(el.textContent);
      }
    }

    // Fallback: get body text, excluding nav/footer/header/sidebar
    const body = document.body.cloneNode(true);
    const removeSelectors = ['nav', 'header', 'footer', 'aside', '.sidebar', '.menu', '.navigation', 'script', 'style', 'noscript'];
    removeSelectors.forEach(sel => {
      body.querySelectorAll(sel).forEach(el => el.remove());
    });

    return cleanText(body.textContent);
  }

  function cleanText(text) {
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
      .substring(0, 100000); // Cap at 100k chars
  }

  // Listen for messages from popup
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'checkPage') {
      sendResponse({
        isLegal: isLegalPage(),
        url: window.location.href,
        title: document.title
      });
    }

    if (request.action === 'extractText') {
      const text = extractPageText();
      sendResponse({
        text: text,
        url: window.location.href,
        title: document.title,
        charCount: text.length
      });
    }

    return true; // Keep message channel open for async response
  });

  // Notify background script if this looks like a legal page
  if (isLegalPage()) {
    chrome.runtime.sendMessage({
      action: 'legalPageDetected',
      url: window.location.href,
      title: document.title
    });
  }
})();
