/**
 * Service Worker - Background Script
 * Handles message passing and centralized logic for email detection
 */

console.log('Service worker initialized');

// Email detection regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const STORAGE_KEY = 'detectionHistory';

interface EmailEntry {
  email: string;
  timestamp: number;
  dismissed?: number;
}

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

function anonymizeText(text: string): { anonymized: string; emails: string[] } {
  const emails = new Set<string>();

  const anonymized = text.replace(EMAIL_REGEX, (email) => {
    const anonymizedEmail = `[EMAIL ADDRESS]`;
    emails.add(email);

    return anonymizedEmail;
  });

  return { anonymized, emails: Array.from(emails) };
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  console.log('[SW] Received message:', message);

  if (message.type === 'ANALYZE_PROMPT') {
    // Handle async processing
    (async () => {
      try {
        // REFACTOR: Extracting the prompt from the message
        const body = JSON.parse(message.payload?.body) || message.payload?.body;
        const parts = body?.messages?.[0]?.content?.parts;
        console.log('PATS', parts, body);
        const textPart = parts?.find((part: any) => typeof part === 'string');
        console.log('[SW] Extracted prompt:', textPart);

        const { emails, anonymized } = anonymizeText(textPart);

        console.log('[SW] Detection result:', { emails, anonymized });

        // Log detected emails to history and get normalized list
        let detectedEmails: string[] = [];
        if (emails.length > 0) {
          detectedEmails = await logDetectedEmails(emails);
        }

        sendResponse({
          emails: detectedEmails,
          originalText: textPart,
          anonymizedText: anonymized,
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

