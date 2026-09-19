import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface OverTimeReferenceEntriesGridData {
  id?: string | number;
  SNO?: number;
  OT_REF_NO?: string;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: string;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  ACC_OT_REF_NO?: string;
  AMOUNT?: string | number;
  CURRENCY_ID?: number;
  CURRENCY_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  ROLE?: string;
  MAC_ADDRESS?: string;
}

interface OverTimeReferenceEntriesState {
  items: OverTimeReferenceEntriesGridData[];
  current: OverTimeReferenceEntriesGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: OverTimeReferenceEntriesState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchOverTimeReferenceEntries = createAsyncThunk(
  "overtimeReferenceEntries/fetchOverTimeReferenceEntries",
  async (args: { status?: string; fromDate?: string; toDate?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      query.set("status", args.status || "ALL");
      if (args.fromDate) query.set("fromDate", args.fromDate);
      if (args.toDate) query.set("toDate", args.toDate);
      const response = await fetch(`${API_URL}/overtime-reference-entries?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch over time reference entries");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch over time reference entries");
    }
  }
);

export const getOverTimeReferenceEntriesById = createAsyncThunk(
  "overtimeReferenceEntries/getOverTimeReferenceEntriesById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/overtime-reference-entries/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch over time reference entry");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch over time reference entry");
    }
  }
);

export const addOverTimeReferenceEntries = createAsyncThunk(
  "overtimeReferenceEntries/addOverTimeReferenceEntries",
  async (item: OverTimeReferenceEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/overtime-reference-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add over time reference entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add over time reference entry");
    }
  }
);

export const updateOverTimeReferenceEntries = createAsyncThunk(
  "overtimeReferenceEntries/updateOverTimeReferenceEntries",
  async (item: OverTimeReferenceEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const payload = { ...item, SNO: Number(item.id) || item.SNO, USER, MAC_ADDRESS };
      const response = await fetch(`${API_URL}/overtime-reference-entries/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update over time reference entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update over time reference entry");
    }
  }
);

export const submitOverTimeReferenceEntries = createAsyncThunk(
  "overtimeReferenceEntries/submitOverTimeReferenceEntries",
  async (refNo: string, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const Role = authUser?.role || authUser?.ROLE || "Administrator";
      const response = await fetch(`${API_URL}/overtime-reference-entries/${encodeURIComponent(String(refNo))}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Role }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit over time reference entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit over time reference entry");
    }
  }
);

export const deleteOverTimeReferenceEntries = createAsyncThunk(
  "overtimeReferenceEntries/deleteOverTimeReferenceEntries",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/overtime-reference-entries/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete over time reference entry");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete over time reference entry");
    }
  }
);

const overtimeReferenceEntriesSlice = createSlice({
  name: "overtimeReferenceEntries",
  initialState,
  reducers: {
    clearOverTimeReferenceEntriesError(state) {
      state.error = null;
    },
    clearCurrentOverTimeReferenceEntries(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverTimeReferenceEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverTimeReferenceEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOverTimeReferenceEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch over time reference entries";
      })
      .addCase(getOverTimeReferenceEntriesById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOverTimeReferenceEntriesById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getOverTimeReferenceEntriesById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch over time reference entry";
      })
      .addCase(addOverTimeReferenceEntries.pending, (state) => { state.error = null; })
      .addCase(addOverTimeReferenceEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add over time reference entry";
      })
      .addCase(updateOverTimeReferenceEntries.pending, (state) => { state.error = null; })
      .addCase(updateOverTimeReferenceEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update over time reference entry";
      })
      .addCase(submitOverTimeReferenceEntries.pending, (state) => { state.error = null; })
      .addCase(submitOverTimeReferenceEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to submit over time reference entry";
      })
      .addCase(deleteOverTimeReferenceEntries.pending, (state) => { state.error = null; })
      .addCase(deleteOverTimeReferenceEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete over time reference entry";
      });
  },
});

export const { clearOverTimeReferenceEntriesError, clearCurrentOverTimeReferenceEntries } = overtimeReferenceEntriesSlice.actions;
export default overtimeReferenceEntriesSlice.reducer;