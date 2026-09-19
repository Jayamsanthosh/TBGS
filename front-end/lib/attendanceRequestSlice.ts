import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AttendanceRequestGridData {
  id?: string | number;
  SNO?: number;
  ATT_REQUEST_REF_NO?: string;
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

  REMARKS?: string;
  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
}

interface AttendanceRequestState {
  items: AttendanceRequestGridData[];
  current: AttendanceRequestGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: AttendanceRequestState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchAttendanceRequests = createAsyncThunk(
  "attendanceRequest/fetchAttendanceRequests",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/attendance-request?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch attendance requests");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch attendance requests");
    }
  }
);

export const getAttendanceRequestById = createAsyncThunk(
  "attendanceRequest/getAttendanceRequestById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/attendance-request/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch attendance request");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch attendance request");
    }
  }
);

function parsePendingRequestError(raw: string): string {
  const refMatch = raw.match(/Ref Nos\s*\[\s*\(\s*([^)]+)\s*\)\s*=>\s*([^)\]]+)\s*\]/i);
  if (refMatch) {
    const refNo = refMatch[1].trim();
    const userName = refMatch[2].trim();
    return `A pending request already exists (Ref: ${refNo} for ${userName}). Please update it before creating a new one.`;
  }
  if (/previous request is pending/i.test(raw)) {
    return "A pending request already exists for this employee. Please update the previous request before creating a new one.";
  }
  return raw;
}

export const addAttendanceRequest = createAsyncThunk(
  "attendanceRequest/addAttendanceRequest",
  async (item: AttendanceRequestGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/attendance-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const raw = errorData.message || "Failed to add attendance request";
        return rejectWithValue(parsePendingRequestError(raw));
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add attendance request");
    }
  }
);

export const updateAttendanceRequest = createAsyncThunk(
  "attendanceRequest/updateAttendanceRequest",
  async (item: AttendanceRequestGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/attendance-request/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update attendance request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update attendance request");
    }
  }
);

export const deleteAttendanceRequest = createAsyncThunk(
  "attendanceRequest/deleteAttendanceRequest",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/attendance-request/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete attendance request");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete attendance request");
    }
  }
);

const attendanceRequestSlice = createSlice({
  name: "attendanceRequest",
  initialState,
  reducers: {
    clearAttendanceRequestError(state) {
      state.error = null;
    },
    clearCurrentAttendanceRequest(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAttendanceRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAttendanceRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAttendanceRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch attendance requests";
      })
      .addCase(getAttendanceRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAttendanceRequestById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getAttendanceRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch attendance request";
      })
      .addCase(addAttendanceRequest.pending, (state) => { state.error = null; })
      .addCase(addAttendanceRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add attendance request";
      })
      .addCase(updateAttendanceRequest.pending, (state) => { state.error = null; })
      .addCase(updateAttendanceRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update attendance request";
      })
      .addCase(deleteAttendanceRequest.pending, (state) => { state.error = null; })
      .addCase(deleteAttendanceRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete attendance request";
      });
  },
});

export const { clearAttendanceRequestError, clearCurrentAttendanceRequest } = attendanceRequestSlice.actions;
export default attendanceRequestSlice.reducer;
