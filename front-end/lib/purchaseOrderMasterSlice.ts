import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PurchaseOrderDtl {
  key?: string;
  PURCHASE_ORDER_DTL_ID?: number;
  PURCHASE_ORDER_NO?: string;
  PURCHASE_QUOTATION_NO?: string;
  PURCHASE_QUOTATION_DTL_ID?: number;
  PURCHASE_REQUEST_NO?: string;
  PURCHASE_REQUEST_DTL_ID?: number;
  CAMP_ID?: number;
  REQUEST_STORE_ID?: number;
  REFERENCE_TYPE_ID?: number;
  REFERENCE_NO?: string;
  LINE_NO?: number;
  ITEM_TYPE?: string;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  PRODUCT_NAME?: string;
  MAIN_CATEGORY_NAME?: string;
  SUB_CATEGORY_NAME?: string;
  NO_OF_PCS_PER_PACKING?: any;
  TOTAL_QUANTITY?: any;
  UOM_ID?: number;
  UOM_NAME?: string;
  TOTAL_PACKING?: any;
  ALT_UOM_ID?: number;
  ALT_UOM_NAME?: string;
  RATE?: any;
  SUB_TOTAL_AMOUNT_FC?: any;
  DISCOUNT_PERCENTAGE?: any;
  DISCOUNT_AMOUNT_FC?: any;
  TOTAL_PRODUCT_AMOUNT_FC?: any;
  TAX_ID?: number;
  TAX_NAME?: string;
  TAX_PERCENTAGE?: any;
  TAX_AMOUNT_FC?: any;
  FINAL_AMOUNT_FC?: any;
  EXCHANGE_RATE?: any;
  SUB_TOTAL_AMOUNT_LC?: any;
  DISCOUNT_AMOUNT_LC?: any;
  TOTAL_PRODUCT_AMOUNT_LC?: any;
  TAX_AMOUNT_LC?: any;
  FINAL_AMOUNT_LC?: any;
  REQUIRED_DATE?: string;
  REASON?: string;
  REMARKS?: string;
  STATUS_ENTRY?: string;
  SOURCE_LINE_NO?: number;
}

export interface PurchaseOrderGridData {
  id?: string | number;
  sno?: number;
  purchaseOrderNo?: string;
  PURCHASE_ORDER_NO?: string;
  hasDocument?: boolean;
  refNo?: string;
  purchaseOrderDate?: string;
  purchaseQuotationNo?: string;
  companyId?: number;
  companyName?: string;
  supplierBpId?: number;
  supplierName?: string;
  branchId?: number;
  branchName?: string;
  poStoreId?: number;
  poStoreName?: string;
  paymentTermId?: number;
  paymentModeId?: number;
  shipmentModeId?: number;
  shipmentModeName?: string;
  deliveryDate?: string;
  deliveryTerm?: string;
  shipmentRemarks?: string;
  deliveryLocationId?: number;
  deliveryLocationName?: string;
  totalSubTotalHdrAmountFc?: any;
  totalDiscountHdrAmountFc?: any;
  totalAdditionalCostAmountFc?: any;
  totalProductHdrAmountFc?: any;
  totalVatHdrAmountFc?: any;
  finalProductHdrAmountFc?: any;
  currencyId?: number;
  currencyName?: string;
  exchangeRate?: any;
  totalSubTotalHdrAmountLc?: any;
  totalDiscountHdrAmountLc?: any;
  totalAdditionalCostAmountLc?: any;
  totalProductHdrAmountLc?: any;
  totalTaxHdrAmountLc?: any;
  finalProductHdrAmountLc?: any;
  sectionHeadResponsePersonEmpId?: number;
  sectionHeadResponseDate?: string;
  sectionHeadResponseStatus?: string;
  sectionHeadResponseRemarks?: string;
  sectionHeadResponseIpAddress?: string;
  response1EmpId?: number;
  response1Date?: string;
  response1Status?: string;
  response1Remarks?: string;
  response1IpAddress?: string;
  response2EmpId?: number;
  response2Date?: string;
  response2Status?: string;
  response2Remarks?: string;
  response2IpAddress?: string;
  finalResponseEmpId?: number;
  finalResponseDate?: string;
  finalResponseStatus?: string;
  finalResponseRemarks?: string;
  finalResponseIpAddress?: string;
  purchaseOrderStatusId?: number;
  purchaseOrderStatusName?: string;
  remarks?: string;
  statusEntry?: string;
  createdBy?: string;
  createdDate?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: PurchaseOrderDtl[];
  deletedIds?: number[];
}

export interface PurchaseOrderOption {
  id?: string | number;
  purchaseQuotationNo?: string;
  purchaseQuotationDate?: string;
  companyId?: number;
  companyName?: string;
  supplierBpId?: number;
  supplierName?: string;
  approvalStatus?: string;
  statusEntry?: string;
  displayText?: string;
  label?: string;
  detailLineCount?: number | null;
  itemSummary?: string;
}

