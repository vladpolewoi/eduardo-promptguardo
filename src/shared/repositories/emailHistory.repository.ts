import { STORAGE_KEY, DISMISSED_KEY, EmailEntry } from '@/shared';

export type DismissedEmails = Record<string, number>;

export class EmailHistoryRepository {
  async loadHistory(): Promise<EmailEntry[]> {
    const result = await chrome.storage.local.get(STORAGE_KEY);

    return (result[STORAGE_KEY] as EmailEntry[]) || [];
  }

  async saveHistory(entries: EmailEntry[]): Promise<void> {
    await chrome.storage.local.set({ [STORAGE_KEY]: entries });
  }

  async addEntries(emails: string[]): Promise<string[]> {
    const history = await this.loadHistory();
    const timestamp = Date.now();
    const normalizedEmails: string[] = [];

    emails.forEach((email) => {
      const normalizedEmail = email.toLowerCase();

      history.push({
        email: normalizedEmail,
        timestamp,
      });

      normalizedEmails.push(normalizedEmail);
    });

    if (normalizedEmails.length > 0) {
      await this.saveHistory(history);
    }

    return normalizedEmails;
  }

  async clearHistory(): Promise<void> {
    await chrome.storage.local.remove(STORAGE_KEY);
  }

  async loadDismissedEmails(): Promise<DismissedEmails> {
    const result = await chrome.storage.local.get(DISMISSED_KEY);

    return (result[DISMISSED_KEY] as DismissedEmails) || {};
  }

  async saveDismissedEmails(dismissed: DismissedEmails): Promise<void> {
    await chrome.storage.local.set({ [DISMISSED_KEY]: dismissed });
  }

  async dismissEmail(email: string): Promise<void> {
    const dismissed = await this.loadDismissedEmails();
    const normalizedEmail = email.toLowerCase();
    const now = Date.now();

    const updatedDismissed = {
      ...dismissed,
      [normalizedEmail]: now,
    };

    await this.saveDismissedEmails(updatedDismissed);
  }

  async cleanExpiredDismissals(): Promise<DismissedEmails> {
    const dismissed = await this.loadDismissedEmails();
    const now = Date.now();
    const cleaned: DismissedEmails = {};

    Object.entries(dismissed).forEach(([email, dismissedAt]) => {
      const hoursSinceDismissed = (now - dismissedAt) / (1000 * 60 * 60);

      if (hoursSinceDismissed < 24) {
        cleaned[email] = dismissedAt;
      }
    });

    // Save cleaned map if it changed
    if (Object.keys(cleaned).length !== Object.keys(dismissed).length) {
      await this.saveDismissedEmails(cleaned);
    }

    return cleaned;
  }
}

