import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface MappingGridData {
  id?: string | number;
  MAP_ID?: number;
  COMPANY_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface MappingState {
  items: MappingGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: MappingState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchMappings = createAsyncThunk(
  "companyCampStoreMapping/fetchMappings",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/company-camp-store-mapping?status=${encodeURIComponent(status)}`
        : `${API_URL}/company-camp-store-mapping`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch mappings");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.MAP_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch mappings");
    }
  }
);

export const addMapping = createAsyncThunk(
  "companyCampStoreMapping/addMapping",
  async (item: MappingGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/company-camp-store-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add mapping");
    }
  }
);

export const updateMapping = createAsyncThunk(
  "companyCampStoreMapping/updateMapping",
  async (item: MappingGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, MAP_ID: Number(item.id) || item.MAP_ID };
      const response = await fetch(`${API_URL}/company-camp-store-mapping/${payload.MAP_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update mapping");
    }
  }
);

export const deleteMapping = createAsyncThunk(
  "companyCampStoreMapping/deleteMapping",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/company-camp-store-mapping/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete mapping");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete mapping");
    }
  }
);

const mappingSlice = createSlice({
  name: "companyCampStoreMapping",
  initialState,
  reducers: {
    clearMappingError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMappings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMappings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMappings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch mappings";
      })
      .addCase(addMapping.pending, (state) => { state.error = null; })
      .addCase(addMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add mapping";
      })
      .addCase(updateMapping.pending, (state) => { state.error = null; })
      .addCase(updateMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update mapping";
      })
      .addCase(deleteMapping.pending, (state) => { state.error = null; })
      .addCase(deleteMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete mapping";
      });
  },
});

export const { clearMappingError } = mappingSlice.actions;
export default mappingSlice.reducer;