interface PurchaseOrderMasterState {
  items: PurchaseOrderGridData[];
  total: number;
  options: PurchaseOrderOption[];
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseOrderMasterState = {
  items: [],
  total: 0,
  options: [],
  loading: false,
  error: null,
};

const identity = (getState: any) => {
  const state: any = getState();
  const authUser = state.auth?.user;
  return {
    USER: authUser?.loginName || authUser?.LOGIN_NAME || "Admin",
    ROLE: authUser?.role || authUser?.ROLE || "Admin",
    MAC_ADDRESS: "WEB",
  };
};

export const fetchPurchaseOrders = createAsyncThunk(
  "purchaseOrderMaster/fetchAll",
  async (_params: void, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-order`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase orders");
      }
      const json = await response.json();
      const rows = json.data || [];
      return {
        rows: rows.map((u: any) => ({
          ...u,
          id: u.sno ?? u.purchaseOrderNo ?? u.PURCHASE_ORDER_NO,
        })),
        total: json.total ?? rows.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase orders");
    }
  }
);

export const fetchPurchaseOrderHdr = createAsyncThunk(
  "purchaseOrderMaster/fetchHdr",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-order/hdr/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase order header");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase order header");
    }
  }
);

export const fetchPurchaseOrderDtls = createAsyncThunk(
  "purchaseOrderMaster/fetchDtls",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-order/dtls/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase order details");
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase order details");
    }
  }
);

export const fetchPurchaseOrderDtl = createAsyncThunk(
  "purchaseOrderMaster/fetchDtl",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-order/dtl/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase order detail");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase order detail");
    }
  }
);

export const loadPurchaseOrderSourceQuotations = createAsyncThunk(
  "purchaseOrderMaster/loadSourceQuotations",
  async (
    params: { companyId?: number; statusEntry?: string; approvalStatus?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const query = new URLSearchParams();
      if (params.companyId) query.set("companyId", String(params.companyId));
      if (params.statusEntry) query.set("statusEntry", params.statusEntry);
      if (params.approvalStatus) query.set("approvalStatus", params.approvalStatus);
      const qs = query.toString();
      const response = await fetch(`${API_URL}/purchase-order/source-quotations${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to load source quotations");
      }
      const json = await response.json();
      return (json.data || []).map((o: any) => ({
        ...o,
        id: o.purchaseQuotationNo,
        label:
          o.label ||
          o.displayText ||
          `${o.purchaseQuotationNo || ""} - ${o.supplierName || o.companyName || ""}`,
      }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load source quotations");
    }
  }
);

export const addPurchaseOrder = createAsyncThunk(
  "purchaseOrderMaster/add",
  async (item: PurchaseOrderGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add purchase order");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add purchase order");
    }
  }
);

export const updatePurchaseOrder = createAsyncThunk(
  "purchaseOrderMaster/update",
  async (item: PurchaseOrderGridData, { rejectWithValue }) => {
    try {
      const refNo = item.purchaseOrderNo || item.PURCHASE_ORDER_NO || "";
      const response = await fetch(`${API_URL}/purchase-order/${encodeURIComponent(refNo)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update purchase order");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update purchase order");
    }
  }
);

export const deletePurchaseOrderDtl = createAsyncThunk(
  "purchaseOrderMaster/deleteDtl",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const { USER, ROLE, MAC_ADDRESS } = identity(getState);
      const response = await fetch(`${API_URL}/purchase-order/dtl/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER, ROLE, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete purchase order detail");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase order detail");
    }
  }
);

export const deletePurchaseOrderHdr = createAsyncThunk(
  "purchaseOrderMaster/deleteHdr",
  async (refNo: string | number, { rejectWithValue, getState }) => {
    try {
      const { USER, ROLE, MAC_ADDRESS } = identity(getState);
      const response = await fetch(
        `${API_URL}/purchase-order/hdr/${encodeURIComponent(String(refNo))}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ USER, ROLE, MAC_ADDRESS }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete purchase order");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase order");
    }
  }
);

/* SUBMIT_PURCHASE_ORDER_HDR sends the order (hdr + dtl + additional charges)
   to CL. No status id is needed - the proc derives everything from the ref no. */
export const submitPurchaseOrder = createAsyncThunk(
  "purchaseOrderMaster/submit",
  async (arg: { refNo: string | number }, { rejectWithValue, getState }) => {
    try {
      const { USER, MAC_ADDRESS } = identity(getState);
      const response = await fetch(
        `${API_URL}/purchase-order/${encodeURIComponent(String(arg.refNo))}/submit`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ USER, MAC_ADDRESS }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit purchase order");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit purchase order");
    }
  }
);

const purchaseOrderMasterSlice = createSlice({
  name: "purchaseOrderMaster",
  initialState,
  reducers: {
    clearPurchaseOrderMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(fetchPurchaseOrders.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch purchase orders";
      })
      .addCase(loadPurchaseOrderSourceQuotations.pending, (state) => {
        state.error = null;
      })
      .addCase(loadPurchaseOrderSourceQuotations.fulfilled, (state, action) => {
        state.options = action.payload;
      })
      .addCase(loadPurchaseOrderSourceQuotations.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to load source quotations";
      })
      .addCase(addPurchaseOrder.pending, (state) => {
        state.error = null;
      })
      .addCase(addPurchaseOrder.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add purchase order";
      })
      .addCase(updatePurchaseOrder.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePurchaseOrder.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update purchase order";
      })
      .addCase(deletePurchaseOrderDtl.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePurchaseOrderDtl.rejected, (state, action) => {
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to delete purchase order detail";
      })
      .addCase(deletePurchaseOrderHdr.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePurchaseOrderHdr.rejected, (state, action) => {
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to delete purchase order";
      });
  },
});

export const { clearPurchaseOrderMasterError } = purchaseOrderMasterSlice.actions;
export default purchaseOrderMasterSlice.reducer;