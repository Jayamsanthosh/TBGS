"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchInvoiceConversations,
  fetchInvoiceResponseStatuses,
  addInvoiceConversation,
  updateInvoiceConversation,
  deleteInvoiceConversation,
  clearInvoiceConversationError,
} from "@/lib/purchaseInvoiceConversationSlice";
import ConversationPanel from "@/components/ConversationPanel";

/**
 * Purchase Invoice conversation.
 *
 * The visual design lives in `components/ConversationPanel.tsx` so the invoice
 * and quotation screens render the exact same UI. This wrapper only adapts the
 * invoice conversation slice and its reference column (`PAGE_REF_NO`).
 */
export default function InvoiceConversationPanel({
  refNo,
  linkPagesId,
  statusEntry,
  className,
  emptyHint,
}: {
  refNo: string;
  linkPagesId?: number;
  statusEntry?: string;
  className?: string;
  emptyHint?: string;
}) {
  const dispatch = useAppDispatch();
  const { items, statuses, loading, saving, error } = useAppSelector(
    (s) => s.purchaseInvoiceConversation
  );

  const onLoad = useCallback(() => {
    if (!refNo) return;
    dispatch(fetchInvoiceConversations({ refNo, linkPagesId }));
  }, [dispatch, refNo, linkPagesId]);

  const onLoadStatuses = useCallback(() => {
    dispatch(fetchInvoiceResponseStatuses(linkPagesId));
  }, [dispatch, linkPagesId]);

  const onAdd = useCallback(
    async (payload: Record<string, any>) => dispatch(addInvoiceConversation(payload)).unwrap(),
    [dispatch]
  );

  const onUpdate = useCallback(
    async (payload: Record<string, any>, item: Record<string, any>) =>
      dispatch(
        updateInvoiceConversation({
          ...payload,
          CONVERSATION_ID: Number(item.CONVERSATION_ID ?? item.id),
        })
      ).unwrap(),
    [dispatch]
  );

  const onDelete = useCallback(
    async (item: Record<string, any>) =>
      dispatch(
        deleteInvoiceConversation(Number(item.CONVERSATION_ID ?? item.id))
      ).unwrap(),
    [dispatch]
  );

  const onClearError = useCallback(() => {
    dispatch(clearInvoiceConversationError());
  }, [dispatch]);

  const buildPayload = useCallback(
    (base: Record<string, any>) => ({
      PAGE_REF_NO: refNo,
      LINK_PAGES_ID: linkPagesId,
      ...base,
    }),
    [refNo, linkPagesId]
  );

  return (
    <ConversationPanel
      refNo={refNo}
      statusEntry={statusEntry}
      className={className}
      emptyHint={emptyHint}
      entityLabel="invoice"
      items={items}
      statuses={statuses}
      loading={loading}
      saving={saving}
      error={error}
      onLoad={onLoad}
      onLoadStatuses={onLoadStatuses}
      onAdd={onAdd}
      onUpdate={onUpdate}
      onDelete={onDelete}
      onClearError={onClearError}
      buildPayload={buildPayload}
      maxRemark={500}
      missingRefTitle="Save the invoice first"
      missingRefHint="A conversation belongs to a saved purchase invoice. Save this invoice and its reference number will appear here."
    />
  );
}
