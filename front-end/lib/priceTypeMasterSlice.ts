import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PriceTypeGridData {
  id?: string | number;
  PRICE_TYPE_ID?: number;
  PRICE_TYPE_NAME?: string;
  PRICE_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface PriceTypeState {
  priceTypes: PriceTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: PriceTypeState = {
  priceTypes: [],
  loading: false,
  error: null,
};

export const fetchPriceTypes = createAsyncThunk(
  "priceType/fetchPriceTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/price-type-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch price types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PRICE_TYPE_ID }));
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to fetch price types");
    }
  }
);

export const addPriceType = createAsyncThunk(
  "priceType/addPriceType",
  async (item: PriceTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/price-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add price type");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to add price type");
    }
  }
);

export const updatePriceType = createAsyncThunk(
  "priceType/updatePriceType",
  async (item: PriceTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PRICE_TYPE_ID: Number(item.id) || item.PRICE_TYPE_ID };
      const response = await fetch(`${API_URL}/price-type-master/${payload.PRICE_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update price type");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to update price type");
    }
  }
);

export const deletePriceType = createAsyncThunk(
  "priceType/deletePriceType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/price-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete price type");
      }
      return await response.json(); } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to delete price type");
    }
  }
);

const priceTypeSlice = createSlice({
  name: "priceType",
  initialState,
  reducers: {
    clearPriceTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPriceTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPriceTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.priceTypes = action.payload;
      })
      .addCase(fetchPriceTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch price types";
      })
      .addCase(addPriceType.pending, (state) => { state.error = null; })
      .addCase(addPriceType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add price type";
      })
      .addCase(updatePriceType.pending, (state) => { state.error = null; })
      .addCase(updatePriceType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update price type";
      })
      .addCase(deletePriceType.pending, (state) => { state.error = null; })
      .addCase(deletePriceType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete price type";
      });
  },
});

export const { clearPriceTypeError } = priceTypeSlice.actions;
export default priceTypeSlice.reducer;
