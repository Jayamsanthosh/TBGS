import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface TrailerFileData {
  id?: string | number;
  SNO?: number;
  TRAILER_ID?: number;
  DOCUMENT_TYPE?: string;
  DESCRIPTIONS?: string;
  FILE_NAME?: string;
  CONTENT_TYPE?: string;
  CONTENT_DATA?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface TrailerFileState {
  files: TrailerFileData[];
  loading: boolean;
  error: string | null;
}

const initialState: TrailerFileState = {
  files: [],
  loading: false,
  error: null,
};

export const fetchTrailerFiles = createAsyncThunk(
  "trailerFiles/fetchTrailerFiles",
  async (trailerId: number | string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/trailer-master-files?trailerId=${encodeURIComponent(trailerId)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch trailer files");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch trailer files");
    }
  }
);

export const addTrailerFile = createAsyncThunk(
  "trailerFiles/addTrailerFile",
  async (item: TrailerFileData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/trailer-master-files`, {
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

export const updateTrailerFile = createAsyncThunk(
  "trailerFiles/updateTrailerFile",
  async (item: TrailerFileData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/trailer-master-files/${payload.SNO}`, {
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

export const deleteTrailerFile = createAsyncThunk(
  "trailerFiles/deleteTrailerFile",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/trailer-master-files/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
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

const trailerFilesSlice = createSlice({
  name: "trailerFiles",
  initialState,
  reducers: {
    clearTrailerFileError(state) {
      state.error = null;
    },
    setTrailerFiles(state, action) {
      state.files = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrailerFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrailerFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchTrailerFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch trailer files";
      })
      .addCase(addTrailerFile.pending, (state) => { state.error = null; })
      .addCase(addTrailerFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to upload file";
      })
      .addCase(updateTrailerFile.pending, (state) => { state.error = null; })
      .addCase(updateTrailerFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update file";
      })
      .addCase(deleteTrailerFile.pending, (state) => { state.error = null; })
      .addCase(deleteTrailerFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete file";
      });
  },
});

export const { clearTrailerFileError, setTrailerFiles } = trailerFilesSlice.actions;
export default trailerFilesSlice.reducer;
