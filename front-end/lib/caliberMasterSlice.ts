import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CaliberGridData {
  id?: string | number;
  CALIBER_ID?: number;
  CALIBER_CODE: string;
  CALIBER_NAME: string;
  METRIC_SIZE?: string;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface CaliberState {
  records: CaliberGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CaliberState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchCalibers = createAsyncThunk(
  "caliber/fetchCalibers",
  async (status: string = "AC", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/caliber-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch calibers");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.CALIBER_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch calibers");
    }
  }
);

export const addCaliber = createAsyncThunk(
  "caliber/addCaliber",
  async (item: CaliberGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/caliber-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add caliber");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add caliber");
    }
  }
);

export const updateCaliber = createAsyncThunk(
  "caliber/updateCaliber",
  async (item: CaliberGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, CALIBER_ID: Number(item.id) || item.CALIBER_ID };
      const response = await fetch(`${API_URL}/caliber-master/${payload.CALIBER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update caliber");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update caliber");
    }
  }
);

export const deleteCaliber = createAsyncThunk(
  "caliber/deleteCaliber",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/caliber-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete caliber");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete caliber");
    }
  }
);

const caliberSlice = createSlice({
  name: "caliber",
  initialState,
  reducers: {
    clearCaliberError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCalibers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCalibers.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchCalibers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch calibers";
      })
      .addCase(addCaliber.pending, (state) => { state.error = null; })
      .addCase(addCaliber.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add caliber";
      })
      .addCase(updateCaliber.pending, (state) => { state.error = null; })
      .addCase(updateCaliber.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update caliber";
      })
      .addCase(deleteCaliber.pending, (state) => { state.error = null; })
      .addCase(deleteCaliber.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete caliber";
      });
  },
});

export const { clearCaliberError } = caliberSlice.actions;
export default caliberSlice.reducer;
