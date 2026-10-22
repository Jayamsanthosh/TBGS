import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PurchaseInvoiceDtl {
  key?: string;
  PURCHASE_INVOICE_DTL_ID?: number;
  PURCHASE_INVOICE_REF_NO?: string;
  PURCHASE_ORDER_NO?: string;
  PURCHASE_ORDER_DTL_ID?: number;
  LINE_NO?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  PRODUCT_NAME?: string;
  MAIN_CATEGORY_NAME?: string;
  SUB_CATEGORY_NAME?: string;
  NO_OF_PCS_PER_PACKING?: any;
  INVOICED_QUANTITY?: any;
  UOM_ID?: number;
  UOM_NAME?: string;
  ALT_UOM_ID?: number;
  ALT_UOM_NAME?: string;
  RATE_FC?: any;
  DISCOUNT_PERCENTAGE?: any;
  DISCOUNT_AMOUNT_FC?: any;
  SUB_TOTAL_AMOUNT_FC?: any;
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
  REMARKS?: string;
  STATUS_ENTRY?: string;
}

export interface PurchaseInvoiceGridData {
  id?: string | number;
  sno?: number;
  purchaseInvoiceRefNo?: string;
  PURCHASE_INVOICE_REF_NO?: string;
  purchaseInvoiceDate?: string;
  purchaseOrderNo?: string;
  supplierInvoiceNo?: string;
  supplierInvoiceDate?: string;
  companyId?: number;
  companyName?: string;
  branchId?: number;
  branchName?: string;
  campId?: number;
  campName?: string;
  storeId?: number;
  storeName?: string;
  supplierBpId?: number;
  supplierName?: string;
  currencyId?: number;
  currencyName?: string;
  exchangeRate?: any;
  paymentTermId?: number;
  paymentModeId?: number;
  dueDate?: string;
  totalSubTotalHdrAmountFc?: any;
  totalDiscountHdrAmountFc?: any;
  totalAdditionalCostAmountFc?: any;
  totalProductHdrAmountFc?: any;
  totalTaxHdrAmountFc?: any;
  finalProductHdrAmountFc?: any;
  totalSubTotalHdrAmountLc?: any;
  totalDiscountHdrAmountLc?: any;
  totalAdditionalCostAmountLc?: any;
  totalProductHdrAmountLc?: any;
  totalTaxHdrAmountLc?: any;
  finalProductHdrAmountLc?: any;
  statusId?: number;
  statusName?: string;
  remarks?: string;
  statusEntry?: string;
  hasDocument?: boolean;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: PurchaseInvoiceDtl[];
  deletedIds?: number[];
}

export interface PurchaseInvoiceOption {
  id?: string | number;
  purchaseOrderNo?: string;
  purchaseOrderDate?: string;
  companyId?: number;
  companyName?: string;
  supplierBpId?: number;
  supplierName?: string;
  branchId?: number;
  branchName?: string;
  storeId?: number;
  storeName?: string;
  currencyId?: number;
  currencyName?: string;
  exchangeRate?: any;
  paymentTermId?: number;
  paymentModeId?: number;
  invoiceCount?: number;
  detailLineCount?: number;
  itemSummary?: string;
  label?: string;
}

interface PurchaseInvoiceMasterState {
  items: PurchaseInvoiceGridData[];
  total: number;
  options: PurchaseInvoiceOption[];
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseInvoiceMasterState = {
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

const readError = async (response: Response, fallback: string) => {
  const errorData = await response.json().catch(() => ({}));
  return errorData.message || fallback;
};

export const fetchPurchaseInvoices = createAsyncThunk(
  "purchaseInvoiceMaster/fetchAll",
  async (_params: void, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-invoice`);
      if (!response.ok) return rejectWithValue(await readError(response, "Failed to fetch purchase invoices"));
      const json = await response.json();
      const rows = json.data || [];
      return {
        rows: rows.map((u: any) => ({
          ...u,
          id: u.sno ?? u.purchaseInvoiceRefNo ?? u.PURCHASE_INVOICE_REF_NO,
        })),
        total: json.total ?? rows.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase invoices");
    }
  }
);

export const fetchPurchaseInvoiceHdr = createAsyncThunk(
  "purchaseInvoiceMaster/fetchHdr",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-invoice/hdr/${encodeURIComponent(refNo)}`);
      if (!response.ok) return rejectWithValue(await readError(response, "Failed to fetch purchase invoice header"));
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase invoice header");
    }
  }
);

