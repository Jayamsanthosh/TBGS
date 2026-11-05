"use client";

import { useAppSelector } from "@/lib/store";
import ConversationDialogShell from "@/components/ConversationDialog";
import InvoiceConversationPanel from "./conversation-panel";

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
  const lastActivity = [...items].sort(
    (a, b) =>
      Number(b.CONVERSATION_ID ?? b.id ?? 0) -
      Number(a.CONVERSATION_ID ?? a.id ?? 0)
  )[0]?.CREATED_DATE;

  return (
    <ConversationDialogShell
      open={open}
      onOpenChange={onOpenChange}
      entityLabel="Purchase Invoice"
      refNo={purchaseInvoiceRefNo}
      count={items.length}
      lastActivity={lastActivity}
    >
      <InvoiceConversationPanel
        key={purchaseInvoiceRefNo}
        refNo={purchaseInvoiceRefNo}
        linkPagesId={linkPagesId}
        statusEntry={statusEntry}
        className="min-h-0 px-6"
      />
    </ConversationDialogShell>
  );
}
