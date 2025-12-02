import { processAllTextInBody } from '../shared';
import { anonymizeText } from './utils/anonymization';
import { STORAGE_KEY } from './config/constants';
import { EmailEntry } from './entities/EmailEntry.entity';

console.log('Service worker initialized');

async function loadDetectionHistory(): Promise<EmailEntry[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as EmailEntry[]) || [];
}

async function logDetectedEmails(emails: string[]): Promise<string[]> {
  const history = await loadDetectionHistory();
  console.log('[SW] Current history length:', history.length);

  const timestamp = Date.now();
  const normalizedEmails: string[] = [];

  // Log EVERY occurrence to history
  emails.forEach((email) => {
    const normalizedEmail = email.toLowerCase();

    history.push({
      email: normalizedEmail,
      timestamp,
    });

    normalizedEmails.push(normalizedEmail);

    console.log(`[SW] Email logged to history: ${email}`);
  });

  // Save updated history
  if (normalizedEmails.length > 0) {
    await chrome.storage.local.set({ [STORAGE_KEY]: history });
    console.log('[SW] Total detections in history:', history.length);
  }

  return normalizedEmails;
}

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
          detectedEmails = await logDetectedEmails(allDetectedEmails);
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

