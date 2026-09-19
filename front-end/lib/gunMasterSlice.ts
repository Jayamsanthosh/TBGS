import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface GunMasterGridData {
  id?: string | number;
  GUN_ID?: number;
  GUN_CODE?: string;
  GUN_NAME?: string;
  GUN_CATEGORY_NAME?: string;
  TYPE_NAME?: string;
  BRAND_Name?: string;
  CALIBER_NAME?: string;
  CAMP_NAME?: string;
  STORE_name?: string;
  MODEL?: string;
  SERIAL_NUMBER?: string;
  BARREL_LENGTH?: number;
  MAGAZINE_CAPACITY?: number;
  LICENSE_NUMBER?: string;
  REMARKS?: string;
  GUN_OWNER_BP_ID?: number;
  GUN_SOURCE_TYPE_ID?: number;
  BP_NAME?: string;
  GUN_SOURCE_TYPE_NAME?: string;
  STATUS_MASTER?: string;
}

interface GunMasterState {
  guns: GunMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: GunMasterState = {
  guns: [],
  loading: false,
  error: null,
};

export const fetchGunMasters = createAsyncThunk(
  "gunMaster/fetchGunMasters",
  async (params: {
    status?: string;
    gunCategoryId?: string;
    gunTypeId?: string;
    gunBrandId?: string;
    caliberId?: string;
    campId?: string;
    storeId?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.gunCategoryId) query.set("gunCategoryId", params.gunCategoryId);
      if (params.gunTypeId) query.set("gunTypeId", params.gunTypeId);
      if (params.gunBrandId) query.set("gunBrandId", params.gunBrandId);
      if (params.caliberId) query.set("caliberId", params.caliberId);
      if (params.campId) query.set("campId", params.campId);
      if (params.storeId) query.set("storeId", params.storeId);

      const url = `${API_URL}/gun-master${query.toString() ? "?" + query.toString() : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch guns");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.GUN_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch guns");
    }
  }
);

export const fetchGunMasterById = createAsyncThunk(
  "gunMaster/fetchGunMasterById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/gun-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch gun");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch gun");
    }
  }
);

export const addGunMaster = createAsyncThunk(
  "gunMaster/addGunMaster",
  async (item: GunMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/gun-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add gun");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add gun");
    }
  }
);

export const updateGunMaster = createAsyncThunk(
  "gunMaster/updateGunMaster",
  async (item: GunMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, GUN_ID: Number(item.id) || item.GUN_ID };
      const response = await fetch(`${API_URL}/gun-master/${payload.GUN_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update gun");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update gun");
    }
  }
);

export const deleteGunMaster = createAsyncThunk(
  "gunMaster/deleteGunMaster",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/gun-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete gun");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete gun");
    }
  }
);

const gunMasterSlice = createSlice({
  name: "gunMaster",
  initialState,
  reducers: {
    clearGunMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGunMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGunMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.guns = action.payload;
      })
      .addCase(fetchGunMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch guns";
      })
      .addCase(addGunMaster.pending, (state) => { state.error = null; })
      .addCase(addGunMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add gun";
      })
      .addCase(updateGunMaster.pending, (state) => { state.error = null; })
      .addCase(updateGunMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update gun";
      })
      .addCase(deleteGunMaster.pending, (state) => { state.error = null; })
      .addCase(deleteGunMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete gun";
      });
  },
});

export const { clearGunMasterError } = gunMasterSlice.actions;
export default gunMasterSlice.reducer;
