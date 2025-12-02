import { MessageType } from '@/shared';

import { EmailHistoryRepository } from './repositories/EmailHistoryRepository';
import { EmailDetectionService } from './services/EmailDetectionService';

const emailHistoryRepository = new EmailHistoryRepository();
const emailDetectionService = new EmailDetectionService(emailHistoryRepository);

async function handleAnalyzePrompt(payload: any, sendResponse: (response: any) => void) {
  try {
    const response = await emailDetectionService.analyzePrompt(payload);

    sendResponse(response);
  } catch (error) {
    console.error('[SW] Error processing ANALYZE_PROMPT:', error);

    sendResponse({ success: false, error: String(error) });
  }
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === MessageType.ANALYZE_PROMPT) {
    handleAnalyzePrompt(message.payload, sendResponse);

    // Keep the message channel open for async response
    return true;
  }

  sendResponse({ success: false, error: 'Unknown message type' });
  return true;
});

