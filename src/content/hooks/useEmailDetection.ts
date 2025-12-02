import { useState, useEffect, useCallback } from 'react';
import { MessageType, type EmailDetectedEvent } from '@/shared/types';
import { type DismissedEmails } from '@/shared/repositories';
import { isEmailDismissed } from '@/shared/utils';

export function useEmailDetection(dismissedEmails: DismissedEmails) {
  const [currentIssues, setCurrentIssues] = useState<string[]>([]);

  const removeFromCurrentIssues = useCallback((email: string) => {
    const normalizedEmail = email.toLowerCase();

    setCurrentIssues((current) => current.filter((e) => e.toLowerCase() !== normalizedEmail));
  }, []);

  useEffect(() => {
    const handleEmailDetected = (event: Event) => {
      const customEvent = event as CustomEvent<EmailDetectedEvent>;
      const detectedEmails = customEvent.detail.emails;

      // Filter out dismissed emails (within 24h)
      const nonDismissedEmails = detectedEmails.filter((email) => {
        const dismissedAt = dismissedEmails[email.toLowerCase()];

        return !isEmailDismissed(dismissedAt);
      });

      if (nonDismissedEmails.length > 0) {
        setCurrentIssues(nonDismissedEmails);
      }
    };

    window.addEventListener(MessageType.EMAIL_DETECTED, handleEmailDetected);

    return () => {
      window.removeEventListener(MessageType.EMAIL_DETECTED, handleEmailDetected);
    };
  }, [dismissedEmails]);

  return {
    currentIssues,
    removeFromCurrentIssues,
  };
}

