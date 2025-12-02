import {
  MessageType,
  type ChatGPTRequestMessage,
  type AnonymizationResponseMessage,
  type WindowMessage,
} from '../../shared';

export enum ContentEventType {
  CHATGPT_REQUEST = 'CHATGPT_REQUEST',
}

type ContentEventPayloads = {
  [ContentEventType.CHATGPT_REQUEST]: ChatGPTRequestMessage;
};

type EventHandler<K extends ContentEventType> = (message: ContentEventPayloads[K]) => void;

class ContentEventBus {
  private isListening = false;

  private handlers: {
    [K in ContentEventType]?: EventHandler<K>[];
  } = {};

  init() {
    if (this.isListening) return;

    window.addEventListener('message', this.handleMessage);

    this.isListening = true;
  }

  destroy() {
    if (!this.isListening) return;

    window.removeEventListener('message', this.handleMessage);

    this.isListening = false;

    this.handlers = {};
  }

  on<K extends ContentEventType>(type: K, handler: EventHandler<K>) {
    const list = (this.handlers[type] || []) as EventHandler<K>[];

    list.push(handler);

    this.handlers[type] = list as any;
  }

  off<K extends ContentEventType>(type: K, handler: EventHandler<K>) {
    const list = (this.handlers[type] || []) as EventHandler<K>[];

    this.handlers[type] = list.filter((h) => h !== handler) as any;
  }

  sendAnonymizationResponse(message: AnonymizationResponseMessage) {
    window.postMessage(message as WindowMessage, '*');
  }

  private handleMessage = (event: MessageEvent<WindowMessage>) => {
    if (event.source !== window) return;

    const { type } = event.data;

    if (type === MessageType.CHATGPT_REQUEST) {
      const msg = event.data as ChatGPTRequestMessage;
      const list = (this.handlers[ContentEventType.CHATGPT_REQUEST] ||
        []) as EventHandler<ContentEventType.CHATGPT_REQUEST>[];
      list.forEach((handler) => handler(msg));
    }
  };
}

export const contentEventBus = new ContentEventBus();

