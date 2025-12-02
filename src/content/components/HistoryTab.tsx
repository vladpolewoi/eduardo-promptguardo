import { ScrollArea } from '@/components/ui/scroll-area';
import type { EmailEntry } from '@/shared/entities';
import { EmailHistoryItem } from './EmailHistoryItem';
import { EmptyState } from './EmptyState';

interface HistoryTabProps {
  loading: boolean;
  emails: EmailEntry[];
  getDismissedUntil: (email: string) => Date | null;
}

export function HistoryTab({ loading, emails, getDismissedUntil }: HistoryTabProps) {
  if (loading) {
    return <p className="text-center text-muted-foreground py-8 text-sm">Loading...</p>;
  }

  if (emails.length === 0) {
    return <EmptyState icon="📜" message="No history yet" />;
  }

  const sortedEmails = [...emails].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        All detected emails ({emails.length} total)
      </p>

      <ScrollArea className="h-[400px]">
        {sortedEmails.map((entry) => {
          const dismissedUntil = getDismissedUntil(entry.email);

          return (
            <EmailHistoryItem
              key={entry.email + entry.timestamp}
              email={entry.email}
              timestamp={entry.timestamp}
              dismissedUntil={dismissedUntil}
            />
          );
        })}
      </ScrollArea>
    </div>
  );
}

