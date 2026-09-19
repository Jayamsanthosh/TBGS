import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ShiftNameMasterGridData {
  id?: string | number;
  SHIFT_NAME_ID?: number;
  SHIFT_NAME?: string;
  SHIFT_DESCRIPTION?: string;
  IN_TIME?: string;
  OUT_TIME?: string;
  TOTAL_HOURS?: number;
  BREAK_HOURS?: number;
  ACTUAL_WORKING_HOURS?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ShiftNameMasterState {
  shiftNames: ShiftNameMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ShiftNameMasterState = {
  shiftNames: [],
  loading: false,
  error: null,
};

export const fetchShiftNames = createAsyncThunk(
  "shiftNames/fetchShiftNames",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status && status !== "ALL"
        ? `${API_URL}/shift-name-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/shift-name-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch shift names");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SHIFT_NAME_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch shift names");
    }
  }
);

export const getShiftNameById = createAsyncThunk(
  "shiftNames/getShiftNameById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/shift-name-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch shift name");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch shift name");
    }
  }
);

export const addShiftName = createAsyncThunk(
  "shiftNames/addShiftName",
  async (item: ShiftNameMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/shift-name-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add shift name");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add shift name");
    }
  }
);

export const updateShiftName = createAsyncThunk(
  "shiftNames/updateShiftName",
  async (item: ShiftNameMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SHIFT_NAME_ID: Number(item.id) || item.SHIFT_NAME_ID };
      const response = await fetch(`${API_URL}/shift-name-master/${payload.SHIFT_NAME_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update shift name");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update shift name");
    }
  }
);

export const deleteShiftName = createAsyncThunk(
  "shiftNames/deleteShiftName",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/shift-name-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete shift name");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete shift name");
    }
  }
);

const shiftNamesSlice = createSlice({
  name: "shiftNames",
  initialState,
  reducers: {
    clearShiftNameError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShiftNames.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShiftNames.fulfilled, (state, action) => {
        state.loading = false;
        state.shiftNames = action.payload;
      })
      .addCase(fetchShiftNames.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch shift names";
      })
      .addCase(addShiftName.pending, (state) => { state.error = null; })
      .addCase(addShiftName.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add shift name";
      })
      .addCase(updateShiftName.pending, (state) => { state.error = null; })
      .addCase(updateShiftName.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update shift name";
      })
      .addCase(deleteShiftName.pending, (state) => { state.error = null; })
      .addCase(deleteShiftName.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete shift name";
      });
  },
});

export const { clearShiftNameError } = shiftNamesSlice.actions;
export default shiftNamesSlice.reducer;
