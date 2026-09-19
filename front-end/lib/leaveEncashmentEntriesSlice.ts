import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface LeaveEncashmentEntriesGridData {
  id?: string | number;
  SNO?: number;
  LEAVE_ENCASHMENT_REQUEST_REF_NO?: string;
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

  BALANCE_LEAVE_DAYS?: number;
  LEAVE_ENCASHMENT_DAYS?: number;

  // Salary & Allowance breakdown
  BASIC_SALARY?: number;
  FOT_ALLOWANCE?: number;
  ATTENDANCE_ALLOWANCE?: number;
  ONE_1YP_ALLOWANCE?: number;
  TECHNICAL?: number;
  POLYVALENT?: number;
  RESPONSIBILITY?: number;
  LOYALTY?: number;
  PRODUCTIVITY?: number;
  CAPACITY?: number;
  DISCIPLINARY?: number;
  HOUSE_ALLOW?: number;
  MEDICIAL?: number;
  EDUCATION?: number;
  MISCELLANIES?: number;
  NIGHT_ALLOWANCE?: number;
  EXTRA1?: number;
  EXTRA2?: number;
  EXTRA3?: number;
  EXTRA4?: number;
  EXTRA5?: number;
  EXTRA6?: number;

  LEAVE_ENCASHMENT_GROSS_AMOUNT?: number;
  PAID_STATUS?: string;
  REASON?: string;

  REMARKS?: string;
  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface LeaveEncashmentEntriesState {
  items: LeaveEncashmentEntriesGridData[];
  current: LeaveEncashmentEntriesGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeaveEncashmentEntriesState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchLeaveEncashmentEntries = createAsyncThunk(
  "leaveEncashmentEntries/fetchLeaveEncashmentEntries",
  async (args: { status?: string; fromDate?: string; toDate?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      query.set("status", args.status || "ALL");
      if (args.fromDate) query.set("fromDate", args.fromDate);
      if (args.toDate) query.set("toDate", args.toDate);
      const response = await fetch(`${API_URL}/leave-encashment-entries?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch leave encashment entries");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch leave encashment entries");
    }
  }
);

export const getLeaveEncashmentEntriesById = createAsyncThunk(
  "leaveEncashmentEntries/getLeaveEncashmentEntriesById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/leave-encashment-entries/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch leave encashment entry");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch leave encashment entry");
    }
  }
);

export const addLeaveEncashmentEntry = createAsyncThunk(
  "leaveEncashmentEntries/addLeaveEncashmentEntry",
  async (item: LeaveEncashmentEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/leave-encashment-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add leave encashment entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add leave encashment entry");
    }
  }
);

export const updateLeaveEncashmentEntry = createAsyncThunk(
  "leaveEncashmentEntries/updateLeaveEncashmentEntry",
  async (item: LeaveEncashmentEntriesGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/leave-encashment-entries/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update leave encashment entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update leave encashment entry");
    }
  }
);

export const submitLeaveEncashmentEntries = createAsyncThunk(
  "leaveEncashmentEntries/submitLeaveEncashmentEntries",
  async (item: LeaveEncashmentEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const refNo = item.LEAVE_ENCASHMENT_REQUEST_REF_NO;
      const state: any = getState();
      const authUser = state.auth?.user;
      const Role = authUser?.role || authUser?.ROLE || "Administrator";
      const response = await fetch(`${API_URL}/leave-encashment-entries/${encodeURIComponent(String(refNo))}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Role }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit leave encashment entries");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit leave encashment entries");
    }
  }
);

export const deleteLeaveEncashmentEntry = createAsyncThunk(
  "leaveEncashmentEntries/deleteLeaveEncashmentEntry",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/leave-encashment-entries/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete leave encashment entry");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete leave encashment entry");
    }
  }
);

const leaveEncashmentEntriesSlice = createSlice({
  name: "leaveEncashmentEntries",
  initialState,
  reducers: {
    clearLeaveEncashmentEntriesError(state) {
      state.error = null;
    },
    clearCurrentLeaveEncashmentEntry(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaveEncashmentEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveEncashmentEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLeaveEncashmentEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch leave encashment entries";
      })
      .addCase(getLeaveEncashmentEntriesById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLeaveEncashmentEntriesById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getLeaveEncashmentEntriesById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch leave encashment entry";
      })
      .addCase(addLeaveEncashmentEntry.pending, (state) => { state.error = null; })
      .addCase(addLeaveEncashmentEntry.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add leave encashment entry";
      })
      .addCase(updateLeaveEncashmentEntry.pending, (state) => { state.error = null; })
      .addCase(updateLeaveEncashmentEntry.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update leave encashment entry";
      })
      .addCase(submitLeaveEncashmentEntries.pending, (state) => { state.error = null; })
      .addCase(submitLeaveEncashmentEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to submit leave encashment entries";
      })
      .addCase(deleteLeaveEncashmentEntry.pending, (state) => { state.error = null; })
      .addCase(deleteLeaveEncashmentEntry.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete leave encashment entry";
      });
  },
});

export const { clearLeaveEncashmentEntriesError, clearCurrentLeaveEncashmentEntry } = leaveEncashmentEntriesSlice.actions;
export default leaveEncashmentEntriesSlice.reducer;
