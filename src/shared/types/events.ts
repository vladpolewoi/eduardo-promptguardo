export enum EventType {
  CHATGPT_REQUEST = 'CHATGPT_REQUEST',
  ANONYMIZATION_RESPONSE = 'ANONYMIZATION_RESPONSE',
}

export interface EventPayloads {
  [EventType.CHATGPT_REQUEST]: {
    requestId: number;
    url: string;
    body: string;
  };
  [EventType.ANONYMIZATION_RESPONSE]: {
    requestId: number;
    anonymizedBody: string;
  };
}

export interface Event<T extends EventType = EventType> {
  type: T;
  payload: EventPayloads[T];
}

export type EventSubscriber<T extends EventType> = (payload: EventPayloads[T]) => void;

export type UnsubscribeFunction = () => void;

