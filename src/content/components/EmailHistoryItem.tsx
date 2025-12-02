import { formatDate } from '../utils/dateFormatter';

interface EmailHistoryItemProps {
  email: string;
  timestamp: number;
  dismissedUntil: Date | null;
}

export function EmailHistoryItem({ email, timestamp, dismissedUntil }: EmailHistoryItemProps) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors mb-2">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <div className="font-mono text-sm break-all">{email}</div>
          {dismissedUntil && (
            <div className="text-xs text-muted-foreground mt-1">
              Dismissed until {formatDate(dismissedUntil.getTime())}
            </div>
          )}
        </div>
        <div className="text-xs text-muted-foreground whitespace-nowrap">
          {formatDate(timestamp)}
        </div>
      </div>
    </div>
  );
}