export const fetchPurchaseInvoiceDtls = createAsyncThunk(
  "purchaseInvoiceMaster/fetchDtls",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-invoice/dtls/${encodeURIComponent(refNo)}`);
      if (!response.ok) return rejectWithValue(await readError(response, "Failed to fetch purchase invoice details"));
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase invoice details");
    }
  }
);

export const loadPurchaseInvoiceSourceOrders = createAsyncThunk(
  "purchaseInvoiceMaster/loadSourceOrders",
  async (params: { companyId?: number } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.companyId) query.set("companyId", String(params.companyId));
      const qs = query.toString();
      const response = await fetch(`${API_URL}/purchase-invoice/source-orders${qs ? `?${qs}` : ""}`);
      if (!response.ok) return rejectWithValue(await readError(response, "Failed to load purchase orders"));
      const json = await response.json();
      return (json.data || []).map((o: any) => ({
        ...o,
        id: o.purchaseOrderNo,
        label: o.label || `${o.purchaseOrderNo || ""} - ${o.supplierName || o.companyName || ""}`,
      }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load purchase orders");
    }
  }
);

export const addPurchaseInvoice = createAsyncThunk(
  "purchaseInvoiceMaster/add",
  async (item: PurchaseInvoiceGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-invoice`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) return rejectWithValue(await readError(response, "Failed to add purchase invoice"));
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add purchase invoice");
    }
  }
);

export const updatePurchaseInvoice = createAsyncThunk(
  "purchaseInvoiceMaster/update",
  async (item: PurchaseInvoiceGridData, { rejectWithValue }) => {
    try {
      const refNo = item.purchaseInvoiceRefNo || item.PURCHASE_INVOICE_REF_NO || "";
      const response = await fetch(`${API_URL}/purchase-invoice/${encodeURIComponent(refNo)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) return rejectWithValue(await readError(response, "Failed to update purchase invoice"));
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update purchase invoice");
    }
  }
);

export const deletePurchaseInvoiceHdr = createAsyncThunk(
  "purchaseInvoiceMaster/deleteHdr",
  async (refNo: string | number, { rejectWithValue, getState }) => {
    try {
      const { USER, ROLE, MAC_ADDRESS } = identity(getState);
      const response = await fetch(
        `${API_URL}/purchase-invoice/hdr/${encodeURIComponent(String(refNo))}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ USER, ROLE, MAC_ADDRESS }),
        }
      );
      if (!response.ok) return rejectWithValue(await readError(response, "Failed to delete purchase invoice"));
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase invoice");
    }
  }
);

const purchaseInvoiceMasterSlice = createSlice({
  name: "purchaseInvoiceMaster",
  initialState,
  reducers: {
    clearPurchaseInvoiceMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseInvoices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseInvoices.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(fetchPurchaseInvoices.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch purchase invoices";
      })
      .addCase(loadPurchaseInvoiceSourceOrders.fulfilled, (state, action) => {
        state.options = action.payload;
        state.error = null;
      })
      .addCase(loadPurchaseInvoiceSourceOrders.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to load purchase orders";
      })
      .addCase(addPurchaseInvoice.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add purchase invoice";
      })
      .addCase(updatePurchaseInvoice.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update purchase invoice";
      })
      .addCase(deletePurchaseInvoiceHdr.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete purchase invoice";
      });
  },
});

export const { clearPurchaseInvoiceMasterError } = purchaseInvoiceMasterSlice.actions;
export default purchaseInvoiceMasterSlice.reducer;
