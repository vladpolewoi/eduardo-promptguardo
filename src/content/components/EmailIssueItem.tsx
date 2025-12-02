interface EmailIssueItemProps {
  email: string;
  onDismiss: (email: string) => void;
}

export function EmailIssueItem({ email, onDismiss }: EmailIssueItemProps) {
  return (
    <div className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors mb-2">
      <div className="flex items-center justify-between gap-3">
        <div className="font-mono text-xs flex-1">{email}</div>
        <button
          onClick={() => onDismiss(email)}
          className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-background transition-colors"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}

