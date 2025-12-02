// This script runs in the main world (page context)
console.log('[INJECT] Starting fetch override');

const originalFetch = window.fetch;
let requestId = 0;
const pendingRequests = new Map();

// Listen for responses from content script
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'ANONYMIZATION_RESPONSE') {
    const resolver = pendingRequests.get(event.data.requestId);
    if (resolver) {
      resolver(event.data.anonymizedBody);
      pendingRequests.delete(event.data.requestId);
    }
  }
});

window.fetch = async (...args) => {
  const url = typeof args[0] === 'string' ? args[0] : args[0]?.url || args[0]?.href;

  if (url && url.includes('/conversation')) {
    console.log('[INJECT] 🎉 ChatGPT API call!');
    const body = args[1]?.body;

    const currentRequestId = requestId++;

    // Wait for anonymized body from SW
    const anonymizedBody = await new Promise((resolve) => {
      pendingRequests.set(currentRequestId, resolve);

      window.postMessage(
        {
          type: 'CHATGPT_REQUEST',
          requestId: currentRequestId,
          payload: { url, body },
        },
        '*'
      );

      // Timeout fallback
      setTimeout(() => {
        if (pendingRequests.has(currentRequestId)) {
          console.warn('[INJECT] Timeout waiting for anonymization, using original');
          pendingRequests.delete(currentRequestId);
          resolve(body);
        }
      }, 2000);
    });

    // Replace body with anonymized version
    const modifiedArgs = [...args];
    if (modifiedArgs[1]) {
      modifiedArgs[1] = { ...modifiedArgs[1], body: anonymizedBody };
    }

    console.log('[INJECT] Using anonymized body');
    return originalFetch.apply(this, modifiedArgs);
  }

  return originalFetch.apply(this, args);
};

console.log('[INJECT] Fetch override complete');

