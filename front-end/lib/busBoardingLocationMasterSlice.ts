import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BusBoardingLocationGridData {
  id?: string | number;
  BUS_BOARDING_LOCATION_ID?: number;
  BUS_BOARDING_LOCATION_NAME: string;
  BUS_CODE?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BusBoardingLocationState {
  busBoardingLocations: BusBoardingLocationGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BusBoardingLocationState = {
  busBoardingLocations: [],
  loading: false,
  error: null,
};

export const fetchBusBoardingLocations = createAsyncThunk(
  "busBoardingLocation/fetchBusBoardingLocations",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/bus-boarding-location-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/bus-boarding-location-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch bus boarding locations");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BUS_BOARDING_LOCATION_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch bus boarding locations");
    }
  }
);

export const addBusBoardingLocation = createAsyncThunk(
  "busBoardingLocation/addBusBoardingLocation",
  async (item: BusBoardingLocationGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bus-boarding-location-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add bus boarding location");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add bus boarding location");
    }
  }
);

export const updateBusBoardingLocation = createAsyncThunk(
  "busBoardingLocation/updateBusBoardingLocation",
  async (item: BusBoardingLocationGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BUS_BOARDING_LOCATION_ID: Number(item.id) || item.BUS_BOARDING_LOCATION_ID };
      const response = await fetch(`${API_URL}/bus-boarding-location-master/${payload.BUS_BOARDING_LOCATION_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update bus boarding location");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update bus boarding location");
    }
  }
);

export const deleteBusBoardingLocation = createAsyncThunk(
  "busBoardingLocation/deleteBusBoardingLocation",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/bus-boarding-location-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete bus boarding location");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete bus boarding location");
    }
  }
);

const busBoardingLocationSlice = createSlice({
  name: "busBoardingLocation",
  initialState,
  reducers: {
    clearBusBoardingLocationError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBusBoardingLocations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBusBoardingLocations.fulfilled, (state, action) => {
        state.loading = false;
        state.busBoardingLocations = action.payload;
      })
      .addCase(fetchBusBoardingLocations.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch bus boarding locations";
      })
      .addCase(addBusBoardingLocation.pending, (state) => { state.error = null; })
      .addCase(addBusBoardingLocation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add bus boarding location";
      })
      .addCase(updateBusBoardingLocation.pending, (state) => { state.error = null; })
      .addCase(updateBusBoardingLocation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update bus boarding location";
      })
      .addCase(deleteBusBoardingLocation.pending, (state) => { state.error = null; })
      .addCase(deleteBusBoardingLocation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete bus boarding location";
      });
  },
});

export const { clearBusBoardingLocationError } = busBoardingLocationSlice.actions;
export default busBoardingLocationSlice.reducer;
