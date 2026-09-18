import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BulletMasterGridData {
  id?: string | number;
  BULLET_ID?: number;
  BULLET_CODE?: string;
  BULLET_NAME?: string;
  BRAND_NAME?: string;
  CALIBER_NAME?: string;
  GRAIN_WEIGHT?: number;
  PACK_SIZE?: number;
  ROUNDS_PER_BOX?: number;
  REORDER_LEVEL?: number;
  BULLET_TYPE_ID?: number;
  AMMUNITION_BRAND_ID?: number;
  CALIBER_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BulletMasterState {
  bullets: BulletMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BulletMasterState = {
  bullets: [],
  loading: false,
  error: null,
};

export const fetchBulletMasters = createAsyncThunk(
  "bulletMaster/fetchBulletMasters",
  async (params: {
    status?: string;
    ammunitionBrandId?: string;
    caliberId?: string;
  } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.ammunitionBrandId) query.set("ammunitionBrandId", params.ammunitionBrandId);
      if (params.caliberId) query.set("caliberId", params.caliberId);

      const url = `${API_URL}/bullet-master${query.toString() ? "?" + query.toString() : ""}`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch bullets");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BULLET_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch bullets");
    }
  }
);

export const fetchBulletMasterById = createAsyncThunk(
  "bulletMaster/fetchBulletMasterById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bullet-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch bullet");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch bullet");
    }
  }
);

export const addBulletMaster = createAsyncThunk(
  "bulletMaster/addBulletMaster",
  async (item: BulletMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bullet-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add bullet");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add bullet");
    }
  }
);

export const updateBulletMaster = createAsyncThunk(
  "bulletMaster/updateBulletMaster",
  async (item: BulletMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BULLET_ID: Number(item.id) || item.BULLET_ID };
      const response = await fetch(`${API_URL}/bullet-master/${payload.BULLET_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update bullet");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update bullet");
    }
  }
);

export const deleteBulletMaster = createAsyncThunk(
  "bulletMaster/deleteBulletMaster",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/bullet-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete bullet");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete bullet");
    }
  }
);

const bulletMasterSlice = createSlice({
  name: "bulletMaster",
  initialState,
  reducers: {
    clearBulletMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBulletMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBulletMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.bullets = action.payload;
      })
      .addCase(fetchBulletMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch bullets";
      })
      .addCase(addBulletMaster.pending, (state) => { state.error = null; })
      .addCase(addBulletMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add bullet";
      })
      .addCase(updateBulletMaster.pending, (state) => { state.error = null; })
      .addCase(updateBulletMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update bullet";
      })
      .addCase(deleteBulletMaster.pending, (state) => { state.error = null; })
      .addCase(deleteBulletMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete bullet";
      });
  },
});

export const { clearBulletMasterError } = bulletMasterSlice.actions;
export default bulletMasterSlice.reducer;
