import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ProductCompanyMainCategoryMappingGridData {
  id?: string | number;
  SNO?: number;
  COMPANY_NAME?: string;
  MAIN_CATEGORY_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ProductCompanyMainCategoryMappingState {
  records: ProductCompanyMainCategoryMappingGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ProductCompanyMainCategoryMappingState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchProductCompanyMainCategoryMappings = createAsyncThunk(
  "productCompanyMainCategoryMapping/fetchAll",
  async (filters: { companyId?: string; mainCategoryId?: string } | undefined, { rejectWithValue }) => {
    try {
      const params = new URLSearchParams();
      if (filters?.companyId) params.set("companyId", filters.companyId);
      if (filters?.mainCategoryId) params.set("mainCategoryId", filters.mainCategoryId);
      const qs = params.toString();
      const response = await fetch(`${API_URL}/product-company-main-category-mapping${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch mappings");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch mappings");
    }
  }
);

export const fetchProductCompanyMainCategoryMappingById = createAsyncThunk(
  "productCompanyMainCategoryMapping/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-company-main-category-mapping/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch mapping");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch mapping");
    }
  }
);

export const addProductCompanyMainCategoryMapping = createAsyncThunk(
  "productCompanyMainCategoryMapping/add",
  async (item: any, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-company-main-category-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add mapping");
    }
  }
);

export const updateProductCompanyMainCategoryMapping = createAsyncThunk(
  "productCompanyMainCategoryMapping/update",
  async (item: any, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/product-company-main-category-mapping/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update mapping");
    }
  }
);

export const deleteProductCompanyMainCategoryMapping = createAsyncThunk(
  "productCompanyMainCategoryMapping/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/product-company-main-category-mapping/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete mapping");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete mapping");
    }
  }
);

const productCompanyMainCategoryMappingSlice = createSlice({
  name: "productCompanyMainCategoryMapping",
  initialState,
  reducers: {
    clearProductCompanyMainCategoryMappingError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProductCompanyMainCategoryMappings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProductCompanyMainCategoryMappings.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchProductCompanyMainCategoryMappings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch mappings";
      })
      .addCase(addProductCompanyMainCategoryMapping.pending, (state) => { state.error = null; })
      .addCase(addProductCompanyMainCategoryMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add mapping";
      })
      .addCase(updateProductCompanyMainCategoryMapping.pending, (state) => { state.error = null; })
      .addCase(updateProductCompanyMainCategoryMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update mapping";
      })
      .addCase(deleteProductCompanyMainCategoryMapping.pending, (state) => { state.error = null; })
      .addCase(deleteProductCompanyMainCategoryMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete mapping";
      });
  },
});

export const { clearProductCompanyMainCategoryMappingError } = productCompanyMainCategoryMappingSlice.actions;
export default productCompanyMainCategoryMappingSlice.reducer;
