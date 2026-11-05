"use client";

import { MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { stampLine } from "@/components/ConversationPanel";

/**
 * Shared conversation dialog shell.
 *
 * Identical frame for every screen that opens a conversation from a row: same
 * width/height, header, entry count, last-activity line and scroll area. The
 * screen supplies the shared ConversationPanel as `children`.
 */
export default function ConversationDialogShell({
  open,
  onOpenChange,
  entityLabel,
  refNo,
  count,
  lastActivity,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  entityLabel: string;
  refNo: string;
  count: number;
  lastActivity?: string | null;
  children: React.ReactNode;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[85vh] w-[calc(100vw-2rem)] max-w-4xl flex-col overflow-hidden p-0">
        <DialogHeader className="shrink-0 space-y-1 border-b px-6 py-4 pr-14 text-left">
          <DialogTitle className="flex items-center gap-2 text-lg">
            <MessageSquare className="w-5 h-5 text-primary" />
            Conversation
            {count > 0 && (
              <Badge variant="secondary" className="ml-1 text-xs font-medium">
                {count} {count === 1 ? "entry" : "entries"}
              </Badge>
            )}
          </DialogTitle>
          <p className="text-xs text-muted-foreground">
            {entityLabel} {refNo}
            {lastActivity ? ` · last activity ${stampLine(lastActivity)}` : ""}
          </p>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">{children}</ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
