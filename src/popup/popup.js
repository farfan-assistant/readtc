// Read T&C — Popup Logic

(function () {
  'use strict';

  // DOM refs
  const states = {
    noKey: document.getElementById('state-no-key'),
    idle: document.getElementById('state-idle'),
    loading: document.getElementById('state-loading'),
    result: document.getElementById('state-result'),
    error: document.getElementById('state-error'),
  };

  const els = {
    settingsBtn: document.getElementById('settingsBtn'),
    openSettings: document.getElementById('openSettings'),
    analyzeBtn: document.getElementById('analyzeBtn'),
    reanalyzeBtn: document.getElementById('reanalyzeBtn'),
    copyBtn: document.getElementById('copyBtn'),
    retryBtn: document.getElementById('retryBtn'),
    pageTitle: document.getElementById('pageTitle'),
    pageUrl: document.getElementById('pageUrl'),
    detectionHint: document.getElementById('detectionHint'),
    loadingStatus: document.getElementById('loadingStatus'),
    riskBadge: document.getElementById('riskBadge'),
    resultTitle: document.getElementById('resultTitle'),
    summaryText: document.getElementById('summaryText'),
    redFlagsList: document.getElementById('redFlagsList'),
    redFlagsSection: document.getElementById('redFlagsSection'),
    keyPointsGrid: document.getElementById('keyPointsGrid'),
    keyPointsSection: document.getElementById('keyPointsSection'),
    rightsList: document.getElementById('rightsList'),
    rightsSection: document.getElementById('rightsSection'),
    dataList: document.getElementById('dataList'),
    dataSection: document.getElementById('dataSection'),
    costsList: document.getElementById('costsList'),
    costsSection: document.getElementById('costsSection'),
    errorMessage: document.getElementById('errorMessage'),
  };

  let lastResult = null;

  // State management
  function showState(name) {
    Object.values(states).forEach(s => s.classList.add('hidden'));
    states[name].classList.remove('hidden');
  }

  // Initialize
  async function init() {
    const { apiKey } = await chrome.storage.sync.get('apiKey');

    if (!apiKey) {
      showState('noKey');
      return;
    }

    // Get current tab info
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab) {
      showState('error');
      els.errorMessage.textContent = 'No active tab found.';
      return;
    }

    els.pageTitle.textContent = tab.title || 'Untitled';
    els.pageUrl.textContent = new URL(tab.url).hostname;

    // Check if this looks like a legal page
    try {
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'checkPage' });
      if (response?.isLegal) {
        els.detectionHint.textContent = '🟢 Legal document detected on this page';
      } else {
        els.detectionHint.textContent = 'Click to analyze any page with legal text';
      }
    } catch {
      els.detectionHint.textContent = 'Click to analyze this page';
    }

    showState('idle');
  }

  // Analyze the page
  async function analyze() {
    showState('loading');
    els.loadingStatus.textContent = 'Extracting text...';

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      // Extract text from page
      let pageData;
      try {
        pageData = await chrome.tabs.sendMessage(tab.id, { action: 'extractText' });
      } catch {
        // Content script not loaded — inject it
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['src/content/detector.js'],
        });
        pageData = await chrome.tabs.sendMessage(tab.id, { action: 'extractText' });
      }

      if (!pageData?.text || pageData.text.length < 100) {
        throw new Error('Could not extract enough text from this page. Try a page with Terms & Conditions or a Privacy Policy.');
      }

      els.loadingStatus.textContent = `Analyzing ${Math.round(pageData.charCount / 1000)}k characters...`;

      // Call OpenAI
      const { apiKey, model, baseUrl } = await chrome.storage.sync.get({
        apiKey: '',
        model: 'gpt-4o-mini',
        baseUrl: 'https://api.openai.com/v1',
      });

      const truncatedText = pageData.text.substring(0, 60000);

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: SYSTEM_PROMPT,
            },
            {
              role: 'user',
              content: `Analyze this legal document from ${pageData.url}:\n\nTitle: ${pageData.title || 'Unknown'}\n\n${truncatedText}`,
            },
          ],
          temperature: 0.3,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      lastResult = result;
      renderResult(result, pageData.title);
    } catch (err) {
      showState('error');
      els.errorMessage.textContent = err.message;
    }
  }

  // Render analysis result
  function renderResult(result, title) {
    showState('result');

    // Risk badge
    const risk = (result.risk_level || 'medium').toLowerCase();
    els.riskBadge.textContent = risk === 'low' ? '✅ Low Risk' : risk === 'high' ? '🚨 High Risk' : '⚠️ Medium Risk';
    els.riskBadge.className = `risk-badge risk-${risk}`;

    els.resultTitle.textContent = result.document_type || title || 'Legal Document';

    // Summary
    els.summaryText.textContent = result.summary || 'No summary available.';

    // Red Flags
    renderList(els.redFlagsList, els.redFlagsSection, result.red_flags, 'red-flag');

    // Key Points
    if (result.key_points && Object.keys(result.key_points).length > 0) {
      els.keyPointsSection.classList.remove('hidden');
      els.keyPointsGrid.innerHTML = '';
      for (const [label, value] of Object.entries(result.key_points)) {
        const div = document.createElement('div');
        div.className = 'key-point';
        div.innerHTML = `<div class="label">${escapeHtml(label)}</div><div class="value">${escapeHtml(String(value))}</div>`;
        els.keyPointsGrid.appendChild(div);
      }
    } else {
      els.keyPointsSection.classList.add('hidden');
    }

    // Rights
    renderList(els.rightsList, els.rightsSection, result.your_rights);

    // Data & Privacy
    renderList(els.dataList, els.dataSection, result.data_privacy);

    // Costs
    renderList(els.costsList, els.costsSection, result.costs_cancellation);
  }

  function renderList(listEl, sectionEl, items, className) {
    if (items && items.length > 0) {
      sectionEl.classList.remove('hidden');
      listEl.innerHTML = '';
      items.forEach(item => {
        const li = document.createElement('li');
        if (className) li.className = className;
        li.textContent = item;
        listEl.appendChild(li);
      });
    } else {
      sectionEl.classList.add('hidden');
    }
  }

  function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // Copy result to clipboard
  function copyResult() {
    if (!lastResult) return;

    let text = `# ${lastResult.document_type || 'Legal Document Analysis'}\n`;
    text += `Risk Level: ${lastResult.risk_level || 'Unknown'}\n\n`;
    text += `## Summary\n${lastResult.summary}\n\n`;

    if (lastResult.red_flags?.length) {
      text += `## 🚩 Red Flags\n${lastResult.red_flags.map(f => `- ${f}`).join('\n')}\n\n`;
    }
    if (lastResult.your_rights?.length) {
      text += `## ⚖️ Your Rights\n${lastResult.your_rights.map(r => `- ${r}`).join('\n')}\n\n`;
    }
    if (lastResult.data_privacy?.length) {
      text += `## 🔒 Data & Privacy\n${lastResult.data_privacy.map(d => `- ${d}`).join('\n')}\n\n`;
    }
    if (lastResult.costs_cancellation?.length) {
      text += `## 💰 Costs & Cancellation\n${lastResult.costs_cancellation.map(c => `- ${c}`).join('\n')}\n\n`;
    }

    navigator.clipboard.writeText(text).then(() => {
      els.copyBtn.textContent = '✅ Copied!';
      setTimeout(() => { els.copyBtn.textContent = '📋 Copy'; }, 2000);
    });
  }

  // Event listeners
  els.settingsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage());
  els.openSettings.addEventListener('click', () => chrome.runtime.openOptionsPage());
  els.analyzeBtn.addEventListener('click', analyze);
  els.reanalyzeBtn.addEventListener('click', analyze);
  els.retryBtn.addEventListener('click', analyze);
  els.copyBtn.addEventListener('click', copyResult);

  // System prompt
  const SYSTEM_PROMPT = `You are a legal document analyzer. Your job is to read Terms & Conditions, Privacy Policies, and other legal documents, then provide a clear, concise summary that a normal person can understand.

Respond with a JSON object containing:

{
  "document_type": "string — e.g. 'Terms of Service', 'Privacy Policy', 'EULA'",
  "risk_level": "low | medium | high",
  "summary": "2-3 sentence plain-English summary of what this document says",
  "red_flags": ["array of concerning clauses — things users should worry about"],
  "key_points": {
    "Data Collected": "what data they collect",
    "Data Shared With": "who they share with",
    "Account Deletion": "how to delete your account",
    "Governing Law": "jurisdiction"
  },
  "your_rights": ["array of rights you have under this agreement"],
  "data_privacy": ["array of key data/privacy points"],
  "costs_cancellation": ["array of cost, billing, refund, cancellation terms"]
}

Rules:
- Be specific and cite actual clauses when possible
- Use plain English, no legal jargon
- Red flags should be genuinely concerning (arbitration clauses, data selling, auto-renewal traps, liability waivers, etc.)
- If something is missing or unclear in the document, say so
- risk_level: "low" = standard/fair terms, "medium" = some concerning clauses, "high" = significant user-hostile terms
- Keep each bullet point to 1-2 sentences max
- If this doesn't appear to be a legal document, still analyze whatever is there and note it in the summary`;

  // Init
  init();
})();
