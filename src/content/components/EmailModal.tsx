import { ReactNode } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { X as IconX } from 'lucide-react';
import { Logo } from '@/components/Logo';

interface EmailModalProps {
  onClose: () => void;
  issuesTab: ReactNode;
  historyTab: ReactNode;
}

export function EmailModal({ onClose, issuesTab, historyTab }: EmailModalProps) {
  return (
    <div className="modal-backdrop fixed inset-0 z-[10001] bg-black/50" onClick={onClose}>
      <Card
        className="bg-secondary border-border modal-card fixed bottom-24 right-6 w-[90%] max-w-[560px] min-w-[320px] mx-auto min-h-[600px] max-h-[600px] flex flex-col shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-4 text-lg">
              <Logo className="w-10 h-12 text-primary" />
              <div className="text-xl font-semibold text-foreground">Eduardo Prompt-Guardo</div>
            </CardTitle>
            <button
              onClick={onClose}
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
              {issuesTab}
            </TabsContent>

            <TabsContent value="history" className="mt-4 flex-1 overflow-hidden">
              {historyTab}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

