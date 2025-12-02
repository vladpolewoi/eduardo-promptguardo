import { EventType } from '../types/events';
import { eventBus } from './EventBus';

export class MessageService {
  private isListening = false;

  startListening(): void {
    if (this.isListening) {
      console.warn('[MessageService] Already listening to window messages');
      return;
    }

    window.addEventListener('message', this.handleWindowMessage);

    this.isListening = true;
  }

  stopListening(): void {
    window.removeEventListener('message', this.handleWindowMessage);

    this.isListening = false;
  }

  private handleWindowMessage = (event: MessageEvent): void => {
    if (event.source !== window) return;

    const { type, ...payload } = event.data;

    // Check if it's a valid event type
    if (Object.values(EventType).includes(type)) {
      eventBus.notify(type as EventType, payload);
    }
  };

  sendMessage<T extends EventType>(eventType: T, payload: any): void {
    window.postMessage(
      {
        type: eventType,
        ...payload,
      },
      '*',
    );
  }
}

// Singleton
export const messageService = new MessageService();

