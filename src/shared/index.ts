// Message types and payloads
export { MessageType } from './types/messages';
export type {
  MessageTypeValues,
  ChatGPTRequestMessage,
  AnonymizationResponseMessage,
  EmailDetectedEvent,
  WindowMessage,
} from './types/messages';

// ChatGPT helpers
export { parseChatGPTBody, processAllTextInBody, stringifyChatGPTBody } from './helpers/chatgpt';
export type { ChatGPTMessage, ChatGPTRequestBody } from './helpers/chatgpt';

