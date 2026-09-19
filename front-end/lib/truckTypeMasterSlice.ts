import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface TruckTypeGridData {
  id?: string | number;
  TRUCK_TYPE_ID?: number;
  TRUCK_TYPE_NAME: string;
  TRUCK_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface TruckTypeState {
  truckTypes: TruckTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: TruckTypeState = {
  truckTypes: [],
  loading: false,
  error: null,
};

export const fetchTruckTypes = createAsyncThunk(
  "truckType/fetchTruckTypes",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/truck-type-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch truck types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.TRUCK_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch truck types");
    }
  }
);

export const addTruckType = createAsyncThunk(
  "truckType/addTruckType",
  async (item: TruckTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/truck-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add truck type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add truck type");
    }
  }
);

export const updateTruckType = createAsyncThunk(
  "truckType/updateTruckType",
  async (item: TruckTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, TRUCK_TYPE_ID: Number(item.id) || item.TRUCK_TYPE_ID };
      const response = await fetch(`${API_URL}/truck-type-master/${payload.TRUCK_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update truck type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update truck type");
    }
  }
);

export const deleteTruckType = createAsyncThunk(
  "truckType/deleteTruckType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/truck-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete truck type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete truck type");
    }
  }
);

const truckTypeSlice = createSlice({
  name: "truckType",
  initialState,
  reducers: {
    clearTruckTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTruckTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTruckTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.truckTypes = action.payload;
      })
      .addCase(fetchTruckTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch truck types";
      })
      .addCase(addTruckType.pending, (state) => { state.error = null; })
      .addCase(addTruckType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add truck type";
      })
      .addCase(updateTruckType.pending, (state) => { state.error = null; })
      .addCase(updateTruckType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update truck type";
      })
      .addCase(deleteTruckType.pending, (state) => { state.error = null; })
      .addCase(deleteTruckType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete truck type";
      });
  },
});

export const { clearTruckTypeError } = truckTypeSlice.actions;
export default truckTypeSlice.reducer;
