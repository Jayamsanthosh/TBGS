import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface EmployeeDailyShiftDetailGridData {
  id?: string | number;
  SNO?: number;
  SHIFT_MONTH?: string;
  SHIFT_YEAR?: number;
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
  SHIFT_DATE?: string;
  SHIFT_WEEK_DAY?: string;
  SHIFT_SYSTEM?: string;
  SHIFT_NAME?: string;
  SHIFT_NAME_ID?: number;
  WEEK_DAY_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface EmployeeDailyShiftDetailState {
  items: EmployeeDailyShiftDetailGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeDailyShiftDetailState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchEmployeeDailyShiftDetails = createAsyncThunk(
  "employeeDailyShiftDetails/fetch",
  async (params: { empId?: string; status?: string }, { rejectWithValue }) => {
    try {
      const qs = new URLSearchParams();
      if (params.empId && String(params.empId).trim() !== "") qs.set("empId", params.empId);
      if (params.status && params.status !== "ALL") qs.set("status", params.status);
      const q = qs.toString();
      const url = `${API_URL}/employee-daily-shift-details${q ? `?${q}` : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch daily shift details");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch daily shift details");
    }
  }
);

export const getEmployeeDailyShiftDetailById = createAsyncThunk(
  "employeeDailyShiftDetails/getById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-daily-shift-details/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch daily shift detail");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch daily shift detail");
    }
  }
);

export const addEmployeeDailyShiftDetail = createAsyncThunk(
  "employeeDailyShiftDetails/add",
  async (item: EmployeeDailyShiftDetailGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-daily-shift-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add daily shift detail");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add daily shift detail");
    }
  }
);

export const updateEmployeeDailyShiftDetail = createAsyncThunk(
  "employeeDailyShiftDetails/update",
  async (item: EmployeeDailyShiftDetailGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/employee-daily-shift-details/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update daily shift detail");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update daily shift detail");
    }
  }
);

export const deleteEmployeeDailyShiftDetail = createAsyncThunk(
  "employeeDailyShiftDetails/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/employee-daily-shift-details/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete daily shift detail");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete daily shift detail");
    }
  }
);

const employeeDailyShiftDetailsSlice = createSlice({
  name: "employeeDailyShiftDetails",
  initialState,
  reducers: {
    clearEmployeeDailyShiftDetailError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeDailyShiftDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeDailyShiftDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEmployeeDailyShiftDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch daily shift details";
      })
      .addCase(addEmployeeDailyShiftDetail.pending, (state) => { state.error = null; })
      .addCase(addEmployeeDailyShiftDetail.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add daily shift detail";
      })
      .addCase(updateEmployeeDailyShiftDetail.pending, (state) => { state.error = null; })
      .addCase(updateEmployeeDailyShiftDetail.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update daily shift detail";
      })
      .addCase(deleteEmployeeDailyShiftDetail.pending, (state) => { state.error = null; })
      .addCase(deleteEmployeeDailyShiftDetail.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete daily shift detail";
      });
  },
});

export const { clearEmployeeDailyShiftDetailError } = employeeDailyShiftDetailsSlice.actions;
export default employeeDailyShiftDetailsSlice.reducer;
