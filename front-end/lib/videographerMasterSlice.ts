import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface VideographerMasterGridData {
  id?: string | number;
  VIDEOGRAPHER_ID?: number;
  VIDEOGRAPHER_NAME?: string;
  ADDRESS?: string;
  LOCATION_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface VideographerMasterState {
  videographers: VideographerMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: VideographerMasterState = {
  videographers: [],
  loading: false,
  error: null,
};

export const fetchVideographers = createAsyncThunk(
  "videographerMaster/fetchVideographers",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/videographer-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/videographer-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch videographers");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.VIDEOGRAPHER_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch videographers");
    }
  }
);

export const addVideographer = createAsyncThunk(
  "videographerMaster/addVideographer",
  async (item: VideographerMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/videographer-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add videographer");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add videographer");
    }
  }
);

export const updateVideographer = createAsyncThunk(
  "videographerMaster/updateVideographer",
  async (item: VideographerMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, VIDEOGRAPHER_ID: Number(item.id) || item.VIDEOGRAPHER_ID };
      const response = await fetch(`${API_URL}/videographer-master/${payload.VIDEOGRAPHER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update videographer");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update videographer");
    }
  }
);

export const deleteVideographer = createAsyncThunk(
  "videographerMaster/deleteVideographer",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/videographer-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete videographer");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete videographer");
    }
  }
);

const videographerMasterSlice = createSlice({
  name: "videographerMaster",
  initialState,
  reducers: {
    clearVideographerMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVideographers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVideographers.fulfilled, (state, action) => {
        state.loading = false;
        state.videographers = action.payload;
      })
      .addCase(fetchVideographers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch videographers";
      })
      .addCase(addVideographer.pending, (state) => { state.error = null; })
      .addCase(addVideographer.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add videographer";
      })
      .addCase(updateVideographer.pending, (state) => { state.error = null; })
      .addCase(updateVideographer.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update videographer";
      })
      .addCase(deleteVideographer.pending, (state) => { state.error = null; })
      .addCase(deleteVideographer.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete videographer";
      });
  },
});

export const { clearVideographerMasterError } = videographerMasterSlice.actions;
export default videographerMasterSlice.reducer;
