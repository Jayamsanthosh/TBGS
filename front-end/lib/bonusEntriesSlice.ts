import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BonusEntriesGridData {
  id?: string | number;
  SNO?: number;
  BONUS_REQUEST_REF_NO?: string;
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

  BONUS_TYPE?: string;
  REQUEST_AMOUNT?: number;
  APPROVED_AMOUNT?: number;
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

interface BonusEntriesState {
  items: BonusEntriesGridData[];
  current: BonusEntriesGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: BonusEntriesState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchBonusEntries = createAsyncThunk(
  "bonusEntries/fetchBonusEntries",
  async (args: { status?: string; fromDate?: string; toDate?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      query.set("status", args.status || "ALL");
      if (args.fromDate) query.set("fromDate", args.fromDate);
      if (args.toDate) query.set("toDate", args.toDate);
      const response = await fetch(`${API_URL}/bonus-entries?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch bonus entries");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch bonus entries");
    }
  }
);

export const getBonusEntriesById = createAsyncThunk(
  "bonusEntries/getBonusEntriesById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bonus-entries/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch bonus entry");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch bonus entry");
    }
  }
);

export const addBonusEntries = createAsyncThunk(
  "bonusEntries/addBonusEntries",
  async (item: BonusEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/bonus-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add bonus entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add bonus entry");
    }
  }
);

export const updateBonusEntries = createAsyncThunk(
  "bonusEntries/updateBonusEntries",
  async (item: BonusEntriesGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/bonus-entries/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update bonus entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update bonus entry");
    }
  }
);

export const submitBonusEntries = createAsyncThunk(
  "bonusEntries/submitBonusEntries",
  async (item: BonusEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const refNo = item.BONUS_REQUEST_REF_NO;
      const state: any = getState();
      const authUser = state.auth?.user;
      const Role = authUser?.role || authUser?.ROLE || "Administrator";
      const response = await fetch(`${API_URL}/bonus-entries/${encodeURIComponent(String(refNo))}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Role }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit bonus entries");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit bonus entries");
    }
  }
);

export const deleteBonusEntries = createAsyncThunk(
  "bonusEntries/deleteBonusEntries",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/bonus-entries/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete bonus entry");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete bonus entry");
    }
  }
);

const bonusEntriesSlice = createSlice({
  name: "bonusEntries",
  initialState,
  reducers: {
    clearBonusEntriesError(state) {
      state.error = null;
    },
    clearCurrentBonusEntries(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBonusEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBonusEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBonusEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch bonus entries";
      })
      .addCase(getBonusEntriesById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBonusEntriesById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getBonusEntriesById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch bonus entry";
      })
      .addCase(addBonusEntries.pending, (state) => { state.error = null; })
      .addCase(addBonusEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add bonus entry";
      })
      .addCase(updateBonusEntries.pending, (state) => { state.error = null; })
      .addCase(updateBonusEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update bonus entry";
      })
      .addCase(submitBonusEntries.pending, (state) => { state.error = null; })
      .addCase(submitBonusEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to submit bonus entries";
      })
      .addCase(deleteBonusEntries.pending, (state) => { state.error = null; })
      .addCase(deleteBonusEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete bonus entry";
      });
  },
});

export const { clearBonusEntriesError, clearCurrentBonusEntries } = bonusEntriesSlice.actions;
export default bonusEntriesSlice.reducer;