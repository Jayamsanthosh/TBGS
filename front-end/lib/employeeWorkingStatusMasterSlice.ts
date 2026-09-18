import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface EmployeeWorkingStatusGridData {
  id?: string | number;
  EMP_CURRENT_STATUS_ID?: number;
  EMP_CURRENT_STATUS_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface EmployeeWorkingStatusState {
  employeeWorkingStatuses: EmployeeWorkingStatusGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeWorkingStatusState = {
  employeeWorkingStatuses: [],
  loading: false,
  error: null,
};

export const fetchEmployeeWorkingStatuses = createAsyncThunk(
  "employeeWorkingStatus/fetchEmployeeWorkingStatuses",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/employee-working-status-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/employee-working-status-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch working statuses");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.EMP_CURRENT_STATUS_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch working statuses");
    }
  }
);

export const addEmployeeWorkingStatus = createAsyncThunk(
  "employeeWorkingStatus/addEmployeeWorkingStatus",
  async (item: EmployeeWorkingStatusGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-working-status-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add working status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add working status");
    }
  }
);

export const updateEmployeeWorkingStatus = createAsyncThunk(
  "employeeWorkingStatus/updateEmployeeWorkingStatus",
  async (item: EmployeeWorkingStatusGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, EMP_CURRENT_STATUS_ID: Number(item.id) || item.EMP_CURRENT_STATUS_ID };
      const response = await fetch(`${API_URL}/employee-working-status-master/${payload.EMP_CURRENT_STATUS_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update working status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update working status");
    }
  }
);

export const deleteEmployeeWorkingStatus = createAsyncThunk(
  "employeeWorkingStatus/deleteEmployeeWorkingStatus",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/employee-working-status-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete working status");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete working status");
    }
  }
);

const employeeWorkingStatusSlice = createSlice({
  name: "employeeWorkingStatus",
  initialState,
  reducers: {
    clearEmployeeWorkingStatusError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeWorkingStatuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeWorkingStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.employeeWorkingStatuses = action.payload;
      })
      .addCase(fetchEmployeeWorkingStatuses.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch working statuses";
      })
      .addCase(addEmployeeWorkingStatus.pending, (state) => { state.error = null; })
      .addCase(addEmployeeWorkingStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add working status";
      })
      .addCase(updateEmployeeWorkingStatus.pending, (state) => { state.error = null; })
      .addCase(updateEmployeeWorkingStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update working status";
      })
      .addCase(deleteEmployeeWorkingStatus.pending, (state) => { state.error = null; })
      .addCase(deleteEmployeeWorkingStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete working status";
      });
  },
});

export const { clearEmployeeWorkingStatusError } = employeeWorkingStatusSlice.actions;
export default employeeWorkingStatusSlice.reducer;
