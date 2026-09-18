import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ProductSubCategoryGridData {
  id?: string | number;
  SUB_CATEGORY_ID?: number;
  SUB_CATEGORY_NAME?: string;
  MAIN_CATEGORY_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ProductSubCategoryState {
  subCategories: ProductSubCategoryGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductSubCategoryState = {
  subCategories: [],
  loading: false,
  error: null,
};

export const fetchProductSubCategories = createAsyncThunk(
  "productSubCategory/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-sub-category`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch sub categories");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SUB_CATEGORY_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sub categories");
    }
  }
);

export const addProductSubCategory = createAsyncThunk(
  "productSubCategory/add",
  async (item: ProductSubCategoryGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-sub-category`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add sub category");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add sub category");
    }
  }
);

export const updateProductSubCategory = createAsyncThunk(
  "productSubCategory/update",
  async (item: ProductSubCategoryGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SUB_CATEGORY_ID: Number(item.id) || item.SUB_CATEGORY_ID };
      const response = await fetch(`${API_URL}/product-sub-category/${payload.SUB_CATEGORY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update sub category");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update sub category");
    }
  }
);

export const deleteProductSubCategory = createAsyncThunk(
  "productSubCategory/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/product-sub-category/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete sub category");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete sub category");
    }
  }
);

const productSubCategorySlice = createSlice({
  name: "productSubCategory",
  initialState,
  reducers: {
    clearProductSubCategoryError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductSubCategories.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductSubCategories.fulfilled, (state, action) => {
        state.loading = false;
        state.subCategories = action.payload;
      })
      .addCase(fetchProductSubCategories.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch sub categories";
      })
      .addCase(addProductSubCategory.pending, (state) => { state.error = null; })
      .addCase(addProductSubCategory.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add sub category";
      })
      .addCase(updateProductSubCategory.pending, (state) => { state.error = null; })
      .addCase(updateProductSubCategory.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update sub category";
      })
      .addCase(deleteProductSubCategory.pending, (state) => { state.error = null; })
      .addCase(deleteProductSubCategory.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete sub category";
      });
  },
});

export const { clearProductSubCategoryError } = productSubCategorySlice.actions;
export default productSubCategorySlice.reducer;
