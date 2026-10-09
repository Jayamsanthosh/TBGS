import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PurchaseGrnDtl {
  key?: string;
  PURCHASE_GRN_DTL_ID?: number;
  PURCHASE_GRN_REF_NO?: string;
  PURCHASE_ORDER_NO?: string;
  PURCHASE_ORDER_DTL_ID?: number;
  LINE_NO?: number;
  MAIN_CATEGORY_ID?: number;
  MAIN_CATEGORY_NAME?: string;
  SUB_CATEGORY_ID?: number;
  SUB_CATEGORY_NAME?: string;
  PRODUCT_ID?: number;
  PRODUCT_NAME?: string;
  NO_OF_PCS_PER_PACKING?: any;
  PO_QUANTITY?: any;
  ALREADY_RECEIVED_QTY?: any;
  BALANCE_TO_RECEIVE_QTY?: any;
  RECEIVED_QUANTITY?: any;
  REJECTED_QUANTITY?: any;
  ACCEPTED_QUANTITY?: any;
  UOM_ID?: number;
  UOM_NAME?: string;
  ALT_QUANTITY?: any;
  ALT_UOM_ID?: number;
  ALT_UOM_NAME?: string;
  RATE_FC?: any;
  TOTAL_COST_FC?: any;
  EXCHANGE_RATE?: any;
  RATE_LC?: any;
  TOTAL_COST_LC?: any;
  BATCH_NO?: string;
  SERIAL_NO?: string;
  MANUFACTURE_DATE?: string;
  EXPIRY_DATE?: string;
  RACK_ID?: number;
  RACK_NAME?: string;
  REJECTION_REMARKS?: string;
  REMARKS?: string;
  STATUS_ENTRY?: string;
}

export interface PurchaseGrnGridData {
  id?: string | number;
  SNO?: number;
  PURCHASE_GRN_REF_NO?: string;
  grnNo?: string;
  refNo?: string;
  PURCHASE_GRN_DATE?: string;
  grnDate?: string;
  PURCHASE_ORDER_NO?: string;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  companyName?: string;
  CAMP_ID?: number;
  CAMP_NAME?: string;
  campName?: string;
  STORE_ID?: number;
  STORE_NAME?: string;
  storeName?: string;
  LOCATION_ID?: number;
  LOCATION_NAME?: string;
  locationName?: string;
  SUPPLIER_BP_ID?: number;
  SUPPLIER_NAME?: string;
  supplierName?: string;
  SUPPLIER_DELIVERY_NOTE_NO?: string;
  SUPPLIER_DELIVERY_NOTE_DATE?: string;
  CURRENCY_ID?: number;
  CURRENCY_NAME?: string;
  currencyName?: string;
  EXCHANGE_RATE?: any;
  TOTAL_QUANTITY?: any;
  TOTAL_VALUE_FC?: any;
  TOTAL_VALUE_LC?: any;
  STATUS_ID?: number;
  STATUS_NAME?: string;
  statusName?: string;
  STATUS_ENTRY?: string;
  REMARKS?: string;
  LINK_PAGES_ID?: number;
  RESPONSE_BY_EMP_ID?: number;
  RESPONSE_DATE?: string;
  RESPONSE_REMARKS?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: PurchaseGrnDtl[];
  deletedIds?: number[];
}

interface PurchaseGrnMasterState {
  items: PurchaseGrnGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseGrnMasterState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchPurchaseGrns = createAsyncThunk(
  "purchaseGrnMaster/fetchAll",
  async (_params: { companyId?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-grn`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase GRN records");
      }
      const json = await response.json();
      const rows = json.data || [];
      return rows.map((u: any) => ({
        ...u,
        id: u.SNO ?? u.PURCHASE_GRN_REF_NO ?? u.id,
      }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase GRN records");
    }
  }
);

export const fetchPurchaseGrnHdr = createAsyncThunk(
  "purchaseGrnMaster/fetchHdr",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-grn/hdr/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase GRN header");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase GRN header");
    }
  }
);

export const fetchPurchaseGrnDtls = createAsyncThunk(
  "purchaseGrnMaster/fetchDtls",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-grn/dtls/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase GRN details");
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase GRN details");
    }
  }
);

export const fetchPurchaseGrnDtl = createAsyncThunk(
  "purchaseGrnMaster/fetchDtl",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-grn/dtl/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase GRN detail");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase GRN detail");
    }
  }
);

export const addPurchaseGrn = createAsyncThunk(
  "purchaseGrnMaster/add",
  async (item: PurchaseGrnGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-grn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add purchase GRN");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add purchase GRN");
    }
  }
);

export const updatePurchaseGrn = createAsyncThunk(
  "purchaseGrnMaster/update",
  async (item: PurchaseGrnGridData, { rejectWithValue }) => {
    try {
      const refNo = item.grnNo || item.PURCHASE_GRN_REF_NO || item.refNo || "";
      const response = await fetch(`${API_URL}/purchase-grn/${encodeURIComponent(refNo)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update purchase GRN");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update purchase GRN");
    }
  }
);

export const deletePurchaseGrnDtl = createAsyncThunk(
  "purchaseGrnMaster/deleteDtl",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-grn/dtl/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete purchase GRN detail");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase GRN detail");
    }
  }
);

export const deletePurchaseGrnHdr = createAsyncThunk(
  "purchaseGrnMaster/deleteHdr",
  async (refNo: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/purchase-grn/${encodeURIComponent(String(refNo))}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete purchase GRN");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase GRN");
    }
  }
);

const purchaseGrnMasterSlice = createSlice({
  name: "purchaseGrnMaster",
  initialState,
  reducers: {
    clearPurchaseGrnMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseGrns.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseGrns.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPurchaseGrns.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch purchase GRN records";
      })
      .addCase(addPurchaseGrn.pending, (state) => {
        state.error = null;
      })
      .addCase(addPurchaseGrn.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add purchase GRN";
      })
      .addCase(updatePurchaseGrn.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePurchaseGrn.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update purchase GRN";
      })
      .addCase(deletePurchaseGrnDtl.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePurchaseGrnDtl.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete purchase GRN detail";
      })
      .addCase(deletePurchaseGrnHdr.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePurchaseGrnHdr.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete purchase GRN";
      });
  },
});

export const { clearPurchaseGrnMasterError } = purchaseGrnMasterSlice.actions;
export default purchaseGrnMasterSlice.reducer;
