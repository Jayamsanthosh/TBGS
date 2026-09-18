import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface TrailerGridData {
  id?: string | number;
  TRAILER_ID?: number;
  TRAILER_NO?: string;
  TRAILER_TYPE_ID?: number;
  TRAILER_CHASSIS_NO?: string;
  TRAILER_DESCRIPTION?: string;
  VEHICLE_CONTROL_NO?: string;
  TRAILER_OWNED_COMPANY_ID?: number;
  TITLE_HOLDER?: string;
  TITLE_HOLDER_TIN_NO?: string;
  TITLE_HOLDER_ADDRESS?: string;
  MAKE?: string;
  MODEL?: string;
  MODEL_NO?: string;
  BODY_TYPE?: string;
  CLASS?: string;
  MANUFACTURE_YEAR?: number;
  TARE_WEIGHT?: number;
  GROSS_WEIGHT?: number;
  IMPORTED_COUNTRY_ID?: number;
  IMPORTED_SUPPLIER_ID?: number;
  PURCHASE_DATE?: string;
  LATEST_INSURANCE_NO?: string;
  INSURANCE_AMOUNT?: number;
  GOODS_CAPACITY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface TrailerState {
  trailers: TrailerGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: TrailerState = {
  trailers: [],
  loading: false,
  error: null,
};

export const fetchTrailers = createAsyncThunk(
  "trailer/fetchTrailers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/trailer-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch trailers");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({
        ...u,
        id: u.TRAILER_ID,
        INSURANCE_AMOUNT: u.INSURANCE_AMOUNT ?? u.insurance_amount ?? u.Insurance_Amount,
        GOODS_CAPACITY: u.GOODS_CAPACITY ?? u.Goods_Capacity ?? u.goods_capacity,
      }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch trailers");
    }
  }
);

export const addTrailer = createAsyncThunk(
  "trailer/addTrailer",
  async (item: TrailerGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/trailer-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add trailer");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add trailer");
    }
  }
);

export const updateTrailer = createAsyncThunk(
  "trailer/updateTrailer",
  async (item: TrailerGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, TRAILER_ID: Number(item.id) || item.TRAILER_ID };
      const response = await fetch(`${API_URL}/trailer-master/${payload.TRAILER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update trailer");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update trailer");
    }
  }
);

export const deleteTrailer = createAsyncThunk(
  "trailer/deleteTrailer",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/trailer-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete trailer");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete trailer");
    }
  }
);

const trailerSlice = createSlice({
  name: "trailer",
  initialState,
  reducers: {
    clearTrailerError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrailers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrailers.fulfilled, (state, action) => {
        state.loading = false;
        state.trailers = action.payload;
      })
      .addCase(fetchTrailers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch trailers";
      })
      .addCase(addTrailer.pending, (state) => { state.error = null; })
      .addCase(addTrailer.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add trailer";
      })
      .addCase(updateTrailer.pending, (state) => { state.error = null; })
      .addCase(updateTrailer.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update trailer";
      })
      .addCase(deleteTrailer.pending, (state) => { state.error = null; })
      .addCase(deleteTrailer.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete trailer";
      });
  },
});

export const { clearTrailerError } = trailerSlice.actions;
export default trailerSlice.reducer;
