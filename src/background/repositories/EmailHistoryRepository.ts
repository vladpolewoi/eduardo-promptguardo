import { STORAGE_KEY } from '../config/constants';
import { EmailEntry } from '../entities/EmailEntry.entity';

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

  async dismissEmail(email: string): Promise<void> {
    const history = await this.loadHistory();
    const normalizedEmail = email.toLowerCase();
    const dismissedAt = Date.now();

    // Add dismissed to every entry
    const updatedHistory = history.map((entry) =>
      entry.email === normalizedEmail ? { ...entry, dismissed: dismissedAt } : entry,
    );

    await this.saveHistory(updatedHistory);
  }
}

