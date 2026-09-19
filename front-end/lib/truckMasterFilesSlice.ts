import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface TruckFileGridData {
  id?: string | number;
  SNO?: number;
  TRUCK_ID?: number;
  TRUCK_NO?: string;
  DOCUMENT_TYPE?: string;
  DESCRIPTIONS?: string;
  FILE_NAME?: string;
  CONTENT_TYPE?: string;
  CONTENT_DATA?: string | null;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface TruckFileState {
  files: TruckFileGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: TruckFileState = {
  files: [],
  loading: false,
  error: null,
};

export const fetchTruckFiles = createAsyncThunk(
  "truckFiles/fetchTruckFiles",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/truck-master-files?status=${encodeURIComponent(status)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch truck files");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch truck files");
    }
  }
);

export const fetchTruckFileById = createAsyncThunk(
  "truckFiles/fetchTruckFileById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/truck-master-files/${id}`);
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

export const addTruckFile = createAsyncThunk(
  "truckFiles/addTruckFile",
  async (item: TruckFileGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/truck-master-files`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to upload file");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to upload file");
    }
  }
);

export const updateTruckFile = createAsyncThunk(
  "truckFiles/updateTruckFile",
  async (item: TruckFileGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/truck-master-files/${payload.SNO}`, {
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

export const deleteTruckFile = createAsyncThunk(
  "truckFiles/deleteTruckFile",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/truck-master-files/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
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

const truckFilesSlice = createSlice({
  name: "truckFiles",
  initialState,
  reducers: {
    clearTruckFileError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTruckFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTruckFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchTruckFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch truck files";
      })
      .addCase(addTruckFile.pending, (state) => { state.error = null; })
      .addCase(addTruckFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to upload file";
      })
      .addCase(updateTruckFile.pending, (state) => { state.error = null; })
      .addCase(updateTruckFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update file";
      })
      .addCase(deleteTruckFile.pending, (state) => { state.error = null; })
      .addCase(deleteTruckFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete file";
      });
  },
});

export const { clearTruckFileError } = truckFilesSlice.actions;
export default truckFilesSlice.reducer;
