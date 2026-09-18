import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ExchangeRateGridData {
  id?: string | number;
  SNO?: number;
  COMPANY_ID: number;
  MONTH_ENTERED: string;
  YEAR_ENTERED: string;
  DATE_OF_EXCHANGE: string;
  FROM_CURRENCY_ID: number;
  TO_CURRENCY_ID: number;
  EXCHANGE_RATE: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ExchangeRatesState {
  exchangeRates: ExchangeRateGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ExchangeRatesState = {
  exchangeRates: [],
  loading: false,
  error: null,
};

export const fetchExchangeRates = createAsyncThunk(
  "exchangeRates/fetchExchangeRates",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/exchange-rate-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch exchange rates");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch exchange rates");
    }
  }
);

export const addExchangeRate = createAsyncThunk(
  "exchangeRates/addExchangeRate",
  async (item: ExchangeRateGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/exchange-rate-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add exchange rate");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add exchange rate");
    }
  }
);

export const updateExchangeRate = createAsyncThunk(
  "exchangeRates/updateExchangeRate",
  async (item: ExchangeRateGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/exchange-rate-master/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update exchange rate");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update exchange rate");
    }
  }
);

export const deleteExchangeRate = createAsyncThunk(
  "exchangeRates/deleteExchangeRate",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/exchange-rate-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete exchange rate");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete exchange rate");
    }
  }
);

const exchangeRatesSlice = createSlice({
  name: "exchangeRates",
  initialState,
  reducers: {
    clearExchangeRatesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExchangeRates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExchangeRates.fulfilled, (state, action) => {
        state.loading = false;
        state.exchangeRates = action.payload;
      })
      .addCase(fetchExchangeRates.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch exchange rates";
      })
      .addCase(addExchangeRate.pending, (state) => { state.error = null; })
      .addCase(addExchangeRate.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add exchange rate";
      })
      .addCase(updateExchangeRate.pending, (state) => { state.error = null; })
      .addCase(updateExchangeRate.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update exchange rate";
      })
      .addCase(deleteExchangeRate.pending, (state) => { state.error = null; })
      .addCase(deleteExchangeRate.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete exchange rate";
      });
  },
});

export const { clearExchangeRatesError } = exchangeRatesSlice.actions;
export default exchangeRatesSlice.reducer;
