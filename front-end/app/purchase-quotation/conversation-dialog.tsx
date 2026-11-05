"use client";

import { useAppSelector } from "@/lib/store";
import ConversationDialogShell from "@/components/ConversationDialog";
import QuotationConversationPanel from "./conversation-panel";

/**
 * Purchase Quotation conversation.
 *
 * Same dialog and panel as the Purchase Invoice screen - the shared components
 * guarantee the two conversations cannot drift apart.
 */
export default function ConversationDialog({
  open,
  onOpenChange,
  purchaseQuotationNo,
  statusEntry,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  purchaseQuotationNo: string;
  statusEntry?: string;
}) {
  const items = useAppSelector((s) => s.purchaseQuotationConversation.items);
  const lastActivity = [...items].sort(
    (a, b) => Number(b.SNO ?? b.id ?? 0) - Number(a.SNO ?? a.id ?? 0)
  )[0]?.CREATED_DATE;

  return (
    <ConversationDialogShell
      open={open}
      onOpenChange={onOpenChange}
      entityLabel="Purchase Quotation"
      refNo={purchaseQuotationNo}
      count={items.length}
      lastActivity={lastActivity}
    >
      <QuotationConversationPanel
        key={purchaseQuotationNo}
        refNo={purchaseQuotationNo}
        statusEntry={statusEntry}
        className="min-h-0 px-6"
      />
    </ConversationDialogShell>
  );
}
