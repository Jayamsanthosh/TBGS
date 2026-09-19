import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PriceListGridData {
  id?: string | number;
  PRICE_LIST_ID?: number;
  PRICE_TYPE_ID?: number;
  PRICE_TYPE_NAME?: string;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  PRICE_PACKAGE_ID?: number;
  PRICE_PACKAGE_NAME?: string;
  CURRENCY_ID?: number;
  CURRENCY_NAME?: string;
  PER_DAY_OR_TRIP_OR_QTY_PRICE?: number;
  FOOD_LIMIT_AMOUNT?: number;
  DRINKS_LIMIT_AMOUNT?: number;
  ACCOMDATION_LIMIT_AMOUNT?: number;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface PriceListState {
  priceLists: PriceListGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: PriceListState = {
  priceLists: [],
  loading: false,
  error: null,
};

export const fetchPriceLists = createAsyncThunk(
  "priceList/fetchPriceLists",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/price-list-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch price lists");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PRICE_LIST_ID }));
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to fetch price lists");
    }
  }
);

export const addPriceList = createAsyncThunk(
  "priceList/addPriceList",
  async (item: PriceListGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/price-list-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add price list");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to add price list");
    }
  }
);

export const updatePriceList = createAsyncThunk(
  "priceList/updatePriceList",
  async (item: PriceListGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PRICE_LIST_ID: Number(item.id) || item.PRICE_LIST_ID };
      const response = await fetch(`${API_URL}/price-list-master/${payload.PRICE_LIST_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update price list");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to update price list");
    }
  }
);

export const deletePriceList = createAsyncThunk(
  "priceList/deletePriceList",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/price-list-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete price list");
      }
      return await response.json(); } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to delete price list");
    }
  }
);

const priceListSlice = createSlice({
  name: "priceList",
  initialState,
  reducers: {
    clearPriceListError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPriceLists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPriceLists.fulfilled, (state, action) => {
        state.loading = false;
        state.priceLists = action.payload;
      })
      .addCase(fetchPriceLists.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch price lists";
      })
      .addCase(addPriceList.pending, (state) => { state.error = null; })
      .addCase(addPriceList.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add price list";
      })
      .addCase(updatePriceList.pending, (state) => { state.error = null; })
      .addCase(updatePriceList.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update price list";
      })
      .addCase(deletePriceList.pending, (state) => { state.error = null; })
      .addCase(deletePriceList.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete price list";
      });
  },
});

export const { clearPriceListError } = priceListSlice.actions;
export default priceListSlice.reducer;
