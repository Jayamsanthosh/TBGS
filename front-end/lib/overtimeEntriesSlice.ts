import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface OvertimeEntriesGridData {
  id?: string | number;
  SNO?: number;
  OT_REQUEST_REF_NO?: string;
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

  OT_FROM_DATE?: string;
  OT_TO_DATE?: string;
  OT_HOURS?: number;
  OT_AMOUNT?: number;
  PAYMENT_REF_NO?: string;
  PAYMENT_MODE_ID?: number;
  BANK_ID?: number;
  ACCOUNT_NO?: string;
  PAID_STATUS?: string;

  REASON?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface OvertimeEntriesState {
  items: OvertimeEntriesGridData[];
  current: OvertimeEntriesGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: OvertimeEntriesState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchOvertimeEntries = createAsyncThunk(
  "overtimeEntries/fetchOvertimeEntries",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/overtime-entries?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch overtime entries");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch overtime entries");
    }
  }
);

export const getOvertimeEntriesById = createAsyncThunk(
  "overtimeEntries/getOvertimeEntriesById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/overtime-entries/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch overtime entry");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch overtime entry");
    }
  }
);

export const addOvertimeEntries = createAsyncThunk(
  "overtimeEntries/addOvertimeEntries",
  async (item: OvertimeEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/overtime-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add overtime entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add overtime entry");
    }
  }
);

export const updateOvertimeEntries = createAsyncThunk(
  "overtimeEntries/updateOvertimeEntries",
  async (item: OvertimeEntriesGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/overtime-entries/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update overtime entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update overtime entry");
    }
  }
);

export const deleteOvertimeEntries = createAsyncThunk(
  "overtimeEntries/deleteOvertimeEntries",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/overtime-entries/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete overtime entry");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete overtime entry");
    }
  }
);

const overtimeEntriesSlice = createSlice({
  name: "overtimeEntries",
  initialState,
  reducers: {
    clearOvertimeEntriesError(state) {
      state.error = null;
    },
    clearCurrentOvertimeEntries(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOvertimeEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOvertimeEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOvertimeEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch overtime entries";
      })
      .addCase(getOvertimeEntriesById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOvertimeEntriesById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getOvertimeEntriesById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch overtime entry";
      })
      .addCase(addOvertimeEntries.pending, (state) => { state.error = null; })
      .addCase(addOvertimeEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add overtime entry";
      })
      .addCase(updateOvertimeEntries.pending, (state) => { state.error = null; })
      .addCase(updateOvertimeEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update overtime entry";
      })
      .addCase(deleteOvertimeEntries.pending, (state) => { state.error = null; })
      .addCase(deleteOvertimeEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete overtime entry";
      });
  },
});

export const { clearOvertimeEntriesError, clearCurrentOvertimeEntries } = overtimeEntriesSlice.actions;
export default overtimeEntriesSlice.reducer;
