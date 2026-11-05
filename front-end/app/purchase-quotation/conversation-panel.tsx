"use client";

import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "@/lib/store";
import {
  fetchConversations,
  fetchResponseStatuses,
  addConversation,
  updateConversation,
  deleteConversation,
  clearConversationError,
} from "@/lib/purchaseQuotationConversationSlice";
import ConversationPanel from "@/components/ConversationPanel";

/**
 * Purchase Quotation conversation.
 *
 * Uses the shared conversation UI (the Purchase Invoice design) so both
 * purchase screens look and behave identically. This wrapper only adapts the
 * quotation conversation slice and its reference column (`PURCHASE_QUOTATION_NO`).
 */
export default function QuotationConversationPanel({
  refNo,
  statusEntry,
  className,
  emptyHint,
}: {
  refNo: string;
  statusEntry?: string;
  className?: string;
  emptyHint?: string;
}) {
  const dispatch = useAppDispatch();
  const { items, statuses, loading, saving, error } = useAppSelector(
    (s) => s.purchaseQuotationConversation
  );

  const onLoad = useCallback(() => {
    if (!refNo) return;
    dispatch(fetchConversations({ refNo }));
  }, [dispatch, refNo]);

  const onLoadStatuses = useCallback(() => {
    dispatch(fetchResponseStatuses());
  }, [dispatch]);

  const onAdd = useCallback(
    async (payload: Record<string, any>) => dispatch(addConversation(payload)).unwrap(),
    [dispatch]
  );

  const onUpdate = useCallback(
    async (payload: Record<string, any>, item: Record<string, any>) =>
      dispatch(
        updateConversation({
          ...payload,
          SNO: Number(item.SNO ?? item.id),
        })
      ).unwrap(),
    [dispatch]
  );

  const onDelete = useCallback(
    async (item: Record<string, any>) =>
      dispatch(deleteConversation(Number(item.SNO ?? item.id))).unwrap(),
    [dispatch]
  );

  const onClearError = useCallback(() => {
    dispatch(clearConversationError());
  }, [dispatch]);

  const buildPayload = useCallback(
    (base: Record<string, any>) => ({
      PURCHASE_QUOTATION_NO: refNo,
      ...base,
    }),
    [refNo]
  );

  return (
    <ConversationPanel
      refNo={refNo}
      statusEntry={statusEntry}
      className={className}
      emptyHint={emptyHint}
      entityLabel="quotation"
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
      maxRemark={50}
      missingRefTitle="Save the quotation first"
      missingRefHint="A conversation belongs to a saved purchase quotation. Save this quotation and its reference number will appear here."
    />
  );
}
