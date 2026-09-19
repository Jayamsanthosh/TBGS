import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BookingSourceGridData {
  id?: string | number;
  BOOKING_SOURCE_ID?: number;
  BOOKING_SOURCE_NAME: string;
  BOOKING_SOURCE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BookingSourceState {
  bookingSources: BookingSourceGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BookingSourceState = {
  bookingSources: [],
  loading: false,
  error: null,
};

export const fetchBookingSources = createAsyncThunk(
  "bookingSources/fetchBookingSources",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/booking-source-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch booking sources");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BOOKING_SOURCE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch booking sources");
    }
  }
);

export const addBookingSource = createAsyncThunk(
  "bookingSources/addBookingSource",
  async (item: BookingSourceGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/booking-source-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add booking source");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add booking source");
    }
  }
);

export const updateBookingSource = createAsyncThunk(
  "bookingSources/updateBookingSource",
  async (item: BookingSourceGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BOOKING_SOURCE_ID: Number(item.id) || item.BOOKING_SOURCE_ID };
      const response = await fetch(`${API_URL}/booking-source-master/${payload.BOOKING_SOURCE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update booking source");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update booking source");
    }
  }
);

export const deleteBookingSource = createAsyncThunk(
  "bookingSources/deleteBookingSource",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/booking-source-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete booking source");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete booking source");
    }
  }
);

const bookingSourceSlice = createSlice({
  name: "bookingSources",
  initialState,
  reducers: {
    clearBookingSourceError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingSources.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingSources.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingSources = action.payload;
      })
      .addCase(fetchBookingSources.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch booking sources";
      })
      .addCase(addBookingSource.pending, (state) => { state.error = null; })
      .addCase(addBookingSource.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add booking source";
      })
      .addCase(updateBookingSource.pending, (state) => { state.error = null; })
      .addCase(updateBookingSource.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update booking source";
      })
      .addCase(deleteBookingSource.pending, (state) => { state.error = null; })
      .addCase(deleteBookingSource.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete booking source";
      });
  },
});

export const { clearBookingSourceError } = bookingSourceSlice.actions;
export default bookingSourceSlice.reducer;