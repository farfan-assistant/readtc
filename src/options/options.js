// Read T&C — Options page

(function () {
  'use strict';

  const apiKeyInput = document.getElementById('apiKey');
  const modelSelect = document.getElementById('model');
  const baseUrlInput = document.getElementById('baseUrl');
  const saveBtn = document.getElementById('saveBtn');
  const savedMsg = document.getElementById('savedMsg');

  // Load saved settings
  chrome.storage.sync.get({
    apiKey: '',
    model: 'gpt-4o-mini',
    baseUrl: 'https://api.openai.com/v1',
  }, (items) => {
    apiKeyInput.value = items.apiKey;
    modelSelect.value = items.model;
    baseUrlInput.value = items.baseUrl;
  });

  // Save
  saveBtn.addEventListener('click', () => {
    const settings = {
      apiKey: apiKeyInput.value.trim(),
      model: modelSelect.value,
      baseUrl: baseUrlInput.value.trim() || 'https://api.openai.com/v1',
    };

    chrome.storage.sync.set(settings, () => {
      savedMsg.classList.add('show');
      setTimeout(() => savedMsg.classList.remove('show'), 3000);
    });
  });
})();
