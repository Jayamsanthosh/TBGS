import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface GunTypeGridData {
  id?: string | number;
  GUN_TYPE_ID?: number;
  TYPE_NAME: string;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface GunTypeState {
  gunTypes: GunTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: GunTypeState = {
  gunTypes: [],
  loading: false,
  error: null,
};

export const fetchGunTypes = createAsyncThunk(
  "gunType/fetchGunTypes",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/gun-type-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/gun-type-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch gun types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.GUN_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch gun types");
    }
  }
);

export const addGunType = createAsyncThunk(
  "gunType/addGunType",
  async (item: GunTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/gun-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add gun type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add gun type");
    }
  }
);

export const updateGunType = createAsyncThunk(
  "gunType/updateGunType",
  async (item: GunTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, GUN_TYPE_ID: Number(item.id) || item.GUN_TYPE_ID };
      const response = await fetch(`${API_URL}/gun-type-master/${payload.GUN_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update gun type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update gun type");
    }
  }
);

export const deleteGunType = createAsyncThunk(
  "gunType/deleteGunType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/gun-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete gun type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete gun type");
    }
  }
);

const gunTypeSlice = createSlice({
  name: "gunType",
  initialState,
  reducers: {
    clearGunTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGunTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGunTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.gunTypes = action.payload;
      })
      .addCase(fetchGunTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch gun types";
      })
      .addCase(addGunType.pending, (state) => { state.error = null; })
      .addCase(addGunType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add gun type";
      })
      .addCase(updateGunType.pending, (state) => { state.error = null; })
      .addCase(updateGunType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update gun type";
      })
      .addCase(deleteGunType.pending, (state) => { state.error = null; })
      .addCase(deleteGunType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete gun type";
      });
  },
});

export const { clearGunTypeError } = gunTypeSlice.actions;
export default gunTypeSlice.reducer;
