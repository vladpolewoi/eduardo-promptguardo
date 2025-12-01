import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface EmailEntry {
  email: string;
  timestamp: number;
  dismissed?: number;
}

interface EmailContextType {
  emails: EmailEntry[];
  loading: boolean;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

const STORAGE_KEY = 'detectedEmails';

export function EmailProvider({ children }: { children: ReactNode }) {
  const [emails, setEmails] = useState<EmailEntry[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial load - runs once on mount
  useEffect(() => {
    const loadInitialEmails = async () => {
      const result = (await chrome.storage.local.get(STORAGE_KEY)) as {
        detectedEmails: EmailEntry[];
      };
      const detectedEmails = result.detectedEmails || [];
      setEmails(detectedEmails);
      setLoading(false);
    };

    loadInitialEmails();
  }, []);

  // Listen for storage changes (from service worker)
  useEffect(() => {
    const handleStorageChange = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string,
    ) => {
      if (areaName === 'local' && changes[STORAGE_KEY]) {
        const newValue = changes[STORAGE_KEY].newValue as EmailEntry[];
        if (newValue) {
          console.log('[EmailContext] Storage changed, updating state:', newValue);
          setEmails(newValue);

          // Dispatch custom event for modal auto-show
          window.dispatchEvent(new CustomEvent('EMAIL_DETECTED'));
        }
      }
    };

    chrome.storage.onChanged.addListener(handleStorageChange);

    return () => {
      chrome.storage.onChanged.removeListener(handleStorageChange);
    };
  }, []);

  const value: EmailContextType = {
    emails,
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

