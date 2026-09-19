import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CampGridData {
  id?: string | number;
  CAMP_ID?: number;
  CAMP_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface CampState {
  camps: CampGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CampState = {
  camps: [],
  loading: false,
  error: null,
};

export const fetchCamps = createAsyncThunk(
  "camp/fetchCamps",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/camp-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch camps");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.CAMP_ID }));
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to fetch camps");
    }
  }
);

export const addCamp = createAsyncThunk(
  "camp/addCamp",
  async (item: CampGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/camp-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add camp");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to add camp");
    }
  }
);

export const updateCamp = createAsyncThunk(
  "camp/updateCamp",
  async (item: CampGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, CAMP_ID: Number(item.id) || item.CAMP_ID };
      const response = await fetch(`${API_URL}/camp-master/${payload.CAMP_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update camp");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to update camp");
    }
  }
);

export const deleteCamp = createAsyncThunk(
  "camp/deleteCamp",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/camp-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete camp");
      }
      return await response.json(); } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to delete camp");
    }
  }
);

const campSlice = createSlice({
  name: "camp",
  initialState,
  reducers: {
    clearCampError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCamps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCamps.fulfilled, (state, action) => {
        state.loading = false;
        state.camps = action.payload;
      })
      .addCase(fetchCamps.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch camps";
      })
      .addCase(addCamp.pending, (state) => { state.error = null; })
      .addCase(addCamp.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add camp";
      })
      .addCase(updateCamp.pending, (state) => { state.error = null; })
      .addCase(updateCamp.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update camp";
      })
      .addCase(deleteCamp.pending, (state) => { state.error = null; })
      .addCase(deleteCamp.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete camp";
      });
  },
});

export const { clearCampError } = campSlice.actions;
export default campSlice.reducer;
