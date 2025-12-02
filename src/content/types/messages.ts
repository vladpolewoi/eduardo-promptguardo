export const MessageType = {
  CHATGPT_REQUEST: 'CHATGPT_REQUEST',
  ANONYMIZATION_RESPONSE: 'ANONYMIZATION_RESPONSE',
  EMAIL_DETECTED: 'EMAIL_DETECTED',
} as const;

// Payloads
export interface ChatGPTRequestMessagePayload {
  type: typeof MessageType.CHATGPT_REQUEST;
  requestId: number;
  body: string;
}

export interface AnonymizationResponseMessage {
  type: typeof MessageType.ANONYMIZATION_RESPONSE;
  requestId: number;
  anonymizedBody: string;
}

export interface EmailDetectedEvent {
  emails: string[];
}
//---

export type MessagePayloads = {
  [MessageType.CHATGPT_REQUEST]: ChatGPTRequestMessagePayload;
};

export type WindowMessage = {
  [K in keyof MessagePayloads]: { type: K } & MessagePayloads[K];
}[keyof MessagePayloads];

