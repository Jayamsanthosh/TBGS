import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface FuelTypeGridData {
  id?: string | number;
  FUEL_TYPE_ID?: number;
  FUEL_TYPE_NAME?: string;
  FUEL_TYPE_DESCRIPTION?: string;
  ERP_PRODUCT_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface FuelTypeState {
  fuelTypes: FuelTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: FuelTypeState = {
  fuelTypes: [],
  loading: false,
  error: null,
};

export const fetchFuelTypes = createAsyncThunk(
  "fuelType/fetchFuelTypes",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/fuel-type-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch fuel types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.FUEL_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch fuel types");
    }
  }
);

export const addFuelType = createAsyncThunk(
  "fuelType/addFuelType",
  async (item: FuelTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/fuel-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add fuel type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add fuel type");
    }
  }
);

export const updateFuelType = createAsyncThunk(
  "fuelType/updateFuelType",
  async (item: FuelTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, FUEL_TYPE_ID: Number(item.id) || item.FUEL_TYPE_ID };
      const response = await fetch(`${API_URL}/fuel-type-master/${payload.FUEL_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update fuel type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update fuel type");
    }
  }
);

export const deleteFuelType = createAsyncThunk(
  "fuelType/deleteFuelType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/fuel-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete fuel type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete fuel type");
    }
  }
);

const fuelTypeSlice = createSlice({
  name: "fuelType",
  initialState,
  reducers: {
    clearFuelTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFuelTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFuelTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.fuelTypes = action.payload;
      })
      .addCase(fetchFuelTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch fuel types";
      })
      .addCase(addFuelType.pending, (state) => { state.error = null; })
      .addCase(addFuelType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add fuel type";
      })
      .addCase(updateFuelType.pending, (state) => { state.error = null; })
      .addCase(updateFuelType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update fuel type";
      })
      .addCase(deleteFuelType.pending, (state) => { state.error = null; })
      .addCase(deleteFuelType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete fuel type";
      });
  },
});

export const { clearFuelTypeError } = fuelTypeSlice.actions;
export default fuelTypeSlice.reducer;
