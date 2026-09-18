import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface TripTemplateGridData {
  id?: string | number;
  TRIP_TEMPLATE_ID?: number;
  TRIP_TEMPLATE_NAME?: string;
  TRIP_TEMPLATE_DESCRIPTION?: string;
  FROM_LOCATION_ID?: number;
  TO_LOCATION_ID?: number;
  DISTANCE_KM?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface TripTemplateState {
  tripTemplates: TripTemplateGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: TripTemplateState = {
  tripTemplates: [],
  loading: false,
  error: null,
};

export const fetchTripTemplates = createAsyncThunk(
  "tripTemplate/fetchTripTemplates",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/trip-template-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/trip-template-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch trip templates");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.TRIP_TEMPLATE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch trip templates");
    }
  }
);

export const getTripTemplateById = createAsyncThunk(
  "tripTemplate/getTripTemplateById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/trip-template-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch trip template");
      }
      const json = await response.json();
      return json.data ? { ...json.data, id: json.data.TRIP_TEMPLATE_ID } : null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch trip template");
    }
  }
);

export const addTripTemplate = createAsyncThunk(
  "tripTemplate/addTripTemplate",
  async (item: TripTemplateGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/trip-template-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add trip template");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add trip template");
    }
  }
);

export const updateTripTemplate = createAsyncThunk(
  "tripTemplate/updateTripTemplate",
  async (item: TripTemplateGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, TRIP_TEMPLATE_ID: Number(item.id) || item.TRIP_TEMPLATE_ID };
      const response = await fetch(`${API_URL}/trip-template-master/${payload.TRIP_TEMPLATE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update trip template");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update trip template");
    }
  }
);

export const deleteTripTemplate = createAsyncThunk(
  "tripTemplate/deleteTripTemplate",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/trip-template-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete trip template");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete trip template");
    }
  }
);

const tripTemplateSlice = createSlice({
  name: "tripTemplate",
  initialState,
  reducers: {
    clearTripTemplateError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTripTemplates.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripTemplates.fulfilled, (state, action) => {
        state.loading = false;
        state.tripTemplates = action.payload;
      })
      .addCase(fetchTripTemplates.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch trip templates";
      })
      .addCase(addTripTemplate.pending, (state) => { state.error = null; })
      .addCase(addTripTemplate.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add trip template";
      })
      .addCase(updateTripTemplate.pending, (state) => { state.error = null; })
      .addCase(updateTripTemplate.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update trip template";
      })
      .addCase(deleteTripTemplate.pending, (state) => { state.error = null; })
      .addCase(deleteTripTemplate.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete trip template";
      });
  },
});

export const { clearTripTemplateError } = tripTemplateSlice.actions;
export default tripTemplateSlice.reducer;
