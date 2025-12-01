import { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X as IconX } from 'lucide-react';
import { useEmails } from '../context/EmailContext';
import './App.css';

function App() {
  const [show, setShow] = useState(false);
  const { emails, loading } = useEmails();
  const logoUrl = chrome.runtime.getURL('public/logo-128.png');

  useEffect(() => {
    // Listen for new email detections
    const handleEmailDetected = () => {
      setShow(true);
    };

    window.addEventListener('EMAIL_DETECTED', handleEmailDetected);

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
      window.removeEventListener('EMAIL_DETECTED', handleEmailDetected);
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
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-primary text-white shadow-lg hover:shadow-xl transition-shadow"
        >
          <img src={logoUrl} alt="Eduardo" className="w-full h-full object-contain" />
          {emails.length > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 min-w-5 px-1">{emails.length}</Badge>
          )}
        </button>
      </div>

      {/* Modal */}
      {show && (
        <div
          className="fixed inset-0 z-[10001] flex items-center justify-center bg-black/50"
          onClick={() => setShow(false)}
        >
          <Card
            className="w-[560px] max-h-[75vh] overflow-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-4 text-lg">
                  <img src={logoUrl} alt="Eduardo" className="w-12 h-12 object-contain" />
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

            <CardContent>
              <Tabs defaultValue="detected">
                <TabsList className="w-full">
                  <TabsTrigger value="detected" className="flex-1">
                    Detected
                  </TabsTrigger>
                  <TabsTrigger value="history" className="flex-1">
                    History
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="detected" className="mt-4">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8 text-sm">Loading...</p>
                  ) : emails.length === 0 ? (
                    <div className="text-center py-16">
                      <p className="text-4xl mb-3">🌵</p>
                      <p className="text-sm text-muted-foreground">No emails detected yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground mb-3">
                        {emails.length} email{emails.length > 1 ? 's' : ''} detected
                      </p>
                      {emails.map((entry) => (
                        <div
                          key={entry.email}
                          className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                        >
                          <div className="font-mono text-xs">{entry.email}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="history" className="mt-4">
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
                      {emails
                        .slice()
                        .sort((a, b) => b.timestamp - a.timestamp)
                        .map((entry) => (
                          <div
                            key={entry.email + entry.timestamp}
                            className="p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="font-mono text-xs flex-1 break-all">
                                {entry.email}
                              </div>
                              <div className="text-xs text-muted-foreground whitespace-nowrap">
                                {formatDate(entry.timestamp)}
                              </div>
                            </div>
                          </div>
                        ))}
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

