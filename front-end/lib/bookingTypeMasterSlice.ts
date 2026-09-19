import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BookingTypeGridData {
  id?: string | number;
  BOOKING_TYPE_ID?: number;
  BOOKING_TYPE_NAME: string;
  BOOKING_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BookingTypeState {
  bookingTypes: BookingTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BookingTypeState = {
  bookingTypes: [],
  loading: false,
  error: null,
};

export const fetchBookingTypes = createAsyncThunk(
  "bookingTypes/fetchBookingTypes",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/booking-type-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch booking types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BOOKING_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch booking types");
    }
  }
);

export const addBookingType = createAsyncThunk(
  "bookingTypes/addBookingType",
  async (item: BookingTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/booking-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add booking type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add booking type");
    }
  }
);

export const updateBookingType = createAsyncThunk(
  "bookingTypes/updateBookingType",
  async (item: BookingTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BOOKING_TYPE_ID: Number(item.id) || item.BOOKING_TYPE_ID };
      const response = await fetch(`${API_URL}/booking-type-master/${payload.BOOKING_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update booking type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update booking type");
    }
  }
);

export const deleteBookingType = createAsyncThunk(
  "bookingTypes/deleteBookingType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/booking-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete booking type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete booking type");
    }
  }
);

const bookingTypeSlice = createSlice({
  name: "bookingTypes",
  initialState,
  reducers: {
    clearBookingTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBookingTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBookingTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.bookingTypes = action.payload;
      })
      .addCase(fetchBookingTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch booking types";
      })
      .addCase(addBookingType.pending, (state) => { state.error = null; })
      .addCase(addBookingType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add booking type";
      })
      .addCase(updateBookingType.pending, (state) => { state.error = null; })
      .addCase(updateBookingType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update booking type";
      })
      .addCase(deleteBookingType.pending, (state) => { state.error = null; })
      .addCase(deleteBookingType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete booking type";
      });
  },
});

export const { clearBookingTypeError } = bookingTypeSlice.actions;
export default bookingTypeSlice.reducer;