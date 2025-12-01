import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface EmailEntry {
  email: string;
  timestamp: number;
  dismissed?: number;
}

interface EmailContextType {
  emails: EmailEntry[];
  currentIssues: string[]; // Emails from the latest detection
  loading: boolean;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

const STORAGE_KEY = 'detectionHistory';

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [currentIssues, setCurrentIssues] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial load - runs once on mount
  useEffect(() => {
    const loadInitialData = async () => {
      const result = (await chrome.storage.local.get(STORAGE_KEY)) as {
        detectionHistory: EmailEntry[];
      };
      const detectionHistory = result.detectionHistory || [];

      setEmails(detectionHistory);
      setLoading(false);
      console.log('[EmailContext] Loaded detection history:', detectionHistory.length);
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

  // Listen for EMAIL_DETECTED custom event from content script
  useEffect(() => {
    const handleEmailDetected = (event: Event) => {
      const customEvent = event as CustomEvent<{ emails: string[] }>;
      const detectedEmails = customEvent.detail.emails;

      console.log('[EmailContext] Emails detected in current prompt:', detectedEmails);
      setCurrentIssues(detectedEmails);
    };

    window.addEventListener('EMAIL_DETECTED', handleEmailDetected);

    return () => {
      window.removeEventListener('EMAIL_DETECTED', handleEmailDetected);
    };
  }, []);

  const value: EmailContextType = {
    emails,
    currentIssues,
    loading,
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

