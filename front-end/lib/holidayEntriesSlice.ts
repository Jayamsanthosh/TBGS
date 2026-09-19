import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface HolidayEntriesGridData {
  id?: string | number;
  HOLIDAY_ID?: number;
  HOLIDAY_DATE?: string;
  HOLIDAY_REASON: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface HolidayEntriesState {
  holidays: HolidayEntriesGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: HolidayEntriesState = {
  holidays: [],
  loading: false,
  error: null,
};

export const fetchHolidays = createAsyncThunk(
  "holidayEntries/fetchHolidays",
  async (args: { status?: string; fromDate?: string; toDate?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      query.set("status", args.status || "ALL");
      if (args.fromDate) query.set("fromDate", args.fromDate);
      if (args.toDate) query.set("toDate", args.toDate);
      const response = await fetch(`${API_URL}/holiday-entries?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch holidays");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.HOLIDAY_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch holidays");
    }
  }
);

export const addHoliday = createAsyncThunk(
  "holidayEntries/addHoliday",
  async (item: HolidayEntriesGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/holiday-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add holiday");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add holiday");
    }
  }
);

export const submitHoliday = createAsyncThunk(
  "holidayEntries/submitHoliday",
  async (item: HolidayEntriesGridData, { rejectWithValue }) => {
    try {
      const id = Number(item.id ?? item.HOLIDAY_ID);
      const response = await fetch(`${API_URL}/holiday-entries/${id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit holiday");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit holiday");
    }
  }
);

export const updateHoliday = createAsyncThunk(
  "holidayEntries/updateHoliday",
  async (item: HolidayEntriesGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, HOLIDAY_ID: Number(item.id) || item.HOLIDAY_ID };
      const response = await fetch(`${API_URL}/holiday-entries/${payload.HOLIDAY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update holiday");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update holiday");
    }
  }
);

export const deleteHoliday = createAsyncThunk(
  "holidayEntries/deleteHoliday",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/holiday-entries/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete holiday");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete holiday");
    }
  }
);

const holidayEntriesSlice = createSlice({
  name: "holidayEntries",
  initialState,
  reducers: {
    clearHolidayEntriesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHolidays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHolidays.fulfilled, (state, action) => {
        state.loading = false;
        state.holidays = action.payload;
      })
      .addCase(fetchHolidays.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch holidays";
      })
      .addCase(addHoliday.pending, (state) => { state.error = null; })
      .addCase(addHoliday.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add holiday";
      })
      .addCase(updateHoliday.pending, (state) => { state.error = null; })
      .addCase(updateHoliday.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update holiday";
      })
      .addCase(deleteHoliday.pending, (state) => { state.error = null; })
      .addCase(deleteHoliday.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete holiday";
      })
      .addCase(submitHoliday.pending, (state) => { state.error = null; })
      .addCase(submitHoliday.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to submit holiday";
      });
  },
});

export const { clearHolidayEntriesError } = holidayEntriesSlice.actions;
export default holidayEntriesSlice.reducer;
