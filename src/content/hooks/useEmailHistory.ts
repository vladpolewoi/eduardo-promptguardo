import { useState, useEffect } from 'react';
import { EmailHistoryRepository, STORAGE_KEY, type EmailEntry } from '@/shared';

const repository = new EmailHistoryRepository();

export function useEmailHistory() {
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadInitialData = async () => {
      const detectionHistory = await repository.loadHistory();

      setEmails(detectionHistory);

      setLoading(false);
    };

    loadInitialData();
  }, []);

  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        const newValue = changes[STORAGE_KEY].newValue as EmailEntry[];

        if (newValue) {
          setEmails(newValue);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  return { emails, loading };
}

