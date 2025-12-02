export { MessageType } from './types/messages';
export type { AnalyzePromptMessage } from './types/messages';

export type { EmailEntry } from './entities/emailEntry.entity';

export { STORAGE_KEY, DISMISSED_KEY } from './config/constants';

export { EmailHistoryRepository } from './repositories/emailHistory.repository';
export type { DismissedEmails } from './repositories/emailHistory.repository';

export { parseChatGPTBody, processAllTextInBody, stringifyChatGPTBody } from './helpers/chatgpt';
export type { ChatGPTMessage, ChatGPTRequestBody } from './helpers/chatgpt';

