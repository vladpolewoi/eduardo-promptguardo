export { MessageType } from './types/messages';
export type { AnalyzePromptMessage } from './types/messages';

export type { EmailEntry } from './entities/emailEntry.entity';

export {
  STORAGE_KEY,
  DISMISSED_KEY,
  DISMISS_DURATION_HOURS,
  MS_PER_HOUR,
  DISMISS_DURATION_MS,
} from './config/constants';

export { EmailHistoryRepository } from './repositories/emailHistory.repository';
export type { DismissedEmails } from './repositories/emailHistory.repository';

export { isEmailDismissed, getDismissedUntil, getHoursSinceDismissed } from './utils/dismissal';

export { parseChatGPTBody, processAllTextInBody, stringifyChatGPTBody } from './helpers/chatgpt';
export type { ChatGPTMessage, ChatGPTRequestBody } from './helpers/chatgpt';

