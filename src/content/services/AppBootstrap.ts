import { injectScript } from './../lib/injectScript';
import { MessageType, ChatGPTRequestMessagePayload, WindowMessage } from '@/shared/types/messages';

class AppBootstrap {
  init() {
    this.injectPageScript();
    this.setupMessaging();
  }

  destroy() {
    this.teardownMessaging();
  }

  private injectPageScript() {
    injectScript({
      id: 'crx-inject-script',
      src: chrome.runtime.getURL('public/inject.js'),
    });
  }

  private setupMessaging() {
    window.addEventListener('message', this.handleWindowMessage);
  }

  private teardownMessaging() {
    window.removeEventListener('message', this.handleWindowMessage);
  }

  private handleWindowMessage = (event: MessageEvent<WindowMessage>) => {
    const { type } = event.data;

    if (type === MessageType.CHATGPT_REQUEST) {
      this.handleChatGPTRequest(event.data);
    }
  };

  // Business logic for handling a ChatGPT anonymization request
  private handleChatGPTRequest = (message: ChatGPTRequestMessagePayload) => {
    const { requestId, body } = message;

    chrome.runtime
      .sendMessage({
        type: MessageType.ANALYZE_PROMPT,
        payload: { body },
      })
      .then((response) => {
        const anonymizedBody = response.anonymizedBody || body;

        // Send response back via ContentEventBus (to inject script)
        window.postMessage({
          type: MessageType.ANONYMIZATION_RESPONSE,
          requestId,
          anonymizedBody,
        });

        if (response.emails && response.emails.length > 0) {
          window.dispatchEvent(
            new CustomEvent(MessageType.EMAIL_DETECTED, {
              detail: { emails: response.emails },
            }),
          );
        }
      })
      .catch((err) => {
        console.error('[Content Script] SW error:', err);

        // Send original body on error
        window.postMessage({
          type: MessageType.ANONYMIZATION_RESPONSE,
          requestId,
          anonymizedBody: body,
        });
      });
  };
}

export const app = new AppBootstrap();

