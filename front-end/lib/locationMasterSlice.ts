import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface LocationGridData {
  id?: string | number;
  LOCATION_ID?: number;
  LOCATION_NAME?: string;
  COUNTRY_ID?: number;
  REGION_ID?: number;
  DISTRICT_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface LocationState {
  locations: LocationGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  locations: [],
  loading: false,
  error: null,
};

export const fetchLocations = createAsyncThunk(
  "location/fetchLocations",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/location-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/location-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch locations");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.LOCATION_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch locations");
    }
  }
);

export const addLocation = createAsyncThunk(
  "location/addLocation",
  async (item: LocationGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/location-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add location");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add location");
    }
  }
);

export const updateLocation = createAsyncThunk(
  "location/updateLocation",
  async (item: LocationGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, LOCATION_ID: Number(item.id) || item.LOCATION_ID };
      const response = await fetch(`${API_URL}/location-master/${payload.LOCATION_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update location");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update location");
    }
  }
);

export const deleteLocation = createAsyncThunk(
  "location/deleteLocation",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/location-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete location");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete location");
    }
  }
);

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {
    clearLocationError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.locations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch locations";
      })
      .addCase(addLocation.pending, (state) => { state.error = null; })
      .addCase(addLocation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add location";
      })
      .addCase(updateLocation.pending, (state) => { state.error = null; })
      .addCase(updateLocation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update location";
      })
      .addCase(deleteLocation.pending, (state) => { state.error = null; })
      .addCase(deleteLocation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete location";
      });
  },
});

export const { clearLocationError } = locationSlice.actions;
export default locationSlice.reducer;
