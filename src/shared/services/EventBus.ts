import type { EventType, EventSubscriber, UnsubscribeFunction } from '../types/events';

export class EventBus {
  private subscribers: Map<EventType, Set<EventSubscriber<EventType>>> = new Map();

  subscribe<T extends EventType>(eventType: T, callback: EventSubscriber<T>): UnsubscribeFunction {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set());
    }

    const subscribers = this.subscribers.get(eventType)!;

    subscribers.add(callback as EventSubscriber<EventType>);

    return () => {
      subscribers.delete(callback as EventSubscriber<EventType>);

      if (subscribers.size === 0) {
        this.subscribers.delete(eventType);
      }
    };
  }

  unsubscribe<T extends EventType>(eventType: T, callback: EventSubscriber<T>): void {
    const subscribers = this.subscribers.get(eventType);

    if (subscribers) {
      subscribers.delete(callback as EventSubscriber<EventType>);

      if (subscribers.size === 0) {
        this.subscribers.delete(eventType);
      }
    }
  }

  notify<T extends EventType>(eventType: T, payload: Parameters<EventSubscriber<T>>[0]): void {
    const subscribers = this.subscribers.get(eventType);

    if (subscribers) {
      subscribers.forEach((callback) => {
        try {
          callback(payload);
        } catch (error) {
          console.error(`[EventBus] Error in subscriber for ${eventType}:`, error);
        }
      });
    }
  }

  // hasSubscribers(eventType: EventType): boolean {
  //   return this.subscribers.has(eventType) && this.subscribers.get(eventType)!.size > 0;
  // }
  //
  // getSubscriberCount(eventType: EventType): number {
  //   return this.subscribers.get(eventType)?.size ?? 0;
  // }
  //
  // clearEvent(eventType: EventType): void {
  //   this.subscribers.delete(eventType);
  // }
  //
  // clearAll(): void {
  //   this.subscribers.clear();
  // }
}

// Singleton
export const eventBus = new EventBus();

