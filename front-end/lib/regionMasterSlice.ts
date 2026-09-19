import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface RegionGridData {
  id?: string | number;
  REGION_ID?: number;
  REGION_NAME: string;
  COUNTRY_ID?: number;
  CAPITAL?: string;
  NO_OF_DISTRICTS?: number;
  TOTAL_POPULATION?: number;
  ZONE_NAME?: string;
  DISTANCE_FROM_ARUSHA?: number;
  STATUS_MASTER?: string;
}

interface RegionsState {
  regions: RegionGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: RegionsState = {
  regions: [],
  loading: false,
  error: null,
};

export const fetchRegions = createAsyncThunk(
  "regions/fetchRegions",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/region-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch regions");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.REGION_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch regions");
    }
  }
);

export const addRegion = createAsyncThunk(
  "regions/addRegion",
  async (item: RegionGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/region-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add region");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add region");
    }
  }
);

export const updateRegion = createAsyncThunk(
  "regions/updateRegion",
  async (item: RegionGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, REGION_ID: Number(item.id) || item.REGION_ID };
      const response = await fetch(`${API_URL}/region-master/${payload.REGION_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update region");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update region");
    }
  }
);

export const deleteRegion = createAsyncThunk(
  "regions/deleteRegion",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/region-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete region");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete region");
    }
  }
);

const regionsSlice = createSlice({
  name: "regions",
  initialState,
  reducers: {
    clearRegionsError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRegions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRegions.fulfilled, (state, action) => {
        state.loading = false;
        state.regions = action.payload;
      })
      .addCase(fetchRegions.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch regions";
      })
      .addCase(addRegion.pending, (state) => { state.error = null; })
      .addCase(addRegion.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add region";
      })
      .addCase(updateRegion.pending, (state) => { state.error = null; })
      .addCase(updateRegion.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update region";
      })
      .addCase(deleteRegion.pending, (state) => { state.error = null; })
      .addCase(deleteRegion.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete region";
      });
  },
});

export const { clearRegionsError } = regionsSlice.actions;
export default regionsSlice.reducer;
