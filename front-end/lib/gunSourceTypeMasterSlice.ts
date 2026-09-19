import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface GunSourceTypeGridData {
  id?: string | number;
  GUN_SOURCE_TYPE_ID?: number;
  GUN_SOURCE_TYPE_NAME?: string;
  GUN_SOURCE_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface GunSourceTypeState {
  items: GunSourceTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: GunSourceTypeState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchItems = createAsyncThunk(
  "gunSourceTypeMaster/fetchItems",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/gun-source-type-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/gun-source-type-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch gun source types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.GUN_SOURCE_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch gun source types");
    }
  }
);

export const addItem = createAsyncThunk(
  "gunSourceTypeMaster/addItem",
  async (item: GunSourceTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/gun-source-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add gun source type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add gun source type");
    }
  }
);

export const updateItem = createAsyncThunk(
  "gunSourceTypeMaster/updateItem",
  async (item: GunSourceTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, GUN_SOURCE_TYPE_ID: Number(item.id) || item.GUN_SOURCE_TYPE_ID };
      const response = await fetch(`${API_URL}/gun-source-type-master/${payload.GUN_SOURCE_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update gun source type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update gun source type");
    }
  }
);

export const deleteItem = createAsyncThunk(
  "gunSourceTypeMaster/deleteItem",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/gun-source-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete gun source type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete gun source type");
    }
  }
);

const gunSourceTypeMasterSlice = createSlice({
  name: "gunSourceTypeMaster",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItem.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = gunSourceTypeMasterSlice.actions;
export default gunSourceTypeMasterSlice.reducer;