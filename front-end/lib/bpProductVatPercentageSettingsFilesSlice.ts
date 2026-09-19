import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BpProductVatFileGridData {
  id?: string | number;
  SNO?: number;
  BP_PROD_VAT_ID?: number;
  DOCUMENT_TYPE?: string;
  DESCRIPTIONS?: string;
  FILE_NAME?: string;
  CONTENT_TYPE?: string;
  CONTENT_DATA?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BpProductVatFilesState {
  files: BpProductVatFileGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BpProductVatFilesState = {
  files: [],
  loading: false,
  error: null,
};

export const fetchBpVatFiles = createAsyncThunk(
  "bpVatFiles/fetchBpVatFiles",
  async (params: { settingId: string | number; status: string }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/bp-product-vat-percentage-settings-files/by-setting?settingId=${encodeURIComponent(
          String(params.settingId)
        )}&status=${encodeURIComponent(params.status)}`
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

export const fetchBpVatFileById = createAsyncThunk(
  "bpVatFiles/fetchBpVatFileById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/bp-product-vat-percentage-settings-files/${id}`
      );
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

export const addBpVatFile = createAsyncThunk(
  "bpVatFiles/addBpVatFile",
  async (item: BpProductVatFileGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/bp-product-vat-percentage-settings-files`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        }
      );
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

export const updateBpVatFile = createAsyncThunk(
  "bpVatFiles/updateBpVatFile",
  async (item: BpProductVatFileGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(
        `${API_URL}/bp-product-vat-percentage-settings-files/${payload.SNO}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
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

export const deleteBpVatFile = createAsyncThunk(
  "bpVatFiles/deleteBpVatFile",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/bp-product-vat-percentage-settings-files/${id}?USER=${encodeURIComponent(
          USER
        )}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
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

const bpVatFilesSlice = createSlice({
  name: "bpVatFiles",
  initialState,
  reducers: {
    clearBpVatFileError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBpVatFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBpVatFiles.fulfilled, (state, action) => {
        state.loading = false;
        state.files = action.payload;
      })
      .addCase(fetchBpVatFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch files";
      })
      .addCase(addBpVatFile.pending, (state) => { state.error = null; })
      .addCase(addBpVatFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to save file";
      })
      .addCase(updateBpVatFile.pending, (state) => { state.error = null; })
      .addCase(updateBpVatFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update file";
      })
      .addCase(deleteBpVatFile.pending, (state) => { state.error = null; })
      .addCase(deleteBpVatFile.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete file";
      });
  },
});

export const { clearBpVatFileError } = bpVatFilesSlice.actions;
export default bpVatFilesSlice.reducer;
