import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ReportMasterGridData {
  id?: string | number;
  REPORT_ID?: number;
  REPORT_NAME: string;
  PROCEDURE_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ReportMasterState {
  reports: ReportMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ReportMasterState = {
  reports: [],
  loading: false,
  error: null,
};

export const fetchReports = createAsyncThunk(
  "reportMaster/fetchReports",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/report-dashboard/master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch reports");
      }
      const json = await response.json();
      return (json.data || []).map((r: ReportMasterGridData) => ({ ...r, id: r.REPORT_ID }));
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to fetch reports");
    }
  }
);

export const addReport = createAsyncThunk(
  "reportMaster/addReport",
  async (item: ReportMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/report-dashboard/master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add report");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to add report");
    }
  }
);

export const updateReport = createAsyncThunk(
  "reportMaster/updateReport",
  async (item: ReportMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, REPORT_ID: Number(item.id) || item.REPORT_ID };
      const response = await fetch(`${API_URL}/report-dashboard/master/${payload.REPORT_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update report");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to update report");
    }
  }
);

export const deleteReport = createAsyncThunk(
  "reportMaster/deleteReport",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state = getState() as { auth?: { user?: { loginName?: string; role?: string; LOGIN_NAME?: string; ROLE?: string } } | null };
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/report-dashboard/master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete report");
      }
      return await response.json();
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : "Failed to delete report");
    }
  }
);

const reportMasterSlice = createSlice({
  name: "reportMaster",
  initialState,
  reducers: {
    clearReportMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReports.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReports.fulfilled, (state, action) => {
        state.loading = false;
        state.reports = action.payload;
      })
      .addCase(fetchReports.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch reports";
      })
      .addCase(addReport.pending, (state) => { state.error = null; })
      .addCase(addReport.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add report";
      })
      .addCase(updateReport.pending, (state) => { state.error = null; })
      .addCase(updateReport.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update report";
      })
      .addCase(deleteReport.pending, (state) => { state.error = null; })
      .addCase(deleteReport.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete report";
      });
  },
});

export const { clearReportMasterError } = reportMasterSlice.actions;
export default reportMasterSlice.reducer;
