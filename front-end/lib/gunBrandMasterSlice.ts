import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface GunBrandGridData {
  id?: string | number;
  GUN_BRAND_ID?: number;
  BRAND_NAME: string;
  BP_ID?: number;
  COUNTRY_OF_ORIGIN?: number;
  Country_Name?: string;
  WEBSITE?: string;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  EMAIL?: string;
  WARRANTY_AVAILABLE?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface GunBrandState {
  gunBrands: GunBrandGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: GunBrandState = {
  gunBrands: [],
  loading: false,
  error: null,
};

export const fetchGunBrands = createAsyncThunk(
  "gunBrand/fetchGunBrands",
  async (status: string = "AC", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/gun-brand-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch gun brands");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.GUN_BRAND_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch gun brands");
    }
  }
);

export const fetchGunBrandById = createAsyncThunk(
  "gunBrand/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/gun-brand-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch gun brand");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch gun brand");
    }
  }
);

export const addGunBrand = createAsyncThunk(
  "gunBrand/addGunBrand",
  async (item: GunBrandGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/gun-brand-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add gun brand");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add gun brand");
    }
  }
);

export const updateGunBrand = createAsyncThunk(
  "gunBrand/updateGunBrand",
  async (item: GunBrandGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, GUN_BRAND_ID: Number(item.id) || item.GUN_BRAND_ID };
      const response = await fetch(`${API_URL}/gun-brand-master/${payload.GUN_BRAND_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update gun brand");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update gun brand");
    }
  }
);

export const deleteGunBrand = createAsyncThunk(
  "gunBrand/deleteGunBrand",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/gun-brand-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete gun brand");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete gun brand");
    }
  }
);

const gunBrandSlice = createSlice({
  name: "gunBrand",
  initialState,
  reducers: {
    clearGunBrandError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGunBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGunBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.gunBrands = action.payload;
      })
      .addCase(fetchGunBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch gun brands";
      })
      .addCase(addGunBrand.pending, (state) => { state.error = null; })
      .addCase(addGunBrand.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add gun brand";
      })
      .addCase(updateGunBrand.pending, (state) => { state.error = null; })
      .addCase(updateGunBrand.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update gun brand";
      })
      .addCase(deleteGunBrand.pending, (state) => { state.error = null; })
      .addCase(deleteGunBrand.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete gun brand";
      });
  },
});

export const { clearGunBrandError } = gunBrandSlice.actions;
export default gunBrandSlice.reducer;
