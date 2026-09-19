import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface FuelStationGridData {
  id?: string | number;
  FUEL_STATIONE_ID?: number;
  FUEL_STATIONE_NAME: string;
  COUNTRY_ID?: number;
  COUNTRY_NAME?: string;
  REGION_ID?: number;
  REGION_NAME?: string;
  DISTRICT_ID?: number;
  DISTRICT_NAME?: string;
  FUEL_STATION_ADDRESS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface FuelStationState {
  fuelStations: FuelStationGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: FuelStationState = {
  fuelStations: [],
  loading: false,
  error: null,
};

export const fetchFuelStations = createAsyncThunk(
  "fuelStation/fetchFuelStations",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/fuel-station-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch fuel stations");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.FUEL_STATIONE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch fuel stations");
    }
  }
);

export const addFuelStation = createAsyncThunk(
  "fuelStation/addFuelStation",
  async (item: FuelStationGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/fuel-station-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add fuel station");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add fuel station");
    }
  }
);

export const updateFuelStation = createAsyncThunk(
  "fuelStation/updateFuelStation",
  async (item: FuelStationGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, FUEL_STATIONE_ID: Number(item.id) || item.FUEL_STATIONE_ID };
      const response = await fetch(`${API_URL}/fuel-station-master/${payload.FUEL_STATIONE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update fuel station");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update fuel station");
    }
  }
);

export const deleteFuelStation = createAsyncThunk(
  "fuelStation/deleteFuelStation",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/fuel-station-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete fuel station");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete fuel station");
    }
  }
);

const fuelStationSlice = createSlice({
  name: "fuelStation",
  initialState,
  reducers: {
    clearFuelStationError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFuelStations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFuelStations.fulfilled, (state, action) => {
        state.loading = false;
        state.fuelStations = action.payload;
      })
      .addCase(fetchFuelStations.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch fuel stations";
      })
      .addCase(addFuelStation.pending, (state) => { state.error = null; })
      .addCase(addFuelStation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add fuel station";
      })
      .addCase(updateFuelStation.pending, (state) => { state.error = null; })
      .addCase(updateFuelStation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update fuel station";
      })
      .addCase(deleteFuelStation.pending, (state) => { state.error = null; })
      .addCase(deleteFuelStation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete fuel station";
      });
  },
});

export const { clearFuelStationError } = fuelStationSlice.actions;
export default fuelStationSlice.reducer;
