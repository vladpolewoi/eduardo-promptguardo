/**
 * FetchInterceptor
 * Intercepts fetch requests to ChatGPT API and anonymizes email addresses
 * Uses InjectMessenger for communication with content script
 */

// import { injectMessenger } from './InjectMessenger';

type SomeUrl = string | URL | Request;

export interface InterceptorConfig {
  targetUrlPattern: string;
  requestTimeout: number;
}

export class FetchInterceptor {
  private readonly originalFetch: typeof window.fetch;
  private readonly config: InterceptorConfig;
  // private requestIdCounter = 0;
  private pendingRequests = new Map<number, (body: string) => void>();

  constructor(config: InterceptorConfig) {
    this.originalFetch = window.fetch;
    this.config = config;
    // this.setupResponseListener();
  }

  install(): void {
    window.fetch = this.createInterceptedFetch();
  }

  uninstall(): void {
    window.fetch = this.originalFetch;

    this.pendingRequests.clear();
  }

  //  * Setup listener for anonymization responses from content script
  //  */
  // private setupResponseListener(): void {
  //   injectMessenger.onAnonymizationResponse((payload) => {
  //     const resolver = this.pendingRequests.get(payload.requestId);
  //     if (resolver) {
  //       resolver(payload.anonymizedBody);
  //       this.pendingRequests.delete(payload.requestId);
  //     }
  //   });
  // }
  //
  private async handleInterceptedRequest(args: Parameters<typeof window.fetch>): Promise<Response> {
    const [input, init] = args;
    const body = init?.body;

    if (!body || typeof body !== 'string') {
      console.warn('[FetchInterceptor] No body or non-string body, skipping');
      return this.originalFetch.apply(window, args);
    }

    console.log('[FetchInterceptor] Intercepting ChatGPT API call', input);

    // try {
    //   // Request anonymization from content script
    //   const anonymizedBody = await this.requestAnonymization(body);
    //
    //   // Create modified request with anonymized body
    //   const modifiedInit: RequestInit = {
    //     ...init,
    //     body: anonymizedBody,
    //   };
    //
    //   console.log('[FetchInterceptor] Sending request with anonymized body');
    // return this.originalFetch.call(window, input, modifiedInit);
    // } catch (error) {
    //   console.error('[FetchInterceptor] Error during anonymization:', error);
    return this.originalFetch.apply(window, args);
    // }
  }

  /**
   * Request anonymization from content script via InjectMessenger
   */
  // private async requestAnonymization(body: string): Promise<string> {
  //   const requestId = this.requestIdCounter++;
  //
  //   return new Promise<string>((resolve) => {
  //     this.pendingRequests.set(requestId, resolve);
  //
  //     // Send request via InjectMessenger
  //     injectMessenger.sendChatGPTRequest(requestId, body);
  //
  //     // Timeout fallback
  //     setTimeout(() => {
  //       if (this.pendingRequests.has(requestId)) {
  //         console.warn(`[FetchInterceptor] Request ${requestId} timed out`);
  //         this.pendingRequests.delete(requestId);
  //         resolve(body); // Use original body
  //       }
  //     }, this.config.requestTimeout);
  //   });
  // }

  // Helpers
  private shouldIntercept(url: string): boolean {
    return url.includes(this.config.targetUrlPattern);
  }

  private extractUrl(input: SomeUrl): string {
    if (typeof input === 'string') return input;
    if (input instanceof URL) return input.href;
    if (input instanceof Request) return input.url;

    return '';
  }

  createInterceptedFetch(): typeof window.fetch {
    return async (...args: Parameters<typeof window.fetch>): Promise<Response> => {
      const [input] = args;
      const url = this.extractUrl(input);

      if (!this.shouldIntercept(url)) {
        return this.originalFetch.apply(window, args);
      }

      return this.handleInterceptedRequest(args);
    };
  }
}

