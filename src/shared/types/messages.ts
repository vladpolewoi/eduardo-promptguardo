export const MessageType = {
  CHATGPT_REQUEST: 'CHATGPT_REQUEST',
  ANONYMIZATION_RESPONSE: 'ANONYMIZATION_RESPONSE',
  EMAIL_DETECTED: 'EMAIL_DETECTED',
} as const;

export type MessageTypeKeys = keyof typeof MessageType;
export type MessageTypeValues = (typeof MessageType)[MessageTypeKeys];

// Messages
export interface ChatGPTRequestMessage {
  type: typeof MessageType.CHATGPT_REQUEST;
  requestId: number;
  body: string;
}

export interface AnonymizationResponseMessage {
  type: typeof MessageType.ANONYMIZATION_RESPONSE;
  requestId: number;
  anonymizedBody: string;
}

export type WindowMessage = ChatGPTRequestMessage | AnonymizationResponseMessage;

// Events
export interface EmailDetectedEvent {
  emails: string[];
}

