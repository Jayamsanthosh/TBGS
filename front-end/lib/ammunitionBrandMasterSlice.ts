import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AmmunitionBrandGridData {
  id?: string | number;
  AMMUNITION_BRAND_ID?: number;
  BRAND_NAME: string;
  COUNTRY_OF_ORIGIN?: number;
  COUNTRY_NAME?: string;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  EMAIL?: string;
  WEBSITE?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface AmmunitionBrandState {
  records: AmmunitionBrandGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: AmmunitionBrandState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchAmmunitionBrands = createAsyncThunk(
  "ammunitionBrand/fetchAmmunitionBrands",
  async (status: string = "AC", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/ammunition-brand-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch ammunition brands");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.AMMUNITION_BRAND_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch ammunition brands");
    }
  }
);

export const addAmmunitionBrand = createAsyncThunk(
  "ammunitionBrand/addAmmunitionBrand",
  async (item: AmmunitionBrandGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/ammunition-brand-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add ammunition brand");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add ammunition brand");
    }
  }
);

export const updateAmmunitionBrand = createAsyncThunk(
  "ammunitionBrand/updateAmmunitionBrand",
  async (item: AmmunitionBrandGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, AMMUNITION_BRAND_ID: Number(item.id) || item.AMMUNITION_BRAND_ID };
      const response = await fetch(`${API_URL}/ammunition-brand-master/${payload.AMMUNITION_BRAND_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update ammunition brand");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update ammunition brand");
    }
  }
);

export const deleteAmmunitionBrand = createAsyncThunk(
  "ammunitionBrand/deleteAmmunitionBrand",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/ammunition-brand-master/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete ammunition brand");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete ammunition brand");
    }
  }
);

const ammunitionBrandSlice = createSlice({
  name: "ammunitionBrand",
  initialState,
  reducers: {
    clearAmmunitionBrandError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAmmunitionBrands.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAmmunitionBrands.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchAmmunitionBrands.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch ammunition brands";
      })
      .addCase(addAmmunitionBrand.pending, (state) => { state.error = null; })
      .addCase(addAmmunitionBrand.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add ammunition brand";
      })
      .addCase(updateAmmunitionBrand.pending, (state) => { state.error = null; })
      .addCase(updateAmmunitionBrand.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update ammunition brand";
      })
      .addCase(deleteAmmunitionBrand.pending, (state) => { state.error = null; })
      .addCase(deleteAmmunitionBrand.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete ammunition brand";
      });
  },
});

export const { clearAmmunitionBrandError } = ammunitionBrandSlice.actions;
export default ammunitionBrandSlice.reducer;
