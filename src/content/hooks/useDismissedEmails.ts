import { useState, useEffect, useCallback } from 'react';
import { EmailHistoryRepository, type DismissedEmails } from '@/shared/repositories';
import {
  isEmailDismissed as checkIsEmailDismissed,
  getDismissedUntil as getEmailDismissedUntil,
} from '@/shared/utils';

const repository = new EmailHistoryRepository();

export function useDismissedEmails() {
  const [dismissedEmails, setDismissedEmails] = useState<DismissedEmails>({});

  useEffect(() => {
    const loadDismissedEmails = async () => {
      const cleanedDismissed = await repository.cleanExpiredDismissals();

      setDismissedEmails(cleanedDismissed);
    };

    loadDismissedEmails();
  }, []);

  const isEmailDismissed = useCallback(
    (email: string): boolean => {
      const dismissedAt = dismissedEmails[email.toLowerCase()];

      return checkIsEmailDismissed(dismissedAt);
    },
    [dismissedEmails],
  );

  const getDismissedUntil = useCallback(
    (email: string): Date | null => {
      const dismissedAt = dismissedEmails[email.toLowerCase()];

      return getEmailDismissedUntil(dismissedAt);
    },
    [dismissedEmails],
  );

  // Dismiss an email for 24 hours
  const dismissEmail = useCallback(
    async (email: string): Promise<void> => {
      const normalizedEmail = email.toLowerCase();
      const now = Date.now();

      await repository.dismissEmail(email);

      const updatedDismissed = {
        ...dismissedEmails,
        [normalizedEmail]: now,
      };

      setDismissedEmails(updatedDismissed);
    },
    [dismissedEmails],
  );

  return {
    dismissedEmails,
    isEmailDismissed,
    getDismissedUntil,
    dismissEmail,
  };
}

