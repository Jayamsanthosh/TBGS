import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface StoreGridData {
  id?: string | number;
  STORE_ID?: number;
  STORE_NAME?: string;
  STORE_SHORT_NAME?: string;
  CAMP_ID?: number;
  MANAGER_NAME?: string;
  STORE_SHORT_CODE?: string;
  EMAIL_ADDRESS?: string;
  CC_EMAIL_ADDRESS?: string;
  BCC_EMAIL_ADDRESS?: string;
  RESPONSE_DIRECTORS_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface StoreState {
  stores: StoreGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: StoreState = {
  stores: [],
  loading: false,
  error: null,
};

export const fetchStores = createAsyncThunk(
  "store/fetchStores",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/store-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch stores");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.Store_Id }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch stores");
    }
  }
);

export const addStore = createAsyncThunk(
  "store/addStore",
  async (item: StoreGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/store-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add store");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add store");
    }
  }
);

export const updateStore = createAsyncThunk(
  "store/updateStore",
  async (item: StoreGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, STORE_ID: Number(item.id) || item.STORE_ID };
      const response = await fetch(`${API_URL}/store-master/${payload.STORE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update store");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update store");
    }
  }
);

export const deleteStore = createAsyncThunk(
  "store/deleteStore",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/store-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete store");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete store");
    }
  }
);

const storeSlice = createSlice({
  name: "store",
  initialState,
  reducers: {
    clearStoreError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStores.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStores.fulfilled, (state, action) => {
        state.loading = false;
        state.stores = action.payload;
      })
      .addCase(fetchStores.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch stores";
      })
      .addCase(addStore.pending, (state) => { state.error = null; })
      .addCase(addStore.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add store";
      })
      .addCase(updateStore.pending, (state) => { state.error = null; })
      .addCase(updateStore.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update store";
      })
      .addCase(deleteStore.pending, (state) => { state.error = null; })
      .addCase(deleteStore.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete store";
      });
  },
});

export const { clearStoreError } = storeSlice.actions;
export default storeSlice.reducer;
