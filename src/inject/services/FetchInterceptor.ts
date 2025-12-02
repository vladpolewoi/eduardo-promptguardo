import { MessageType } from '../../shared';

type SomeUrl = string | URL | Request;

export interface InterceptorConfig {
  targetUrlPattern: string;
  requestTimeout: number;
}

export class FetchInterceptor {
  private readonly originalFetch: typeof window.fetch;
  private readonly config: InterceptorConfig;
  private requestIdCounter = 0;
  private pendingRequests = new Map<number, (body: string) => void>();

  constructor(config: InterceptorConfig) {
    this.originalFetch = window.fetch;
    this.config = config;
    this.setupResponseListener();
  }

  install(): void {
    window.fetch = this.createInterceptedFetch();
  }

  uninstall(): void {
    window.fetch = this.originalFetch;
    this.pendingRequests.clear();
  }

  // Setup listener for anonymization responses from content script
  private setupResponseListener(): void {
    window.addEventListener('message', (event: MessageEvent) => {
      if (event.data.type === MessageType.ANONYMIZATION_RESPONSE) {
        const { requestId, anonymizedBody } = event.data;
        const resolver = this.pendingRequests.get(requestId);

        if (resolver) {
          resolver(anonymizedBody);

          this.pendingRequests.delete(requestId);
        }
      }
    });
  }

  private async handleInterceptedRequest(args: Parameters<typeof window.fetch>): Promise<Response> {
    const [input, init] = args;
    const body = init?.body;

    if (!body || typeof body !== 'string') {
      console.warn('[FetchInterceptor] No body or non-string body, skipping');

      return this.originalFetch.apply(window, args);
    }

    try {
      const anonymizedBody = await this.requestAnonymization(body);

      const modifiedInit: RequestInit = {
        ...init,
        body: anonymizedBody,
      };

      return this.originalFetch.call(window, input, modifiedInit);
    } catch (error) {
      console.error('[FetchInterceptor] Error during anonymization:', error);

      return this.originalFetch.apply(window, args);
    }
  }

  private async requestAnonymization(body: string): Promise<string> {
    const requestId = this.requestIdCounter++;

    return new Promise<string>((resolve) => {
      this.pendingRequests.set(requestId, resolve);

      // Send to SW
      window.postMessage(
        {
          type: MessageType.CHATGPT_REQUEST,
          requestId,
          body,
        },
        '*',
      );

      // If timeout fallback to original body
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          console.warn(`[FetchInterceptor] Request ${requestId} timed out`);

          this.pendingRequests.delete(requestId);

          resolve(body);
        }
      }, this.config.requestTimeout);
    });
  }

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

