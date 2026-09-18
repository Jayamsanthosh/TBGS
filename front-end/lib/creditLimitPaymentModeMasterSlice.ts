import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CreditLimitPaymentModeGridData {
  id?: string | number;
  PAYMENT_MODE_ID?: number;
  PAYMENT_MODE_NAME: string;
  PAYMENT_MODE_PERCENTAGE?: number;
  REMARKS?: string;
  STATUS_ENTRY?: string;
}

interface CreditLimitPaymentModeState {
  creditLimitPaymentModes: CreditLimitPaymentModeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CreditLimitPaymentModeState = {
  creditLimitPaymentModes: [],
  loading: false,
  error: null,
};

export const fetchCreditLimitPaymentModes = createAsyncThunk(
  "creditLimitPaymentMode/fetchCreditLimitPaymentModes",
  async (status: string = "", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/credit-limit-payment-mode-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch credit limit payment modes");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({
        ...u,
        id: u.PAYMENT_MODE_ID,
        statusEntry: u.STATUS_ENTRY,
      }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch credit limit payment modes");
    }
  }
);

export const addCreditLimitPaymentMode = createAsyncThunk(
  "creditLimitPaymentMode/addCreditLimitPaymentMode",
  async (item: CreditLimitPaymentModeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/credit-limit-payment-mode-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add credit limit payment mode");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add credit limit payment mode");
    }
  }
);

export const updateCreditLimitPaymentMode = createAsyncThunk(
  "creditLimitPaymentMode/updateCreditLimitPaymentMode",
  async (item: CreditLimitPaymentModeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PAYMENT_MODE_ID: Number(item.id) || item.PAYMENT_MODE_ID };
      const response = await fetch(`${API_URL}/credit-limit-payment-mode-master/${payload.PAYMENT_MODE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update credit limit payment mode");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update credit limit payment mode");
    }
  }
);

export const deleteCreditLimitPaymentMode = createAsyncThunk(
  "creditLimitPaymentMode/deleteCreditLimitPaymentMode",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/credit-limit-payment-mode-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete credit limit payment mode");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete credit limit payment mode");
    }
  }
);

const creditLimitPaymentModeSlice = createSlice({
  name: "creditLimitPaymentMode",
  initialState,
  reducers: {
    clearCreditLimitPaymentModeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCreditLimitPaymentModes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCreditLimitPaymentModes.fulfilled, (state, action) => {
        state.loading = false;
        state.creditLimitPaymentModes = action.payload;
      })
      .addCase(fetchCreditLimitPaymentModes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch credit limit payment modes";
      })
      .addCase(addCreditLimitPaymentMode.pending, (state) => { state.error = null; })
      .addCase(addCreditLimitPaymentMode.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add credit limit payment mode";
      })
      .addCase(updateCreditLimitPaymentMode.pending, (state) => { state.error = null; })
      .addCase(updateCreditLimitPaymentMode.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update credit limit payment mode";
      })
      .addCase(deleteCreditLimitPaymentMode.pending, (state) => { state.error = null; })
      .addCase(deleteCreditLimitPaymentMode.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete credit limit payment mode";
      });
  },
});

export const { clearCreditLimitPaymentModeError } = creditLimitPaymentModeSlice.actions;
export default creditLimitPaymentModeSlice.reducer;
