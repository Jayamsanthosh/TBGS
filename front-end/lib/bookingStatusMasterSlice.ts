import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BookingStatusGridData {
  id?: string | number;
  BOOKING_STATUS_ID?: number;
  BOOKING_STATUS_NAME: string;
  BOOKING_STATUS_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BookingStatusState {
  bookingStatuses: BookingStatusGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BookingStatusState = {
  bookingStatuses: [],
  loading: false,
  error: null,
};

export const fetchBookingStatuses = createAsyncThunk(
  "bookingStatuses/fetchBookingStatuses",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/booking-status-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch booking statuses");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BOOKING_STATUS_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch booking statuses");
    }
  }
);

export const addBookingStatus = createAsyncThunk(
  "bookingStatuses/addBookingStatus",
  async (item: BookingStatusGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/booking-status-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add booking status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add booking status");
    }
  }
);

export const updateBookingStatus = createAsyncThunk(
  "bookingStatuses/updateBookingStatus",
  async (item: BookingStatusGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BOOKING_STATUS_ID: Number(item.id) || item.BOOKING_STATUS_ID };
      const response = await fetch(`${API_URL}/booking-status-master/${payload.BOOKING_STATUS_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update booking status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update booking status");
    }
  }
);

export const deleteBookingStatus = createAsyncThunk(
  "bookingStatuses/deleteBookingStatus",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/booking-status-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete booking status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete booking status");
    }
  }
);

const bookingStatusSlice = createSlice({
  name: "bookingStatuses",
  initialState,
  reducers: {
    clearBookingStatusError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingStatuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingStatuses = action.payload;
      })
      .addCase(fetchBookingStatuses.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch booking statuses";
      })
      .addCase(addBookingStatus.pending, (state) => { state.error = null; })
      .addCase(addBookingStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add booking status";
      })
      .addCase(updateBookingStatus.pending, (state) => { state.error = null; })
      .addCase(updateBookingStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update booking status";
      })
      .addCase(deleteBookingStatus.pending, (state) => { state.error = null; })
      .addCase(deleteBookingStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete booking status";
      });
  },
});

export const { clearBookingStatusError } = bookingStatusSlice.actions;
export default bookingStatusSlice.reducer;