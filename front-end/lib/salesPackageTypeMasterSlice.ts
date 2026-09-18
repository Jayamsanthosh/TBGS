import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface SalesPackageTypeGridData {
  id?: string | number;
  SALES_PACKAGE_TYPE_ID?: number;
  SALES_PACKAGE_TYPE_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface SalesPackageTypeState {
  salesPackageTypes: SalesPackageTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: SalesPackageTypeState = {
  salesPackageTypes: [],
  loading: false,
  error: null,
};

export const fetchSalesPackageTypes = createAsyncThunk(
  "salesPackageType/fetchSalesPackageTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sales-package-type-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch sales package types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SALES_PACKAGE_TYPE_ID }));
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to fetch sales package types");
    }
  }
);

export const addSalesPackageType = createAsyncThunk(
  "salesPackageType/addSalesPackageType",
  async (item: SalesPackageTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sales-package-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add sales package type");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to add sales package type");
    }
  }
);

export const updateSalesPackageType = createAsyncThunk(
  "salesPackageType/updateSalesPackageType",
  async (item: SalesPackageTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SALES_PACKAGE_TYPE_ID: Number(item.id) || item.SALES_PACKAGE_TYPE_ID };
      const response = await fetch(`${API_URL}/sales-package-type-master/${payload.SALES_PACKAGE_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update sales package type");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to update sales package type");
    }
  }
);

export const deleteSalesPackageType = createAsyncThunk(
  "salesPackageType/deleteSalesPackageType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/sales-package-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete sales package type");
      }
      return await response.json(); } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to delete sales package type");
    }
  }
);

const salesPackageTypeSlice = createSlice({
  name: "salesPackageType",
  initialState,
  reducers: {
    clearSalesPackageTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesPackageTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesPackageTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.salesPackageTypes = action.payload;
      })
      .addCase(fetchSalesPackageTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch sales package types";
      })
      .addCase(addSalesPackageType.pending, (state) => { state.error = null; })
      .addCase(addSalesPackageType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add sales package type";
      })
      .addCase(updateSalesPackageType.pending, (state) => { state.error = null; })
      .addCase(updateSalesPackageType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update sales package type";
      })
      .addCase(deleteSalesPackageType.pending, (state) => { state.error = null; })
      .addCase(deleteSalesPackageType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete sales package type";
      });
  },
});

export const { clearSalesPackageTypeError } = salesPackageTypeSlice.actions;
export default salesPackageTypeSlice.reducer;
