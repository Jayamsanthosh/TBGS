import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface StoreProductMinimumStockGridData {
  id?: string | number;
  SNO?: number;
  COMPANY_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  MINIMUM_STOCK_PCS?: number;
  PURCHASE_ALERT_QTY?: number;
  REQUESTED_BY?: string;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface StoreProductMinimumStockState {
  items: StoreProductMinimumStockGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: StoreProductMinimumStockState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchItems = createAsyncThunk(
  "storeProductMinimumStock/fetchItems",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/store-product-minimum-stock?status=${encodeURIComponent(status)}`
        : `${API_URL}/store-product-minimum-stock`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch minimum stock records");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch minimum stock records");
    }
  }
);

export const addItem = createAsyncThunk(
  "storeProductMinimumStock/addItem",
  async (item: StoreProductMinimumStockGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/store-product-minimum-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add minimum stock record");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add minimum stock record");
    }
  }
);

export const updateItem = createAsyncThunk(
  "storeProductMinimumStock/updateItem",
  async (item: StoreProductMinimumStockGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/store-product-minimum-stock/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update minimum stock record");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update minimum stock record");
    }
  }
);

export const deleteItem = createAsyncThunk(
  "storeProductMinimumStock/deleteItem",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/store-product-minimum-stock/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete minimum stock record");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete minimum stock record");
    }
  }
);

const storeProductMinimumStockSlice = createSlice({
  name: "storeProductMinimumStock",
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

export const { clearError } = storeProductMinimumStockSlice.actions;
export default storeProductMinimumStockSlice.reducer;
