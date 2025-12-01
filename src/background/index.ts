/**
 * Service Worker - Background Script
 * Handles message passing and centralized logic for email detection
 */

console.log('Service worker initialized');

// Email detection regex
const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const STORAGE_KEY = 'detectedEmails';

interface EmailEntry {
  email: string;
  timestamp: number;
  dismissed?: number; // timestamp when dismissed, undefined if not dismissed
}

async function loadDetectedEmails(): Promise<EmailEntry[]> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  return (result[STORAGE_KEY] as EmailEntry[]) || [];
}

async function addDetectedEmails(newEmails: string[]): Promise<void> {
  const stored = await loadDetectedEmails();
  console.log('[SW] Current stored emails:', stored);
  let hasNew = false;

  newEmails.forEach((email) => {
    // Check if email already exists (case-insensitive deduplication)
    const exists = stored.some((entry) => entry.email.toLowerCase() === email.toLowerCase());

    if (!exists) {
      stored.push({
        email: email.toLowerCase(),
        timestamp: Date.now(),
      });
      hasNew = true;
      console.log(`[SW] New email detected and stored: ${email}`);
    }
  });

  if (hasNew) {
    await chrome.storage.local.set({ [STORAGE_KEY]: stored });
    console.log('[SW] Total emails stored:', stored.length);
  }
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
    try {
      // REFACTOR: Extracting the prompt from the message
      const body = JSON.parse(message.payload?.body) || message.payload?.body;
      const parts = body?.messages?.[0]?.content?.parts;
      console.log('PATS', parts, body);
      const textPart = parts?.find((part: any) => typeof part === 'string');
      console.log('[SW] Extracted prompt:', textPart);

      const { emails, anonymized } = anonymizeText(textPart);

      console.log('[SW] Detection result:', { emails, anonymized });

      // Store detected emails
      if (emails.length > 0) {
        addDetectedEmails(emails).catch((err) => {
          console.error('[SW] Error storing emails:', err);
        });
      }

      sendResponse({
        emails: emails,
        originalText: textPart,
        anonymizedText: anonymized,
      });
    } catch (error) {
      console.error('[SW] Error processing message:', error);
      sendResponse({ success: false, error: String(error) });
    }

    return true;
  }

  sendResponse({ success: false, error: 'Unknown message type' });
  return true;
});

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Extension installed/updated:', details.reason);
});

