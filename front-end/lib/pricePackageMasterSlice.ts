import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PricePackageGridData {
  id?: string | number;
  PRICE_PACKAGE_ID?: number;
  PRICE_PACKAGE_TYPE?: string;
  PRICE_PACKAGE_NAME?: string;
  PRICE_PACKAGE_DAYS?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface PricePackageState {
  pricePackages: PricePackageGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: PricePackageState = {
  pricePackages: [],
  loading: false,
  error: null,
};

export const fetchPricePackages = createAsyncThunk(
  "pricePackage/fetchPricePackages",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/price-package-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch price packages");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PRICE_PACKAGE_ID }));
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to fetch price packages");
    }
  }
);

export const addPricePackage = createAsyncThunk(
  "pricePackage/addPricePackage",
  async (item: PricePackageGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/price-package-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add price package");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to add price package");
    }
  }
);

export const updatePricePackage = createAsyncThunk(
  "pricePackage/updatePricePackage",
  async (item: PricePackageGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PRICE_PACKAGE_ID: Number(item.id) || item.PRICE_PACKAGE_ID };
      const response = await fetch(`${API_URL}/price-package-master/${payload.PRICE_PACKAGE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update price package");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to update price package");
    }
  }
);

export const deletePricePackage = createAsyncThunk(
  "pricePackage/deletePricePackage",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/price-package-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete price package");
      }
      return await response.json(); } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to delete price package");
    }
  }
);

const pricePackageSlice = createSlice({
  name: "pricePackage",
  initialState,
  reducers: {
    clearPricePackageError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPricePackages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPricePackages.fulfilled, (state, action) => {
        state.loading = false;
        state.pricePackages = action.payload;
      })
      .addCase(fetchPricePackages.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch price packages";
      })
      .addCase(addPricePackage.pending, (state) => { state.error = null; })
      .addCase(addPricePackage.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add price package";
      })
      .addCase(updatePricePackage.pending, (state) => { state.error = null; })
      .addCase(updatePricePackage.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update price package";
      })
      .addCase(deletePricePackage.pending, (state) => { state.error = null; })
      .addCase(deletePricePackage.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete price package";
      });
  },
});

export const { clearPricePackageError } = pricePackageSlice.actions;
export default pricePackageSlice.reducer;
