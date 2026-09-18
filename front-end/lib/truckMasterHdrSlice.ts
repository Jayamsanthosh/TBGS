import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface TruckGridData {
  id?: string | number;
  TRUCK_ID?: number;
  TRUCK_NO?: string;
  FILE_COUNT?: number;
  TRUCK_TYPE_ID?: number;
  TRUCK_CHASSIS_NO?: string;
  TRAILER_ID?: number;
  TRAILER_TYPE_ID?: number;
  TRIP_INSIDE_OUTSIDE_STATUS?: string;
  DRIVER_EMP_ID?: number;
  DRIVER_NAME?: string;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DRIVER_PHONE_NO?: string;
  DRIVING_LICENSE_NO?: string;
  DRIVING_LICENSE_EXPIRY_DATE?: string;
  TRUCK_COMPANY_ID?: number;
  IMPORTED_COUNTRY_ID?: number;
  PURCHASED_SUPPLIER_ID?: number;
  PURCHASE_DATE?: string;
  FUEL_TYPE_ID?: number;
  TRUCK_CAPACITY?: number;
  TRUCK_CHASES_NO?: string;
  VEHICLE_CONTROL_NO?: string;
  ENGINE_NO?: string;
  ENGINE_CAPACITY?: number;
  NO_OF_AXLES?: number;
  AXLE_DISTANCE?: number;
  TITLE_HOLDER?: string;
  TITLE_HOLDER_TIN_NO?: string;
  TITLE_HOLDER_ADDRESS?: string;
  LATEST_INSURANCE_NO?: string;
  INSURANCE_AMOUNT?: number;
  MAKE?: string;
  MODEL?: string;
  MODEL_NO?: string;
  BODY_TYPE?: string;
  CLASS?: string;
  MANUFACTURE_YEAR?: string;
  SEATING_CAPACITY?: string;
  TARE_WEIGHT?: number;
  GROSS_WEIGHT?: number;
  FIXED_ROUTE?: string;
  TRUCK_STATUS?: string;
  TARGET_KM_TRUCK?: number;
  GOODS_CAPACITY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface TruckState {
  trucks: TruckGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: TruckState = {
  trucks: [],
  loading: false,
  error: null,
};

export const fetchTrucks = createAsyncThunk(
  "truck/fetchTrucks",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/truck-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch trucks");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.TRUCK_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch trucks");
    }
  }
);

export const fetchTruckById = createAsyncThunk(
  "truck/fetchTruckById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/truck-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch truck");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch truck");
    }
  }
);

export const addTruck = createAsyncThunk(
  "truck/addTruck",
  async (item: TruckGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/truck-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add truck");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add truck");
    }
  }
);

export const updateTruck = createAsyncThunk(
  "truck/updateTruck",
  async (item: TruckGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, TRUCK_ID: Number(item.id) || item.TRUCK_ID };
      const response = await fetch(`${API_URL}/truck-master/${payload.TRUCK_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update truck");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update truck");
    }
  }
);

export const deleteTruck = createAsyncThunk(
  "truck/deleteTruck",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/truck-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete truck");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete truck");
    }
  }
);

const truckSlice = createSlice({
  name: "truck",
  initialState,
  reducers: {
    clearTruckError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrucks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrucks.fulfilled, (state, action) => {
        state.loading = false;
        state.trucks = action.payload;
      })
      .addCase(fetchTrucks.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch trucks";
      })
      .addCase(addTruck.pending, (state) => { state.error = null; })
      .addCase(addTruck.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add truck";
      })
      .addCase(updateTruck.pending, (state) => { state.error = null; })
      .addCase(updateTruck.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update truck";
      })
      .addCase(deleteTruck.pending, (state) => { state.error = null; })
      .addCase(deleteTruck.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete truck";
      });
  },
});

export const { clearTruckError } = truckSlice.actions;
export default truckSlice.reducer;
