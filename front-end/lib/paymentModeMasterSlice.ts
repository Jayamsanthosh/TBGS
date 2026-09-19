import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PaymentModeGridData {
  id?: string | number;
  PAYMENT_MODE_ID?: number;
  PAYMENT_MODE_NAME: string;
  PAYMENT_MODE_PERCENTAGE?: number;
  REMARKS?: string;
  STATUS_ENTRY?: string;
}

interface PaymentModesState {
  paymentModes: PaymentModeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentModesState = {
  paymentModes: [],
  loading: false,
  error: null,
};

export const fetchPaymentModes = createAsyncThunk(
  "paymentModes/fetchPaymentModes",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status && status !== "ALL"
        ? `${API_URL}/payment-mode-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/payment-mode-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch payment modes");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PAYMENT_MODE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch payment modes");
    }
  }
);

export const addPaymentMode = createAsyncThunk(
  "paymentModes/addPaymentMode",
  async (item: PaymentModeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/payment-mode-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add payment mode");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add payment mode");
    }
  }
);

export const updatePaymentMode = createAsyncThunk(
  "paymentModes/updatePaymentMode",
  async (item: PaymentModeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PAYMENT_MODE_ID: Number(item.id) || item.PAYMENT_MODE_ID };
      const response = await fetch(`${API_URL}/payment-mode-master/${payload.PAYMENT_MODE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update payment mode");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update payment mode");
    }
  }
);

export const deletePaymentMode = createAsyncThunk(
  "paymentModes/deletePaymentMode",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/payment-mode-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete payment mode");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete payment mode");
    }
  }
);

const paymentModesSlice = createSlice({
  name: "paymentModes",
  initialState,
  reducers: {
    clearPaymentModesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentModes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentModes.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentModes = action.payload;
      })
      .addCase(fetchPaymentModes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch payment modes";
      })
      .addCase(addPaymentMode.pending, (state) => { state.error = null; })
      .addCase(addPaymentMode.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add payment mode";
      })
      .addCase(updatePaymentMode.pending, (state) => { state.error = null; })
      .addCase(updatePaymentMode.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update payment mode";
      })
      .addCase(deletePaymentMode.pending, (state) => { state.error = null; })
      .addCase(deletePaymentMode.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete payment mode";
      });
  },
});

export const { clearPaymentModesError } = paymentModesSlice.actions;
export default paymentModesSlice.reducer;
