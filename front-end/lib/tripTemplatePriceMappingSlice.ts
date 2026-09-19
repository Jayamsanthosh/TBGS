import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface TripTemplatePriceMappingGridData {
  id?: string | number;
  PRICE_ID?: number;
  TRIP_TEMPLATE_ID?: number;
  TRIP_TEMPLATE_NAME?: string;
  DISTANCE_KM?: number;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  TRUCK_TYPE_ID?: number;
  TRUCK_TYPE_NAME?: string;
  TRIP_AMOUNT?: number;
  CURRENCY_ID?: number;
  CURRENCY_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface TripTemplatePriceMappingState {
  items: TripTemplatePriceMappingGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: TripTemplatePriceMappingState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchTripTemplatePriceMapping = createAsyncThunk(
  "tripTemplatePriceMapping/fetchTripTemplatePriceMapping",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/trip-template-price-mapping`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch trip template price mappings");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PRICE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch trip template price mappings");
    }
  }
);

export const addTripTemplatePriceMapping = createAsyncThunk(
  "tripTemplatePriceMapping/addTripTemplatePriceMapping",
  async (item: TripTemplatePriceMappingGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/trip-template-price-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add trip template price mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add trip template price mapping");
    }
  }
);

export const updateTripTemplatePriceMapping = createAsyncThunk(
  "tripTemplatePriceMapping/updateTripTemplatePriceMapping",
  async (item: TripTemplatePriceMappingGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PRICE_ID: Number(item.id) || item.PRICE_ID };
      const response = await fetch(`${API_URL}/trip-template-price-mapping/${payload.PRICE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update trip template price mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update trip template price mapping");
    }
  }
);

export const deleteTripTemplatePriceMapping = createAsyncThunk(
  "tripTemplatePriceMapping/deleteTripTemplatePriceMapping",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/trip-template-price-mapping/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete trip template price mapping");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete trip template price mapping");
    }
  }
);

const tripTemplatePriceMappingSlice = createSlice({
  name: "tripTemplatePriceMapping",
  initialState,
  reducers: {
    clearTripTemplatePriceMappingError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTripTemplatePriceMapping.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTripTemplatePriceMapping.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchTripTemplatePriceMapping.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch trip template price mappings";
      })
      .addCase(addTripTemplatePriceMapping.pending, (state) => { state.error = null; })
      .addCase(addTripTemplatePriceMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add trip template price mapping";
      })
      .addCase(updateTripTemplatePriceMapping.pending, (state) => { state.error = null; })
      .addCase(updateTripTemplatePriceMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update trip template price mapping";
      })
      .addCase(deleteTripTemplatePriceMapping.pending, (state) => { state.error = null; })
      .addCase(deleteTripTemplatePriceMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete trip template price mapping";
      });
  },
});

export const { clearTripTemplatePriceMappingError } = tripTemplatePriceMappingSlice.actions;
export default tripTemplatePriceMappingSlice.reducer;
