import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface DriverMasterGridData {
  id?: string | number;
  SNO?: number;
  DRIVER_EMP_ID?: number;
  FILE_COUNT?: number;
  DRIVER_FULL_NAME?: string;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  COMPANY_NAME?: string;
  DEPARTMENT_NAME?: string;
  DESIGNATION_NAME?: string;
  PHONE_NUMBER?: string;
  DRIVING_LICENSE_NUMBER?: string;
  DRIVING_LICENSE_EXPIRY_DATE?: string;
  VEHICLE_CATEGORIES_LICENSED?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface DriverMasterState {
  drivers: DriverMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: DriverMasterState = {
  drivers: [],
  loading: false,
  error: null,
};

export const fetchDrivers = createAsyncThunk(
  "driverMaster/fetchDrivers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/driver-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch drivers");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch drivers");
    }
  }
);

export const fetchDriverById = createAsyncThunk(
  "driverMaster/fetchDriverById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/driver-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch driver");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch driver");
    }
  }
);

export const addDriver = createAsyncThunk(
  "driverMaster/addDriver",
  async (item: DriverMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/driver-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add driver");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add driver");
    }
  }
);

export const updateDriver = createAsyncThunk(
  "driverMaster/updateDriver",
  async (item: DriverMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/driver-master/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update driver");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update driver");
    }
  }
);

export const deleteDriver = createAsyncThunk(
  "driverMaster/deleteDriver",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/driver-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete driver");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete driver");
    }
  }
);

const driverMasterSlice = createSlice({
  name: "driverMaster",
  initialState,
  reducers: {
    clearDriverMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDrivers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDrivers.fulfilled, (state, action) => {
        state.loading = false;
        state.drivers = action.payload;
      })
      .addCase(fetchDrivers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch drivers";
      })
      .addCase(addDriver.pending, (state) => { state.error = null; })
      .addCase(addDriver.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add driver";
      })
      .addCase(updateDriver.pending, (state) => { state.error = null; })
      .addCase(updateDriver.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update driver";
      })
      .addCase(deleteDriver.pending, (state) => { state.error = null; })
      .addCase(deleteDriver.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete driver";
      });
  },
});

export const { clearDriverMasterError } = driverMasterSlice.actions;
export default driverMasterSlice.reducer;
