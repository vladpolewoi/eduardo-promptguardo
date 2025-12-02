import { useEffect } from 'react';
import type { EventType, EventSubscriber } from '../types/events';
import { eventBus } from '../services/EventBus';

export function useEventSubscription<T extends EventType>(
  eventType: T,
  callback: EventSubscriber<T>,
) {
  useEffect(() => {
    const unsubscribe = eventBus.subscribe(eventType, callback);

    return () => {
      unsubscribe();
    };
  }, [eventType, callback]);
}

