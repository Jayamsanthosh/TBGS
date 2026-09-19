import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BpProductVatGridData {
  id?: string | number;
  BP_PROD_VAT_ID?: number;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  BP_ID?: number;
  BP_NAME?: string;
  MAIN_CATEGORY_ID?: number;
  MAIN_CATEGORY_NAME?: string;
  SUB_CATEGORY_ID?: number;
  SUB_CATEGORY_NAME?: string;
  PRODUCT_ID?: number;
  PRODUCT_NAME?: string;
  VAT_PERCENTAGE?: number | string;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REQUEST_STATUS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  FILE_COUNT?: number;
}

interface BpProductVatState {
  rows: BpProductVatGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BpProductVatState = {
  rows: [],
  loading: false,
  error: null,
};

export const fetchBpProductVat = createAsyncThunk(
  "bpProductVat/fetchBpProductVat",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/bp-product-vat-percentage-settings?status=${encodeURIComponent(status)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch records");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BP_PROD_VAT_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch records");
    }
  }
);

export const fetchBpProductVatById = createAsyncThunk(
  "bpProductVat/fetchBpProductVatById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bp-product-vat-percentage-settings/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch record");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch record");
    }
  }
);

export const addBpProductVat = createAsyncThunk(
  "bpProductVat/addBpProductVat",
  async (item: BpProductVatGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bp-product-vat-percentage-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to save record");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to save record");
    }
  }
);

export const updateBpProductVat = createAsyncThunk(
  "bpProductVat/updateBpProductVat",
  async (item: BpProductVatGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BP_PROD_VAT_ID: Number(item.id) || item.BP_PROD_VAT_ID };
      const response = await fetch(`${API_URL}/bp-product-vat-percentage-settings/${payload.BP_PROD_VAT_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update record");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update record");
    }
  }
);

export const submitBpProductVat = createAsyncThunk(
  "bpProductVat/submitBpProductVat",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const ROLE = authUser?.role || authUser?.ROLE || "Administrator";
      const response = await fetch(
        `${API_URL}/bp-product-vat-percentage-settings/${id}/submit?ROLE=${encodeURIComponent(ROLE)}`,
        { method: "POST" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit record");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit record");
    }
  }
);

export const deleteBpProductVat = createAsyncThunk(
  "bpProductVat/deleteBpProductVat",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/bp-product-vat-percentage-settings/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete record");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete record");
    }
  }
);

const bpProductVatSlice = createSlice({
  name: "bpProductVat",
  initialState,
  reducers: {
    clearBpProductVatError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBpProductVat.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBpProductVat.fulfilled, (state, action) => {
        state.loading = false;
        state.rows = action.payload;
      })
      .addCase(fetchBpProductVat.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch records";
      })
      .addCase(addBpProductVat.pending, (state) => { state.error = null; })
      .addCase(addBpProductVat.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to save record";
      })
      .addCase(updateBpProductVat.pending, (state) => { state.error = null; })
      .addCase(updateBpProductVat.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update record";
      })
      .addCase(submitBpProductVat.pending, (state) => { state.error = null; })
      .addCase(submitBpProductVat.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to submit record";
      })
      .addCase(deleteBpProductVat.pending, (state) => { state.error = null; })
      .addCase(deleteBpProductVat.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete record";
      });
  },
});

export const { clearBpProductVatError } = bpProductVatSlice.actions;
export default bpProductVatSlice.reducer;
