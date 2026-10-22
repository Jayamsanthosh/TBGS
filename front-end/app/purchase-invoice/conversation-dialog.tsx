"use client";

import { MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAppSelector } from "@/lib/store";
import InvoiceConversationPanel from "./conversation-panel";

const parseStamp = (value: any) => {
  if (!value) return null;
  const s = String(value).trim().replace("T", " ");
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}))?/);
  if (!m) return { day: "", date: s, time: "" };
  return {
    day: `${m[1]}-${m[2]}-${m[3]}`,
    date: `${m[3]}-${m[2]}-${m[1]}`,
    time: m[4] ? `${m[4]}:${m[5]}` : "",
  };
};

const stampLine = (value: any) => {
  const p = parseStamp(value);
  if (!p) return "";
  return p.time ? `${p.date} at ${p.time}` : p.date;
};

export default function ConversationDialog({
  open,
  onOpenChange,
  purchaseInvoiceRefNo,
  statusEntry,
  linkPagesId,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  purchaseInvoiceRefNo: string;
  statusEntry?: string;
  linkPagesId?: number;
}) {
  const items = useAppSelector((s) => s.purchaseInvoiceConversation.items);
  const count = items.length;
  const lastActivity = [...items].sort(
    (a, b) => Number(b.CONVERSATION_ID ?? b.id ?? 0) - Number(a.CONVERSATION_ID ?? a.id ?? 0)
  )[0]?.CREATED_DATE;

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
            Purchase Invoice {purchaseInvoiceRefNo}
            {lastActivity ? ` · last activity ${stampLine(lastActivity)}` : ""}
          </p>
        </DialogHeader>

        <ScrollArea className="min-h-0 flex-1">
          <InvoiceConversationPanel
            key={purchaseInvoiceRefNo}
            refNo={purchaseInvoiceRefNo}
            linkPagesId={linkPagesId}
            statusEntry={statusEntry}
            className="min-h-0 px-6"
          />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
