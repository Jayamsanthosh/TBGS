import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface GunCategoryGridData {
  id?: string | number;
  GUN_CATEGORY_ID?: number;
  GUN_CATEGORY_NAME: string;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface GunCategoryState {
  gunCategories: GunCategoryGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: GunCategoryState = {
  gunCategories: [],
  loading: false,
  error: null,
};

export const fetchGunCategories = createAsyncThunk(
  "gunCategory/fetchGunCategories",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/gun-category-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/gun-category-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch gun categories");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.GUN_CATEGORY_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch gun categories");
    }
  }
);

export const addGunCategory = createAsyncThunk(
  "gunCategory/addGunCategory",
  async (item: GunCategoryGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/gun-category-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add gun category");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add gun category");
    }
  }
);

export const updateGunCategory = createAsyncThunk(
  "gunCategory/updateGunCategory",
  async (item: GunCategoryGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, GUN_CATEGORY_ID: Number(item.id) || item.GUN_CATEGORY_ID };
      const response = await fetch(`${API_URL}/gun-category-master/${payload.GUN_CATEGORY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update gun category");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update gun category");
    }
  }
);

export const deleteGunCategory = createAsyncThunk(
  "gunCategory/deleteGunCategory",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/gun-category-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete gun category");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete gun category");
    }
  }
);

const gunCategorySlice = createSlice({
  name: "gunCategory",
  initialState,
  reducers: {
    clearGunCategoryError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGunCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGunCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.gunCategories = action.payload;
      })
      .addCase(fetchGunCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch gun categories";
      })
      .addCase(addGunCategory.pending, (state) => { state.error = null; })
      .addCase(addGunCategory.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add gun category";
      })
      .addCase(updateGunCategory.pending, (state) => { state.error = null; })
      .addCase(updateGunCategory.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update gun category";
      })
      .addCase(deleteGunCategory.pending, (state) => { state.error = null; })
      .addCase(deleteGunCategory.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete gun category";
      });
  },
});

export const { clearGunCategoryError } = gunCategorySlice.actions;
export default gunCategorySlice.reducer;
