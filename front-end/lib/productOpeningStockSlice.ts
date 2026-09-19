import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ProductOpeningStockGridData {
  id?: string | number;
  SNO?: number;
  OPENING_STOCK_DATE?: string;
  COMPANY_NAME?: string;
  CAMP_NAME?: string;
  STORE_NAME?: string;
  MAIN_CATEGORY_NAME?: string;
  SUB_CATEGORY_NAME?: string;
  PRODUCT_NAME?: string;
  QTY?: number;
  APPROVED_BY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ProductOpeningStockState {
  records: ProductOpeningStockGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductOpeningStockState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchProductOpeningStocks = createAsyncThunk(
  "productOpeningStock/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-opening-stock`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch product opening stocks");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product opening stocks");
    }
  }
);

export const fetchProductOpeningStockById = createAsyncThunk(
  "productOpeningStock/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-opening-stock/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch product opening stock");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product opening stock");
    }
  }
);

export const addProductOpeningStock = createAsyncThunk(
  "productOpeningStock/add",
  async (item: any, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-opening-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add product opening stock");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add product opening stock");
    }
  }
);

export const updateProductOpeningStock = createAsyncThunk(
  "productOpeningStock/update",
  async (item: any, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/product-opening-stock/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update product opening stock");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update product opening stock");
    }
  }
);

export const deleteProductOpeningStock = createAsyncThunk(
  "productOpeningStock/delete",
  async (payload: { id: string | number; USER?: string; ROLE?: string; MAC_ADDRESS?: string } | string | number, { rejectWithValue }) => {
    try {
      const id = typeof payload === "object" ? payload.id : payload;
      const body = typeof payload === "object"
        ? JSON.stringify({ USER: payload.USER || "Admin", ROLE: payload.ROLE || "Admin", MAC_ADDRESS: payload.MAC_ADDRESS || "WEB" })
        : JSON.stringify({ USER: "Admin", ROLE: "Admin", MAC_ADDRESS: "WEB" });
      const response = await fetch(`${API_URL}/product-opening-stock/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete product opening stock");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete product opening stock");
    }
  }
);

const productOpeningStockSlice = createSlice({
  name: "productOpeningStock",
  initialState,
  reducers: {
    clearProductOpeningStockError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductOpeningStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductOpeningStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchProductOpeningStocks.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch product opening stocks";
      })
      .addCase(addProductOpeningStock.pending, (state) => { state.error = null; })
      .addCase(addProductOpeningStock.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add product opening stock";
      })
      .addCase(updateProductOpeningStock.pending, (state) => { state.error = null; })
      .addCase(updateProductOpeningStock.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update product opening stock";
      })
      .addCase(deleteProductOpeningStock.pending, (state) => { state.error = null; })
      .addCase(deleteProductOpeningStock.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete product opening stock";
      });
  },
});

export const { clearProductOpeningStockError } = productOpeningStockSlice.actions;
export default productOpeningStockSlice.reducer;
