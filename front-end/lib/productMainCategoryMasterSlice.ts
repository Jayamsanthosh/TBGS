import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ProductMainCategoryGridData {
  id?: string | number;
  MAIN_CATEGORY_ID?: number;
  MAIN_CATEGORY_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ProductMainCategoryState {
  categories: ProductMainCategoryGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductMainCategoryState = {
  categories: [],
  loading: false,
  error: null,
};

export const fetchProductMainCategories = createAsyncThunk(
  "productMainCategory/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-main-category`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch main categories");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.MAIN_CATEGORY_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch main categories");
    }
  }
);

export const addProductMainCategory = createAsyncThunk(
  "productMainCategory/add",
  async (item: ProductMainCategoryGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-main-category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add main category");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add main category");
    }
  }
);

export const updateProductMainCategory = createAsyncThunk(
  "productMainCategory/update",
  async (item: ProductMainCategoryGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, MAIN_CATEGORY_ID: Number(item.id) || item.MAIN_CATEGORY_ID };
      const response = await fetch(`${API_URL}/product-main-category/${payload.MAIN_CATEGORY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update main category");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update main category");
    }
  }
);

export const deleteProductMainCategory = createAsyncThunk(
  "productMainCategory/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/product-main-category/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete main category");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete main category");
    }
  }
);

const productMainCategorySlice = createSlice({
  name: "productMainCategory",
  initialState,
  reducers: {
    clearProductMainCategoryError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductMainCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductMainCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.categories = action.payload;
      })
      .addCase(fetchProductMainCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch main categories";
      })
      .addCase(addProductMainCategory.pending, (state) => { state.error = null; })
      .addCase(addProductMainCategory.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add main category";
      })
      .addCase(updateProductMainCategory.pending, (state) => { state.error = null; })
      .addCase(updateProductMainCategory.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update main category";
      })
      .addCase(deleteProductMainCategory.pending, (state) => { state.error = null; })
      .addCase(deleteProductMainCategory.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete main category";
      });
  },
});

export const { clearProductMainCategoryError } = productMainCategorySlice.actions;
export default productMainCategorySlice.reducer;
