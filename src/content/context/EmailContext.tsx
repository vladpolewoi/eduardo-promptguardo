import { createContext, useContext, ReactNode } from 'react';
import type { EmailEntry } from '@/shared';
import { useEmailHistory } from '../hooks/useEmailHistory';
import { useDismissedEmails } from '../hooks/useDismissedEmails';
import { useEmailDetection } from '../hooks/useEmailDetection';

interface EmailContextType {
  emails: EmailEntry[];
  currentIssues: string[];
  loading: boolean;
  dismissEmail: (email: string) => Promise<void>;
  isEmailDismissed: (email: string) => boolean;
  getDismissedUntil: (email: string) => Date | null;
}

const EmailContext = createContext<EmailContextType | undefined>(undefined);

export function EmailProvider({ children }: { children: ReactNode }) {
  const { emails, loading } = useEmailHistory();
  const { dismissedEmails, isEmailDismissed, getDismissedUntil, dismissEmail } =
    useDismissedEmails();
  const { currentIssues, removeFromCurrentIssues } = useEmailDetection(dismissedEmails);

  const handleDismissEmail = async (email: string): Promise<void> => {
    await dismissEmail(email);

    removeFromCurrentIssues(email);
  };

  const value: EmailContextType = {
    emails,
    currentIssues,
    loading,
    dismissEmail: handleDismissEmail,
    isEmailDismissed,
    getDismissedUntil,
  };

  return <EmailContext.Provider value={value}>{children}</EmailContext.Provider>;
}

export function useEmails() {
  const context = useContext(EmailContext);

  if (context === undefined) {
    throw new Error('useEmails must be used within EmailProvider');
  }
  return context;
}

