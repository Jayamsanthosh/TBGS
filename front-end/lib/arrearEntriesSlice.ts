import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ArrearEntriesGridData {
  id?: string | number;
  SNO?: number;
  ARREAR_REQUEST_REF_NO?: string;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: number;

  EMP_ID?: number;
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;

  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DEPARTMENT_GROUP_ID?: number;
  DESIGNATION_GROUP_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  EMPLOYMENT_TYPE_ID?: number;
  CURRENCY_ID?: number;

  ARREAR_AMOUNT?: number;
  REASON?: string;
  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface ArrearEntriesState {
  items: ArrearEntriesGridData[];
  current: ArrearEntriesGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ArrearEntriesState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchArrearEntries = createAsyncThunk(
  "arrearEntries/fetchArrearEntries",
  async (args: string | { status?: string; fromDate?: string; toDate?: string } = "ALL", { rejectWithValue }) => {
    try {
      const params = typeof args === "string" ? { status: args, fromDate: "", toDate: "" } : args;
      const query = new URLSearchParams();
      query.set("status", params.status || "ALL");
      if (params.fromDate) query.set("fromDate", params.fromDate);
      if (params.toDate) query.set("toDate", params.toDate);
      const response = await fetch(`${API_URL}/arrear-entries?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch arrear entries");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch arrear entries");
    }
  }
);

export const getArrearEntriesById = createAsyncThunk(
  "arrearEntries/getArrearEntriesById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/arrear-entries/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch arrear entry");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch arrear entry");
    }
  }
);

export const addArrearEntries = createAsyncThunk(
  "arrearEntries/addArrearEntries",
  async (item: ArrearEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/arrear-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add arrear entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add arrear entry");
    }
  }
);

export const updateArrearEntries = createAsyncThunk(
  "arrearEntries/updateArrearEntries",
  async (item: ArrearEntriesGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/arrear-entries/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update arrear entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update arrear entry");
    }
  }
);

export const submitArrearEntries = createAsyncThunk(
  "arrearEntries/submitArrearEntries",
  async (item: ArrearEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const refNo = item.ARREAR_REQUEST_REF_NO;
      const state: any = getState();
      const authUser = state.auth?.user;
      const Role = authUser?.role || authUser?.ROLE || "Administrator";
      const response = await fetch(`${API_URL}/arrear-entries/${encodeURIComponent(String(refNo))}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Role }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit arrear entries");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit arrear entries");
    }
  }
);

export const deleteArrearEntries = createAsyncThunk(
  "arrearEntries/deleteArrearEntries",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/arrear-entries/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete arrear entry");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete arrear entry");
    }
  }
);

const arrearEntriesSlice = createSlice({
  name: "arrearEntries",
  initialState,
  reducers: {
    clearArrearEntriesError(state) {
      state.error = null;
    },
    clearCurrentArrearEntries(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArrearEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArrearEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchArrearEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch arrear entries";
      })
      .addCase(getArrearEntriesById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getArrearEntriesById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getArrearEntriesById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch arrear entry";
      })
      .addCase(addArrearEntries.pending, (state) => { state.error = null; })
      .addCase(addArrearEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add arrear entry";
      })
      .addCase(updateArrearEntries.pending, (state) => { state.error = null; })
      .addCase(updateArrearEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update arrear entry";
      })
      .addCase(submitArrearEntries.pending, (state) => { state.error = null; })
      .addCase(submitArrearEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to submit arrear entries";
      })
      .addCase(deleteArrearEntries.pending, (state) => { state.error = null; })
      .addCase(deleteArrearEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete arrear entry";
      });
  },
});

export const { clearArrearEntriesError, clearCurrentArrearEntries } = arrearEntriesSlice.actions;
export default arrearEntriesSlice.reducer;