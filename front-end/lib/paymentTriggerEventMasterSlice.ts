import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PaymentTriggerEventGridData {
  id?: string | number;
  TRIGGER_EVENT_ID?: number;
  TRIGGER_EVENT_CODE?: string;
  TRIGGER_EVENT_NAME?: string;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface PaymentTriggerEventsState {
  triggerEvents: PaymentTriggerEventGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: PaymentTriggerEventsState = {
  triggerEvents: [],
  loading: false,
  error: null,
};

export const fetchPaymentTriggerEvents = createAsyncThunk(
  "paymentTriggerEvents/fetchPaymentTriggerEvents",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/payment-trigger-event-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/payment-trigger-event-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch trigger events");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.TRIGGER_EVENT_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch trigger events");
    }
  }
);

export const addPaymentTriggerEvent = createAsyncThunk(
  "paymentTriggerEvents/addPaymentTriggerEvent",
  async (item: PaymentTriggerEventGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/payment-trigger-event-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add trigger event");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add trigger event");
    }
  }
);

export const updatePaymentTriggerEvent = createAsyncThunk(
  "paymentTriggerEvents/updatePaymentTriggerEvent",
  async (item: PaymentTriggerEventGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, TRIGGER_EVENT_ID: Number(item.id) || item.TRIGGER_EVENT_ID };
      const response = await fetch(`${API_URL}/payment-trigger-event-master/${payload.TRIGGER_EVENT_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update trigger event");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update trigger event");
    }
  }
);

export const deletePaymentTriggerEvent = createAsyncThunk(
  "paymentTriggerEvents/deletePaymentTriggerEvent",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/payment-trigger-event-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete trigger event");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete trigger event");
    }
  }
);

const paymentTriggerEventsSlice = createSlice({
  name: "paymentTriggerEvents",
  initialState,
  reducers: {
    clearPaymentTriggerEventsError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentTriggerEvents.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPaymentTriggerEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.triggerEvents = action.payload;
      })
      .addCase(fetchPaymentTriggerEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch trigger events";
      })
      .addCase(addPaymentTriggerEvent.pending, (state) => { state.error = null; })
      .addCase(addPaymentTriggerEvent.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add trigger event";
      })
      .addCase(updatePaymentTriggerEvent.pending, (state) => { state.error = null; })
      .addCase(updatePaymentTriggerEvent.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update trigger event";
      })
      .addCase(deletePaymentTriggerEvent.pending, (state) => { state.error = null; })
      .addCase(deletePaymentTriggerEvent.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete trigger event";
      });
  },
});

export const { clearPaymentTriggerEventsError } = paymentTriggerEventsSlice.actions;
export default paymentTriggerEventsSlice.reducer;
