import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface DriverMasterFileGridData {
  id?: string | number;
  SNO?: number;
  DRIVER_EMP_ID?: number;
  DRIVER_FULL_NAME?: string;
  DOCUMENT_TYPE?: string;
  ISSUE_DATE?: string;
  EXPIRY_DATE?: string;
  DESCRIPTIONS?: string;
  FILE_NAME?: string;
  CONTENT_TYPE?: string;
  CONTENT_DATA?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface DriverMasterFilesState {
  files: DriverMasterFileGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: DriverMasterFilesState = {
  files: [],
  loading: false,
  error: null,
};

export const fetchDriverFiles = createAsyncThunk(
  "driverMasterFiles/fetchDriverFiles",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/driver-master-files?status=${encodeURIComponent(status)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch files");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch files");
    }
  }
);

export const fetchDriverFileById = createAsyncThunk(
  "driverMasterFiles/fetchDriverFileById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/driver-master-files/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch file");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch file");
    }
  }
);

export const addDriverFile = createAsyncThunk(
  "driverMasterFiles/addDriverFile",
  async (item: DriverMasterFileGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/driver-master-files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to save file");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to save file");
    }
  }
);

export const updateDriverFile = createAsyncThunk(
  "driverMasterFiles/updateDriverFile",
  async (item: DriverMasterFileGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/driver-master-files/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update file");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update file");
    }
  }
);

export const deleteDriverFile = createAsyncThunk(
  "driverMasterFiles/deleteDriverFile",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/driver-master-files/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete file");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete file");
    }
  }
);

const driverMasterFilesSlice = createSlice({
  name: "driverMasterFiles",
  initialState,
  reducers: {
    clearDriverFileError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDriverFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDriverFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchDriverFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch files";
      })
      .addCase(addDriverFile.pending, (state) => { state.error = null; })
      .addCase(addDriverFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to save file";
      })
      .addCase(updateDriverFile.pending, (state) => { state.error = null; })
      .addCase(updateDriverFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update file";
      })
      .addCase(deleteDriverFile.pending, (state) => { state.error = null; })
      .addCase(deleteDriverFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete file";
      });
  },
});

export const { clearDriverFileError } = driverMasterFilesSlice.actions;
export default driverMasterFilesSlice.reducer;
