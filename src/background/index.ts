import { processAllTextInBody } from '../shared';
import { anonymizeText } from './utils/anonymization';
import { EmailHistoryRepository } from './repositories/EmailHistoryRepository';

console.log('Service worker initialized');

// Initialize repository
const emailHistoryRepository = new EmailHistoryRepository();

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[SW] Received message:', message);

  if (message.type === 'ANALYZE_PROMPT') {
    // Handle async processing
    (async () => {
      try {
        const bodyString = message.payload?.body;

        if (!bodyString || typeof bodyString !== 'string') {
          throw new Error('Invalid body - expected string');
        }

        // Collect all detected emails from all text parts
        const allDetectedEmails: string[] = [];

        // Process each text part in the body independently
        const anonymizedBody = processAllTextInBody(bodyString, (text) => {
          console.log('[SW] Processing text part:', text.substring(0, 100) + '...');

          // Detect and anonymize emails in this text part
          const { emails, anonymized } = anonymizeText(text);

          // Collect emails from this part
          if (emails.length > 0) {
            allDetectedEmails.push(...emails);
          }

          return anonymized;
        });

        console.log('[SW] Total emails detected:', allDetectedEmails);

        // Log all detected emails to history and get normalized list
        let detectedEmails: string[] = [];
        if (allDetectedEmails.length > 0) {
          detectedEmails = await emailHistoryRepository.addEntries(allDetectedEmails);
        }

        sendResponse({
          emails: detectedEmails,
          anonymizedBody: anonymizedBody, // Return full transformed body
        });
      } catch (error) {
        console.error('[SW] Error processing message:', error);
        sendResponse({ success: false, error: String(error) });
      }
    })();

    return true; // Keep the message channel open for async response
  }

  sendResponse({ success: false, error: 'Unknown message type' });
  return true;
});

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
});

