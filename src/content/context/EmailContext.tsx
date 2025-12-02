import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  MessageType,
  type EmailEntry,
  STORAGE_KEY,
  EmailHistoryRepository,
  type DismissedEmails,
  DISMISS_DURATION_MS,
  isEmailDismissed as checkIsEmailDismissed,
  getDismissedUntil as getEmailDismissedUntil,
} from '@/shared';
import { type EmailDetectedEvent } from '@/shared/types/messages';

interface EmailContextType {
  emails: EmailEntry[];
  currentIssues: string[]; // Emails from the latest detection
  loading: boolean;
  dismissEmail: (email: string) => Promise<void>;
  isEmailDismissed: (email: string) => boolean;
  getDismissedUntil: (email: string) => Date | null;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

const repository = new EmailHistoryRepository();

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [currentIssues, setCurrentIssues] = useState<string[]>([]);
  const [dismissedEmails, setDismissedEmails] = useState<DismissedEmails>({});
  const [loading, setLoading] = useState(true);

  // Wrapper functions that use pure utilities
  const isEmailDismissed = (email: string): boolean => {
    const dismissedAt = dismissedEmails[email.toLowerCase()];
    return checkIsEmailDismissed(dismissedAt);
  };

  const getDismissedUntil = (email: string): Date | null => {
    const dismissedAt = dismissedEmails[email.toLowerCase()];
    return getEmailDismissedUntil(dismissedAt);
  };

  // Initial load - runs once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const detectionHistory = await repository.loadHistory();
      const cleanedDismissed = await repository.cleanExpiredDismissals();

      setEmails(detectionHistory);
      setDismissedEmails(cleanedDismissed);

      setLoading(false);
    };

    loadInitialData();
  }, []);

  // listen for storage changes from service worker
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        const newValue = changes[STORAGE_KEY].newValue as EmailEntry[];
        if (newValue) {
          console.log('[EmailContext] Detection history updated:', newValue.length);
          setEmails(newValue);
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  // Listen for EMAIL_DETECTED CustomEvent
  useEffect(() => {
    const handleEmailDetected = (event: Event) => {
      const customEvent = event as CustomEvent<EmailDetectedEvent>;
      const detectedEmails = customEvent.detail.emails;

      console.log('[EmailContext] Emails detected in current prompt:', detectedEmails);

      // Filter out dismissed emails (within 24h)
      const nonDismissedEmails = detectedEmails.filter((email) => !isEmailDismissed(email));

      console.log('[EmailContext] After filtering dismissed:', nonDismissedEmails);

      // Only set if there are non-dismissed emails
      if (nonDismissedEmails.length > 0) {
        setCurrentIssues(nonDismissedEmails);
      }
    };

    window.addEventListener(MessageType.EMAIL_DETECTED, handleEmailDetected);

    return () => {
      window.removeEventListener(MessageType.EMAIL_DETECTED, handleEmailDetected);
    };
  }, [isEmailDismissed]);

  // Dismiss email for 24 hours
  const dismissEmail = async (email: string): Promise<void> => {
    const normalizedEmail = email.toLowerCase();
    const now = Date.now();

    // Dismiss via repository
    await repository.dismissEmail(email);

    // Update state
    const updatedDismissed = {
      ...dismissedEmails,
      [normalizedEmail]: now,
    };
    setDismissedEmails(updatedDismissed);

    // Remove from current issues
    setCurrentIssues((current) => current.filter((e) => e.toLowerCase() !== normalizedEmail));

    console.log(`[EmailContext] Dismissed ${email} until`, new Date(now + DISMISS_DURATION_MS));
  };

  const value: EmailContextType = {
    emails,
    currentIssues,
    loading,
    dismissEmail,
    isEmailDismissed,
    getDismissedUntil,
  };

  return <EmailContext.Provider value={value}>{children}</EmailContext.Provider>;
}

// Hook to use email context
export function useEmails() {
  const context = useContext(EmailContext);
  if (context === undefined) {
    throw new Error('useEmails must be used within EmailProvider');
  }
  return context;
}

