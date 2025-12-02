import { injectScript } from './../lib/injectScript';
import { MessageType, ChatGPTRequestMessagePayload, WindowMessage } from '@/shared/types/messages';

class AppBootstrap {
  init() {
    console.log('[App Bootstrap] Init');

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
    console.log('[Content Script] Received ChatGPT request:', message);

    const { requestId, body } = message;

    chrome.runtime
      .sendMessage({
        type: 'ANALYZE_PROMPT',
        payload: { body },
      })
      .then((response) => {
        console.log('[Content Script] SW response:', response);

        const anonymizedBody = response.anonymizedBody || body;

        // Send response back via ContentEventBus (to inject script)
        window.postMessage({
          type: MessageType.ANONYMIZATION_RESPONSE,
          requestId,
          anonymizedBody,
        });
        //
        // // Dispatch EMAIL_DETECTED CustomEvent (for EmailContext)
        // if (response.emails && response.emails.length > 0) {
        //   console.log('[Content Script] Dispatching EMAIL_DETECTED event with:', response.emails);
        //
        //   window.dispatchEvent(
        //     new CustomEvent(MessageType.EMAIL_DETECTED, {
        //       detail: { emails: response.emails },
        //     }),
        //   );
        // }
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

