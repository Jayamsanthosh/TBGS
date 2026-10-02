-- Drops the Purchase Quotation additional-cost columns now that nothing
-- reads or writes them. The 8 quotation procs were rewritten first, in
-- purchase_quotation_remove_additional_cost.sql - run that before this.
--
-- Dropped:
--   VPurchase.TBL_PURCHASE_QUOTATION_DTL.ADDITIONAL_COST_AMOUNT_LC
--   VPurchase.TBL_PURCHASE_QUOTATION_HDR.TOTAL_ADDITIONAL_COST_AMOUNT_FC
--   VPurchase.TBL_PURCHASE_QUOTATION_HDR.TOTAL_ADDITIONAL_COST_AMOUNT_LC
--
-- Purchase Order keeps its own TOTAL_ADDITIONAL_COST_AMOUNT_FC / _LC. That is a
-- separate feature on a separate screen with its own SP parameters, and is
-- deliberately left alone.

ALTER TABLE VPurchase.TBL_PURCHASE_QUOTATION_DTL DROP COLUMN ADDITIONAL_COST_AMOUNT_LC;
GO
ALTER TABLE VPurchase.TBL_PURCHASE_QUOTATION_HDR DROP COLUMN TOTAL_ADDITIONAL_COST_AMOUNT_FC;
GO
ALTER TABLE VPurchase.TBL_PURCHASE_QUOTATION_HDR DROP COLUMN TOTAL_ADDITIONAL_COST_AMOUNT_LC;
GO
