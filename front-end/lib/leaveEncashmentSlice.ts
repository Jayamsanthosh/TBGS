import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface LeaveEncashmentGridData {
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
  LEAVE_ENCASHMENT_GROSS_AMOUNT?: number;
  REASON?: string;
  REMARKS?: string;

  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface LeaveEncashmentState {
  items: LeaveEncashmentGridData[];
  current: LeaveEncashmentGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: LeaveEncashmentState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchLeaveEncashments = createAsyncThunk(
  "leaveEncashment/fetchLeaveEncashments",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/leave-encashment-request?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch leave encashment requests");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch leave encashment requests");
    }
  }
);

export const getLeaveEncashmentById = createAsyncThunk(
  "leaveEncashment/getLeaveEncashmentById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/leave-encashment-request/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch leave encashment request");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch leave encashment request");
    }
  }
);

export const addLeaveEncashment = createAsyncThunk(
  "leaveEncashment/addLeaveEncashment",
  async (item: LeaveEncashmentGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/leave-encashment-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add leave encashment request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add leave encashment request");
    }
  }
);

export const updateLeaveEncashment = createAsyncThunk(
  "leaveEncashment/updateLeaveEncashment",
  async (item: LeaveEncashmentGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/leave-encashment-request/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update leave encashment request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update leave encashment request");
    }
  }
);

export const deleteLeaveEncashment = createAsyncThunk(
  "leaveEncashment/deleteLeaveEncashment",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/leave-encashment-request/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete leave encashment request");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete leave encashment request");
    }
  }
);

const leaveEncashmentSlice = createSlice({
  name: "leaveEncashment",
  initialState,
  reducers: {
    clearLeaveEncashmentError(state) {
      state.error = null;
    },
    clearCurrentLeaveEncashment(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeaveEncashments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLeaveEncashments.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLeaveEncashments.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch leave encashment requests";
      })
      .addCase(getLeaveEncashmentById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getLeaveEncashmentById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getLeaveEncashmentById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch leave encashment request";
      })
      .addCase(addLeaveEncashment.pending, (state) => { state.error = null; })
      .addCase(addLeaveEncashment.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add leave encashment request";
      })
      .addCase(updateLeaveEncashment.pending, (state) => { state.error = null; })
      .addCase(updateLeaveEncashment.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update leave encashment request";
      })
      .addCase(deleteLeaveEncashment.pending, (state) => { state.error = null; })
      .addCase(deleteLeaveEncashment.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete leave encashment request";
      });
  },
});

export const { clearLeaveEncashmentError, clearCurrentLeaveEncashment } = leaveEncashmentSlice.actions;
export default leaveEncashmentSlice.reducer;