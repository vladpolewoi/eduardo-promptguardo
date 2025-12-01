// This script runs in the main world (page context)
console.log('[INJECT] Starting fetch override');

const originalFetch = window.fetch;

window.fetch = async (...args) => {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || args[0]?.href;

  if (url && url.includes('/conversation')) {
    console.log('[INJECT] 🎉 ChatGPT API call!');
    const body = args[1]?.body;
    
    // Send to content script via postMessage (can't use chrome APIs here)
    window.postMessage(
      {
        type: 'CHATGPT_REQUEST',
        payload: { url, body },
      },
      '*'
    );
  }

  return originalFetch.apply(this, args);
};

console.log('[INJECT] Fetch override complete');

