import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AttendanceDetailsGridData {
  id?: string | number;
  SNO?: number;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: number;
  ATT_REQUEST_REF_NO?: string;
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
  ATTENDANCE_TYPE_ID?: number;
  ELIGIBLE_DAYS?: number;
  DATE_FROM?: string;
  DATE_TO?: string;
  NO_OF_DAYS?: number;
  BALANCE_LEAVE?: number;
  REASON?: string;
  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  FINAL_RESPONSE_PERSON?: string;
  FINAL_RESPONSE_DATE?: string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface AttendanceDetailsState {
  items: AttendanceDetailsGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: AttendanceDetailsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAttendanceDetails = createAsyncThunk(
  "attendanceDetails/fetchAttendanceDetails",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/attendance-details?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch attendance details");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch attendance details");
    }
  }
);

export const addAttendanceDetail = createAsyncThunk(
  "attendanceDetails/addAttendanceDetail",
  async (item: AttendanceDetailsGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/attendance-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add attendance detail");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add attendance detail");
    }
  }
);

export const updateAttendanceDetail = createAsyncThunk(
  "attendanceDetails/updateAttendanceDetail",
  async (item: AttendanceDetailsGridData, { rejectWithValue }) => {
    try {
      const body = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/attendance-details/${body.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update attendance detail");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update attendance detail");
    }
  }
);

export const deleteAttendanceDetail = createAsyncThunk(
  "attendanceDetails/deleteAttendanceDetail",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/attendance-details/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete attendance detail");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete attendance detail");
    }
  }
);

const attendanceDetailsSlice = createSlice({
  name: "attendanceDetails",
  initialState,
  reducers: {
    clearAttendanceDetailsError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceDetails.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAttendanceDetails.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch attendance details";
      })
      .addCase(addAttendanceDetail.pending, (state) => { state.error = null; })
      .addCase(addAttendanceDetail.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add attendance detail";
      })
      .addCase(updateAttendanceDetail.pending, (state) => { state.error = null; })
      .addCase(updateAttendanceDetail.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update attendance detail";
      })
      .addCase(deleteAttendanceDetail.pending, (state) => { state.error = null; })
      .addCase(deleteAttendanceDetail.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete attendance detail";
      });
  },
});

export const { clearAttendanceDetailsError } = attendanceDetailsSlice.actions;
export default attendanceDetailsSlice.reducer;