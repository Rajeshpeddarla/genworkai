// GenWorkAI Background Script

chrome.action.onClicked.addListener((tab) => {
  if (!tab.id) return;

  // Use callback API (not async/await) to correctly detect missing content script
  chrome.tabs.sendMessage(tab.id, { action: 'toggle_sidebar' }, () => {
    if (chrome.runtime.lastError) {
      // Content script not loaded — inject it, then open
      chrome.scripting.executeScript({
        target: { tabId: tab.id! },
        files: ['content.js'],
      }).then(() => {
        setTimeout(() => {
          chrome.tabs.sendMessage(tab.id!, { action: 'toggle_sidebar' }, () => {
            void chrome.runtime.lastError; // suppress error
          });
        }, 150);
      }).catch(console.error);
    }
  });
});
