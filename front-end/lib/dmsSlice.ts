import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface DMSFileGridData {
  id?: string | number;
  DMS_ID?: number;
  LINK_PAGES_ID?: number;
  PAGE_REF_NO?: string;
  DOCUMENT_TYPE?: string;
  DESCRIPTIONS?: string;
  FILE_NAME?: string;
  CONTENT_TYPE?: string;
  CONTENT_DATA?: string | null;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface DMSState {
  files: DMSFileGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: DMSState = {
  files: [],
  loading: false,
  error: null,
};

export const fetchDMSFiles = createAsyncThunk(
  "dms/fetchDMSFiles",
  async (
    params: { status?: string; linkPagesId?: number; pageRefNo?: string },
    { rejectWithValue }
  ) => {
    try {
      const q = new URLSearchParams();
      if (params.status) q.set("status", params.status);
      if (params.linkPagesId !== undefined) q.set("linkPagesId", String(params.linkPagesId));
      if (params.pageRefNo) q.set("pageRefNo", params.pageRefNo);
      const response = await fetch(`${API_URL}/dms?${q.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch DMS files");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.DMS_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch DMS files");
    }
  }
);

export const fetchDMSFileById = createAsyncThunk(
  "dms/fetchDMSFileById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/dms/${id}`);
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

export const addDMSFile = createAsyncThunk(
  "dms/addDMSFile",
  async (item: DMSFileGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/dms`, {
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

export const updateDMSFile = createAsyncThunk(
  "dms/updateDMSFile",
  async (item: DMSFileGridData, { rejectWithValue }) => {
    try {
      const id = Number(item.id) || item.DMS_ID;
      const response = await fetch(`${API_URL}/dms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
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

export const deleteDMSFile = createAsyncThunk(
  "dms/deleteDMSFile",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/dms/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
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

const dmsSlice = createSlice({
  name: "dms",
  initialState,
  reducers: {
    clearDMSError(state) {
      state.error = null;
    },
    clearDMSFiles(state) {
      state.files = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDMSFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDMSFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchDMSFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch files";
      })
      .addCase(addDMSFile.pending, (state) => { state.error = null; })
      .addCase(addDMSFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to upload file";
      })
      .addCase(updateDMSFile.pending, (state) => { state.error = null; })
      .addCase(updateDMSFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update file";
      })
      .addCase(deleteDMSFile.pending, (state) => { state.error = null; })
      .addCase(deleteDMSFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete file";
      });
  },
});

export const { clearDMSError, clearDMSFiles } = dmsSlice.actions;
export default dmsSlice.reducer;
