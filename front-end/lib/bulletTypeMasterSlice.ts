import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BulletTypeGridData {
  id?: string | number;
  BULLET_TYPE_ID?: number;
  BULLET_TYPE_NAME: string;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BulletTypeState {
  records: BulletTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BulletTypeState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchBulletTypes = createAsyncThunk(
  "bulletType/fetchBulletTypes",
  async (status: string = "AC", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bullet-type-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch bullet types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BULLET_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch bullet types");
    }
  }
);

export const addBulletType = createAsyncThunk(
  "bulletType/addBulletType",
  async (item: BulletTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bullet-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add bullet type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add bullet type");
    }
  }
);

export const updateBulletType = createAsyncThunk(
  "bulletType/updateBulletType",
  async (item: BulletTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BULLET_TYPE_ID: Number(item.id) || item.BULLET_TYPE_ID };
      const response = await fetch(`${API_URL}/bullet-type-master/${payload.BULLET_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update bullet type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update bullet type");
    }
  }
);

export const deleteBulletType = createAsyncThunk(
  "bulletType/deleteBulletType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/bullet-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete bullet type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete bullet type");
    }
  }
);

const bulletTypeSlice = createSlice({
  name: "bulletType",
  initialState,
  reducers: {
    clearBulletTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBulletTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBulletTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchBulletTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch bullet types";
      })
      .addCase(addBulletType.pending, (state) => { state.error = null; })
      .addCase(addBulletType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add bullet type";
      })
      .addCase(updateBulletType.pending, (state) => { state.error = null; })
      .addCase(updateBulletType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update bullet type";
      })
      .addCase(deleteBulletType.pending, (state) => { state.error = null; })
      .addCase(deleteBulletType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete bullet type";
      });
  },
});

export const { clearBulletTypeError } = bulletTypeSlice.actions;
export default bulletTypeSlice.reducer;
