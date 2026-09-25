import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ProductGridData {
  id?: string | number;
  PRODUCT_ID?: number;
  PRODUCT_NAME?: string;
  TBS_PRODUCT_NAME?: string;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  UOM_ID?: number;
  NO_OF_PCS_PER_PACKING?: number;
  ALTERNATE_UOM_ID?: number;
  COST_CENTRE_ID?: number;
  COMPANY_ID?: number;
  TRUCK_ID?: number;
  TRUCK_NAME?: string;
  PRODUCTION_COST?: number;
  VAT_PERCENTAGE?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ProductState {
  products: ProductGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
};

export const fetchProducts = createAsyncThunk(
  "product/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch products");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PRODUCT_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch products");
    }
  }
);

export const fetchProductById = createAsyncThunk(
  "product/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch product");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch product");
    }
  }
);

export const addProduct = createAsyncThunk(
  "product/add",
  async (item: ProductGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add product");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add product");
    }
  }
);

export const updateProduct = createAsyncThunk(
  "product/update",
  async (item: ProductGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PRODUCT_ID: Number(item.id) || item.PRODUCT_ID };
      const response = await fetch(`${API_URL}/product-master/${payload.PRODUCT_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update product");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update product");
    }
  }
);

export const deleteProduct = createAsyncThunk(
  "product/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/product-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete product");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete product");
    }
  }
);

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    clearProductError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.products = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch products";
      })
      .addCase(addProduct.pending, (state) => { state.error = null; })
      .addCase(addProduct.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add product";
      })
      .addCase(updateProduct.pending, (state) => { state.error = null; })
      .addCase(updateProduct.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update product";
      })
      .addCase(deleteProduct.pending, (state) => { state.error = null; })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete product";
      });
  },
});

export const { clearProductError } = productSlice.actions;
export default productSlice.reducer;
