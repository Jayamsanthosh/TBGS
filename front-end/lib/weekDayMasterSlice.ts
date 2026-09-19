import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface WeekDayMasterGridData {
  id?: string | number;
  WEEK_DAY_ID?: number;
  WEEK_DAY_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface WeekDayMasterState {
  weekDays: WeekDayMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: WeekDayMasterState = {
  weekDays: [],
  loading: false,
  error: null,
};

export const fetchWeekDays = createAsyncThunk(
  "weekDays/fetchWeekDays",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status && status !== "ALL"
        ? `${API_URL}/week-day-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/week-day-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch week days");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.WEEK_DAY_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch week days");
    }
  }
);

export const getWeekDayById = createAsyncThunk(
  "weekDays/getWeekDayById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/week-day-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch week day");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch week day");
    }
  }
);

export const addWeekDay = createAsyncThunk(
  "weekDays/addWeekDay",
  async (item: WeekDayMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/week-day-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add week day");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add week day");
    }
  }
);

export const updateWeekDay = createAsyncThunk(
  "weekDays/updateWeekDay",
  async (item: WeekDayMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, WEEK_DAY_ID: Number(item.id) || item.WEEK_DAY_ID };
      const response = await fetch(`${API_URL}/week-day-master/${payload.WEEK_DAY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update week day");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update week day");
    }
  }
);

export const deleteWeekDay = createAsyncThunk(
  "weekDays/deleteWeekDay",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/week-day-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete week day");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete week day");
    }
  }
);

const weekDayMasterSlice = createSlice({
  name: "weekDays",
  initialState,
  reducers: {
    clearWeekDayError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWeekDays.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWeekDays.fulfilled, (state, action) => {
        state.loading = false;
        state.weekDays = action.payload;
      })
      .addCase(fetchWeekDays.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch week days";
      })
      .addCase(addWeekDay.pending, (state) => { state.error = null; })
      .addCase(addWeekDay.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add week day";
      })
      .addCase(updateWeekDay.pending, (state) => { state.error = null; })
      .addCase(updateWeekDay.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update week day";
      })
      .addCase(deleteWeekDay.pending, (state) => { state.error = null; })
      .addCase(deleteWeekDay.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete week day";
      });
  },
});

export const { clearWeekDayError } = weekDayMasterSlice.actions;
export default weekDayMasterSlice.reducer;
