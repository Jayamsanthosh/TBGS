import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface TrailerTypeGridData {
  id?: string | number;
  TRAILER_TYPE_ID?: number;
  TRAILER_TYPE_NAME: string;
  TRAILER_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface TrailerTypeState {
  trailerTypes: TrailerTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: TrailerTypeState = {
  trailerTypes: [],
  loading: false,
  error: null,
};

export const fetchTrailerTypes = createAsyncThunk(
  "trailerType/fetchTrailerTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/trailer-type-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch trailer types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.TRAILER_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch trailer types");
    }
  }
);

export const addTrailerType = createAsyncThunk(
  "trailerType/addTrailerType",
  async (item: TrailerTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/trailer-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add trailer type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add trailer type");
    }
  }
);

export const updateTrailerType = createAsyncThunk(
  "trailerType/updateTrailerType",
  async (item: TrailerTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, TRAILER_TYPE_ID: Number(item.id) || item.TRAILER_TYPE_ID };
      const response = await fetch(`${API_URL}/trailer-type-master/${payload.TRAILER_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update trailer type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update trailer type");
    }
  }
);

export const deleteTrailerType = createAsyncThunk(
  "trailerType/deleteTrailerType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/trailer-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete trailer type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete trailer type");
    }
  }
);

const trailerTypeSlice = createSlice({
  name: "trailerType",
  initialState,
  reducers: {
    clearTrailerTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTrailerTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTrailerTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.trailerTypes = action.payload;
      })
      .addCase(fetchTrailerTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch trailer types";
      })
      .addCase(addTrailerType.pending, (state) => { state.error = null; })
      .addCase(addTrailerType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add trailer type";
      })
      .addCase(updateTrailerType.pending, (state) => { state.error = null; })
      .addCase(updateTrailerType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update trailer type";
      })
      .addCase(deleteTrailerType.pending, (state) => { state.error = null; })
      .addCase(deleteTrailerType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete trailer type";
      });
  },
});

export const { clearTrailerTypeError } = trailerTypeSlice.actions;
export default trailerTypeSlice.reducer;
