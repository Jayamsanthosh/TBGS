import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PaymentTermGridData {
  id?: string | number;
  PAYMENT_TERM_ID?: number;
  PAYMENT_TERM_CODE: string;
  PAYMENT_TERM_NAME: string;
  TRIGGER_EVENT_ID?: number;
  DUE_DATE_CALCULATION?: string;
  NO_OF_DAYS?: number;
  DOWN_PAYMENT_PERCENTAGE?: number;
  BALANCE_PAYMENT_PERCENTAGE?: number;
  INSTALLMENT_ALLOWED?: string;
  NO_OF_INSTALLMENTS?: number;
  INTEREST_RATE?: number;
  GRACE_PERIOD_DAYS?: number;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface PaymentTermState {
  paymentTerms: PaymentTermGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentTermState = {
  paymentTerms: [],
  loading: false,
  error: null,
};

export const fetchPaymentTerms = createAsyncThunk(
  "paymentTerm/fetchPaymentTerms",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/payment-term-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch payment terms");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PAYMENT_TERM_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch payment terms");
    }
  }
);

export const addPaymentTerm = createAsyncThunk(
  "paymentTerm/addPaymentTerm",
  async (item: PaymentTermGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/payment-term-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add payment term");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add payment term");
    }
  }
);

export const updatePaymentTerm = createAsyncThunk(
  "paymentTerm/updatePaymentTerm",
  async (item: PaymentTermGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PAYMENT_TERM_ID: Number(item.id) || item.PAYMENT_TERM_ID };
      const response = await fetch(`${API_URL}/payment-term-master/${payload.PAYMENT_TERM_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update payment term");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update payment term");
    }
  }
);

export const deletePaymentTerm = createAsyncThunk(
  "paymentTerm/deletePaymentTerm",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/payment-term-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete payment term");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete payment term");
    }
  }
);

const paymentTermSlice = createSlice({
  name: "paymentTerm",
  initialState,
  reducers: {
    clearPaymentTermError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentTerms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentTerms.fulfilled, (state, action) => {
        state.loading = false;
        state.paymentTerms = action.payload;
      })
      .addCase(fetchPaymentTerms.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch payment terms";
      })
      .addCase(addPaymentTerm.pending, (state) => { state.error = null; })
      .addCase(addPaymentTerm.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add payment term";
      })
      .addCase(updatePaymentTerm.pending, (state) => { state.error = null; })
      .addCase(updatePaymentTerm.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update payment term";
      })
      .addCase(deletePaymentTerm.pending, (state) => { state.error = null; })
      .addCase(deletePaymentTerm.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete payment term";
      });
  },
});

export const { clearPaymentTermError } = paymentTermSlice.actions;
export default paymentTermSlice.reducer;
