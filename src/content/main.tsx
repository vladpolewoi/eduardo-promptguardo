import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './views/App.tsx';
import { EmailProvider } from './context/EmailContext.tsx';

console.log('[Content Script] Initialized');

// Inject script into main world
const s = document.createElement('script');
s.src = chrome.runtime.getURL('inject.js');
s.onload = function () {
  console.log('ON LOAD');
};
(document.head || document.documentElement).appendChild(s);

// Listen for messages from injected script (main world)
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data.type === 'CHATGPT_REQUEST') {
    console.log('[Content Script] Received ChatGPT request, forwarding to SW');

    const requestId = event.data.requestId;

    chrome.runtime
      .sendMessage({
        type: 'ANALYZE_PROMPT',
        payload: event.data.payload,
      })
      .then((response) => {
        console.log('[Content Script] SW response:', response);

        // Send anonymized body back
        const parsedBody = JSON.parse(event.data.payload.body);
        const anonymizedBody = JSON.stringify({
          ...parsedBody,
          messages: parsedBody.messages.map((msg: any) => ({
            ...msg,
            content: {
              ...msg.content,
              parts: msg.content.parts.map((part: any) =>
                typeof part === 'string' ? response.anonymizedText : part,
              ),
            },
          })),
        });

        window.postMessage(
          {
            type: 'ANONYMIZATION_RESPONSE',
            requestId: requestId,
            anonymizedBody: anonymizedBody,
          },
          '*',
        );

        // Dispatch event with emails
        if (response.emails && response.emails.length > 0) {
          console.log('[Content Script] Dispatching EMAIL_DETECTED event with:', response.emails);

          window.dispatchEvent(
            new CustomEvent('EMAIL_DETECTED', {
              detail: { emails: response.emails },
            }),
          );
        }
      })
      .catch((err) => {
        console.error('[Content Script] SW error:', err);

        // Original on error
        window.postMessage(
          {
            type: 'ANONYMIZATION_RESPONSE',
            requestId: requestId,
            anonymizedBody: event.data.payload.body,
          },
          '*',
        );
      });
  }
});

const container = document.createElement('div');
container.id = 'crxjs-app';
document.body.appendChild(container);
createRoot(container).render(
  <StrictMode>
    <EmailProvider>
      <App />
    </EmailProvider>
  </StrictMode>,
);

