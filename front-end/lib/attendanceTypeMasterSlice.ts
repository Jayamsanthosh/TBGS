import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AttendanceTypeGridData {
  id?: string | number;
  ATTENDANCE_TYPE_ID?: number;
  ATTENDANCE_TYPE_NAME: string;
  ELIGIBLE_DAYS?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface AttendanceTypeState {
  attendanceTypes: AttendanceTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: AttendanceTypeState = {
  attendanceTypes: [],
  loading: false,
  error: null,
};

export const fetchAttendanceTypes = createAsyncThunk(
  "attendanceType/fetchAttendanceTypes",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/attendance-type-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch attendance types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.ATTENDANCE_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch attendance types");
    }
  }
);

export const addAttendanceType = createAsyncThunk(
  "attendanceType/addAttendanceType",
  async (item: AttendanceTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/attendance-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add attendance type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add attendance type");
    }
  }
);

export const updateAttendanceType = createAsyncThunk(
  "attendanceType/updateAttendanceType",
  async (item: AttendanceTypeGridData, { rejectWithValue }) => {
    try {
      const body = { ...item, ATTENDANCE_TYPE_ID: Number(item.id) || item.ATTENDANCE_TYPE_ID };
      const response = await fetch(`${API_URL}/attendance-type-master/${body.ATTENDANCE_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update attendance type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update attendance type");
    }
  }
);

export const deleteAttendanceType = createAsyncThunk(
  "attendanceType/deleteAttendanceType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/attendance-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete attendance type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete attendance type");
    }
  }
);

const attendanceTypeSlice = createSlice({
  name: "attendanceType",
  initialState,
  reducers: {
    clearAttendanceTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.attendanceTypes = action.payload;
      })
      .addCase(fetchAttendanceTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch attendance types";
      })
      .addCase(addAttendanceType.pending, (state) => { state.error = null; })
      .addCase(addAttendanceType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add attendance type";
      })
      .addCase(updateAttendanceType.pending, (state) => { state.error = null; })
      .addCase(updateAttendanceType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update attendance type";
      })
      .addCase(deleteAttendanceType.pending, (state) => { state.error = null; })
      .addCase(deleteAttendanceType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete attendance type";
      });
  },
});

export const { clearAttendanceTypeError } = attendanceTypeSlice.actions;
export default attendanceTypeSlice.reducer;