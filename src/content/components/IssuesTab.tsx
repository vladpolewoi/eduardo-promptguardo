import { ScrollArea } from '@/components/ui/scroll-area';
import { EmailIssueItem } from './EmailIssueItem';
import { EmptyState } from './EmptyState';

interface IssuesTabProps {
  loading: boolean;
  currentIssues: string[];
  onDismiss: (email: string) => void;
}

export function IssuesTab({ loading, currentIssues, onDismiss }: IssuesTabProps) {
  if (loading) {
    return <p className="text-center text-muted-foreground py-8 text-sm">Loading...</p>;
  }

  if (currentIssues.length === 0) {
    return <EmptyState icon="✅" message="No issues found in current prompt" />;
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground mb-3">
        {currentIssues.length} email{currentIssues.length > 1 ? 's' : ''} found in current prompt
      </p>
      <ScrollArea className="h-[200px]">
        {currentIssues.map((email) => (
          <EmailIssueItem key={email} email={email} onDismiss={onDismiss} />
        ))}
      </ScrollArea>
    </div>
  );
}

