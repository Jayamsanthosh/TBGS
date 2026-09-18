import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface LicensePermitCostGridData {
  id?: string | number;
  SNO?: number;
  LICENSE_PERMIT_ID?: number;
  SALES_PACKAGE_TYPE_ID?: number;
  PRICE_TYPE_ID?: number;
  PRICE_PACKAGE_ID?: number;
  GOVT_RATE?: number;
  ACTUAL_AMOUNT?: number;
  CURRENCY_ID?: number;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface LicensePermitCostState {
  items: LicensePermitCostGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: LicensePermitCostState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchLicensePermitCosts = createAsyncThunk(
  "licensePermitCost/fetchAll",
  async (status: string = "AC", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/license-permit-cost?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch license permit costs");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch license permit costs");
    }
  }
);

export const addLicensePermitCost = createAsyncThunk(
  "licensePermitCost/add",
  async (item: LicensePermitCostGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/license-permit-cost`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add license permit cost");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add license permit cost");
    }
  }
);

export const updateLicensePermitCost = createAsyncThunk(
  "licensePermitCost/update",
  async (item: LicensePermitCostGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/license-permit-cost/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update license permit cost");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update license permit cost");
    }
  }
);

export const deleteLicensePermitCost = createAsyncThunk(
  "licensePermitCost/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/license-permit-cost/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete license permit cost");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete license permit cost");
    }
  }
);

const licensePermitCostSlice = createSlice({
  name: "licensePermitCost",
  initialState,
  reducers: {
    clearLicensePermitCostError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLicensePermitCosts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLicensePermitCosts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLicensePermitCosts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch license permit costs";
      })
      .addCase(addLicensePermitCost.pending, (state) => { state.error = null; })
      .addCase(addLicensePermitCost.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add license permit cost";
      })
      .addCase(updateLicensePermitCost.pending, (state) => { state.error = null; })
      .addCase(updateLicensePermitCost.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update license permit cost";
      })
      .addCase(deleteLicensePermitCost.pending, (state) => { state.error = null; })
      .addCase(deleteLicensePermitCost.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete license permit cost";
      });
  },
});

export const { clearLicensePermitCostError } = licensePermitCostSlice.actions;
export default licensePermitCostSlice.reducer;
