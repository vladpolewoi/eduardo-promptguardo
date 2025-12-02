import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X as IconX } from 'lucide-react';
import { useEmails } from '../context/EmailContext';
import { Logo } from '@/components/Logo';
import './App.css';

function App() {
  const [show, setShow] = useState(false);
  const { emails, currentIssues, loading, dismissEmail, getDismissedUntil } = useEmails();

  // Listen for EMAIL_DETECTED event to show modal
  useEffect(() => {
    function handleEmailDetected() {
      setShow(true);
    }

    handleEmailDetected();
  }, [currentIssues]);

  useEffect(() => {
    // Apply system theme
    const applyTheme = () => {
      const root = document.getElementById('crxjs-app');
      if (!root) return;

      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (isDark) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };

    applyTheme();

    // Listen for theme changes
    const darkModeQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleThemeChange = () => applyTheme();
    darkModeQuery.addEventListener('change', handleThemeChange);

    return () => {
      darkModeQuery.removeEventListener('change', handleThemeChange);
    };
  }, []);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <>
      {/* Toggle button */}
      <div className="fixed bottom-6 right-6 z-[10000]">
        <button
          onClick={() => setShow(!show)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg hover:shadow-xl transition-all hover:scale-105"
        >
          <Logo className="w-8 h-8 text-white" />
        </button>
      </div>

      {/* Modal */}
      {show && (
        <div
          className="modal-backdrop fixed inset-0 z-[10001] bg-black/50"
          onClick={() => setShow(false)}
        >
          <Card
            className="bg-secondary border-border modal-card fixed bottom-24 right-6 w-[560px] min-h-[600px] max-h-[600px] flex flex-col shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-4 text-lg">
                  <Logo className="w-10 h-12 text-primary" />
                  <div className="text-xl font-semibold text-foreground">Eduardo Prompt-Guardo</div>
                </CardTitle>
                <button
                  onClick={() => setShow(false)}
                  className="text-muted-foreground hover:text-foreground text-xl leading-none"
                >
                  <IconX size="32" />
                </button>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col overflow-hidden">
              <Tabs defaultValue="issues" className="h-full flex flex-col">
                <TabsList className="w-full flex-shrink-0">
                  <TabsTrigger value="issues" className="flex-1">
                    Issues Found
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="issues" className="mt-4 flex-1 overflow-hidden">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">Loading...</p>
                  ) : currentIssues.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-4xl mb-3">✅</p>
                      <p className="text-sm text-muted-foreground">
                        No issues found in current prompt
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-3">
                        {currentIssues.length} email{currentIssues.length > 1 ? 's' : ''} found in
                        current prompt
                      </p>
                      <ScrollArea className="h-[200px]">
                        {currentIssues.map((email) => (
                          <div
                            key={email}
                            className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors mb-2"
                          >
                            <div className="flex items-center justify-between gap-3">
                              <div className="font-mono text-xs flex-1">{email}</div>
                              <button
                                onClick={() => dismissEmail(email)}
                                className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-background transition-colors"
                              >
                                Dismiss
                              </button>
                            </div>
                          </div>
                        ))}
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-4 flex-1 overflow-hidden">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">Loading...</p>
                  ) : emails.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-4xl mb-3">📜</p>
                      <p className="text-sm text-muted-foreground">No history yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-3">
                        All detected emails ({emails.length} total)
                      </p>

                      <ScrollArea className="h-[400px]">
                        {emails
                          .slice()
                          .sort((a, b) => b.timestamp - a.timestamp)
                          .map((entry) => {
                            const dismissedUntil = getDismissedUntil(entry.email);
                            return (
                              <div
                                key={entry.email + entry.timestamp}
                                className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors mb-2"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <div className="font-mono text-sm break-all">{entry.email}</div>
                                    {dismissedUntil && (
                                      <div className="text-xs text-muted-foreground mt-1">
                                        Dismissed until {formatDate(dismissedUntil.getTime())}
                                      </div>
                                    )}
                                  </div>
                                  <div className="text-xs text-muted-foreground whitespace-nowrap">
                                    {formatDate(entry.timestamp)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </ScrollArea>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
}

export default App;

