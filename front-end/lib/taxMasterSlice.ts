import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface TaxMasterGridData {
  id?: string | number;
  TAX_ID?: number;
  TAX_CODE: string;
  TAX_NAME: string;
  TAX_PERCENTAGE?: number;
  TAX_TYPE?: string;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface TaxMasterState {
  taxes: TaxMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: TaxMasterState = {
  taxes: [],
  loading: false,
  error: null,
};

export const fetchTaxes = createAsyncThunk(
  "taxMaster/fetchTaxes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/tax-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch taxes");
      }
      const json = await response.json();
      return (json.data || []).map((u: Record<string, unknown>) => ({ ...u, id: u.TAX_ID }));
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch taxes");
    }
  }
);

export const addTax = createAsyncThunk(
  "taxMaster/addTax",
  async (item: TaxMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/tax-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add tax");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to add tax");
    }
  }
);

export const updateTax = createAsyncThunk(
  "taxMaster/updateTax",
  async (item: TaxMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, TAX_ID: Number(item.id) || item.TAX_ID };
      const response = await fetch(`${API_URL}/tax-master/${payload.TAX_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update tax");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update tax");
    }
  }
);

export const deleteTax = createAsyncThunk(
  "taxMaster/deleteTax",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth?: { user?: Record<string, string> } };
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/tax-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete tax");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete tax");
    }
  }
);

const taxMasterSlice = createSlice({
  name: "taxMaster",
  initialState,
  reducers: {
    clearTaxMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTaxes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTaxes.fulfilled, (state, action) => {
        state.loading = false;
        state.taxes = action.payload;
      })
      .addCase(fetchTaxes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch taxes";
      })
      .addCase(addTax.pending, (state) => { state.error = null; })
      .addCase(addTax.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add tax";
      })
      .addCase(updateTax.pending, (state) => { state.error = null; })
      .addCase(updateTax.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update tax";
      })
      .addCase(deleteTax.pending, (state) => { state.error = null; })
      .addCase(deleteTax.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete tax";
      });
  },
});

export const { clearTaxMasterError } = taxMasterSlice.actions;
export default taxMasterSlice.reducer;