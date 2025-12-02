import { createContext, useContext, useCallback, useState, useEffect, ReactNode } from 'react';
import { MessageType, type EmailEntry } from '@/shared';
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

const STORAGE_KEY = 'detectionHistory';
const DISMISSED_KEY = 'dismissedEmails';

// Dismissed emails structure: { email: timestamp }
type DismissedEmails = Record<string, number>;

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [currentIssues, setCurrentIssues] = useState<string[]>([]);
  const [dismissedEmails, setDismissedEmails] = useState<DismissedEmails>({});
  const [loading, setLoading] = useState(true);

  // Helper function to check if email is dismissed and within 24h
  const isEmailDismissed = useCallback(
    (email: string): boolean => {
      const dismissedAt = dismissedEmails[email.toLowerCase()];
      if (!dismissedAt) return false;

      const now = Date.now();
      const hoursSinceDismissed = (now - dismissedAt) / (1000 * 60 * 60);

      return hoursSinceDismissed < 24;
    },
    [dismissedEmails],
  );

  // Helper function to get when a dismissed email will expire
  const getDismissedUntil = useCallback(
    (email: string): Date | null => {
      const dismissedAt = dismissedEmails[email.toLowerCase()];
      if (!dismissedAt) return null;

      const expiresAt = dismissedAt + 24 * 60 * 60 * 1000; // 24 hours in ms
      const now = Date.now();

      // Only return if still within dismiss window
      if (expiresAt > now) {
        return new Date(expiresAt);
      }

      return null;
    },
    [dismissedEmails],
  );

  // Helper function to clean expired dismissed emails
  const cleanExpiredDismissals = useCallback(
    async (dismissed: DismissedEmails): Promise<DismissedEmails> => {
      const now = Date.now();
      const cleaned: DismissedEmails = {};

      Object.entries(dismissed).forEach(([email, dismissedAt]) => {
        const hoursSinceDismissed = (now - dismissedAt) / (1000 * 60 * 60);
        if (hoursSinceDismissed < 24) {
          cleaned[email] = dismissedAt;
        }
      });

      return cleaned;
    },
    [],
  );

  // Initial load - runs once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const result = (await chrome.storage.local.get([STORAGE_KEY, DISMISSED_KEY])) as {
        detectionHistory: EmailEntry[];
        dismissedEmails: DismissedEmails;
      };
      const detectionHistory = result.detectionHistory || [];
      const dismissed = result.dismissedEmails || {};

      // Clean expired dismissals
      const cleanedDismissed = await cleanExpiredDismissals(dismissed);
      if (Object.keys(cleanedDismissed).length !== Object.keys(dismissed).length) {
        await chrome.storage.local.set({ [DISMISSED_KEY]: cleanedDismissed });
      }

      setEmails(detectionHistory);
      setDismissedEmails(cleanedDismissed);
      setLoading(false);
      console.log('[EmailContext] Loaded detection history:', detectionHistory.length);
      console.log('[EmailContext] Loaded dismissed emails:', Object.keys(cleanedDismissed).length);
    };

    loadInitialData();
  }, [cleanExpiredDismissals]);

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

    const updatedDismissed = {
      ...dismissedEmails,
      [normalizedEmail]: now,
    };

    // Update storage
    await chrome.storage.local.set({ [DISMISSED_KEY]: updatedDismissed });

    // Update state
    setDismissedEmails(updatedDismissed);

    // Remove from current issues
    setCurrentIssues((current) => current.filter((e) => e.toLowerCase() !== normalizedEmail));

    console.log(`[EmailContext] Dismissed ${email} until`, new Date(now + 24 * 60 * 60 * 1000));
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

