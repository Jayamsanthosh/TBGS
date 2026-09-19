import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface LaborChargeEntriesGridData {
  id?: string | number;
  SNO?: number;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: string;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  AMOUNT?: string | number;
  CURRENCY_ID?: number;
  CURRENCY_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  ROLE?: string;
  MAC_ADDRESS?: string;
}

interface LaborChargeEntriesState {
  items: LaborChargeEntriesGridData[];
  current: LaborChargeEntriesGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: LaborChargeEntriesState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchLaborChargeEntries = createAsyncThunk(
  "laborChargeEntries/fetchLaborChargeEntries",
  async (args: { status?: string; fromDate?: string; toDate?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      query.set("status", args.status || "ALL");
      if (args.fromDate) query.set("fromDate", args.fromDate);
      if (args.toDate) query.set("toDate", args.toDate);
      const response = await fetch(`${API_URL}/labor-charge-entries?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch labor charge entries");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch labor charge entries");
    }
  }
);

export const getLaborChargeEntriesById = createAsyncThunk(
  "laborChargeEntries/getLaborChargeEntriesById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/labor-charge-entries/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch labor charge entry");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch labor charge entry");
    }
  }
);

export const addLaborChargeEntries = createAsyncThunk(
  "laborChargeEntries/addLaborChargeEntries",
  async (item: LaborChargeEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/labor-charge-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add labor charge entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add labor charge entry");
    }
  }
);

export const updateLaborChargeEntries = createAsyncThunk(
  "laborChargeEntries/updateLaborChargeEntries",
  async (item: LaborChargeEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const payload = { ...item, SNO: Number(item.id) || item.SNO, USER, MAC_ADDRESS };
      const response = await fetch(`${API_URL}/labor-charge-entries/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update labor charge entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update labor charge entry");
    }
  }
);

export const submitLaborChargeEntries = createAsyncThunk(
  "laborChargeEntries/submitLaborChargeEntries",
  async (sno: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const Role = authUser?.role || authUser?.ROLE || "Administrator";
      const response = await fetch(`${API_URL}/labor-charge-entries/${encodeURIComponent(String(sno))}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Role }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit labor charge entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit labor charge entry");
    }
  }
);

export const deleteLaborChargeEntries = createAsyncThunk(
  "laborChargeEntries/deleteLaborChargeEntries",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/labor-charge-entries/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete labor charge entry");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete labor charge entry");
    }
  }
);

const laborChargeEntriesSlice = createSlice({
  name: "laborChargeEntries",
  initialState,
  reducers: {
    clearLaborChargeEntriesError(state) {
      state.error = null;
    },
    clearCurrentLaborChargeEntries(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLaborChargeEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLaborChargeEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLaborChargeEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch labor charge entries";
      })
      .addCase(getLaborChargeEntriesById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLaborChargeEntriesById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getLaborChargeEntriesById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch labor charge entry";
      })
      .addCase(addLaborChargeEntries.pending, (state) => { state.error = null; })
      .addCase(addLaborChargeEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add labor charge entry";
      })
      .addCase(updateLaborChargeEntries.pending, (state) => { state.error = null; })
      .addCase(updateLaborChargeEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update labor charge entry";
      })
      .addCase(submitLaborChargeEntries.pending, (state) => { state.error = null; })
      .addCase(submitLaborChargeEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to submit labor charge entry";
      })
      .addCase(deleteLaborChargeEntries.pending, (state) => { state.error = null; })
      .addCase(deleteLaborChargeEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete labor charge entry";
      });
  },
});

export const { clearLaborChargeEntriesError, clearCurrentLaborChargeEntries } = laborChargeEntriesSlice.actions;
export default laborChargeEntriesSlice.reducer;