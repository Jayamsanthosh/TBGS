import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CurrencyGridData {
  id?: string | number;
  CURRENCY_ID?: number;
  CURRENCY_NAME: string;
  ADDRESS?: string;
  Exchange_Rate?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface CurrenciesState {
  currencies: CurrencyGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CurrenciesState = {
  currencies: [],
  loading: false,
  error: null,
};

export const fetchCurrencies = createAsyncThunk(
  "currencies/fetchCurrencies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/currency-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch currencies");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.CURRENCY_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch currencies");
    }
  }
);

export const addCurrency = createAsyncThunk(
  "currencies/addCurrency",
  async (item: CurrencyGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/currency-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add currency");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add currency");
    }
  }
);

export const updateCurrency = createAsyncThunk(
  "currencies/updateCurrency",
  async (item: CurrencyGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, CURRENCY_ID: Number(item.id) || item.CURRENCY_ID };
      const response = await fetch(`${API_URL}/currency-master/${payload.CURRENCY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update currency");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update currency");
    }
  }
);

export const deleteCurrency = createAsyncThunk(
  "currencies/deleteCurrency",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/currency-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete currency");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete currency");
    }
  }
);

const currenciesSlice = createSlice({
  name: "currencies",
  initialState,
  reducers: {
    clearCurrenciesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrencies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrencies.fulfilled, (state, action) => {
        state.loading = false;
        state.currencies = action.payload;
      })
      .addCase(fetchCurrencies.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch currencies";
      })
      .addCase(addCurrency.pending, (state) => { state.error = null; })
      .addCase(addCurrency.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add currency";
      })
      .addCase(updateCurrency.pending, (state) => { state.error = null; })
      .addCase(updateCurrency.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update currency";
      })
      .addCase(deleteCurrency.pending, (state) => { state.error = null; })
      .addCase(deleteCurrency.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete currency";
      });
  },
});

export const { clearCurrenciesError } = currenciesSlice.actions;
export default currenciesSlice.reducer;
