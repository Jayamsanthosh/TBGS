import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CustomerWiseTripTemplatePriceMappingGridData {
  id?: string | number;
  PRICE_CUSTOMER_ID?: number;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  BP_ID?: number;
  BP_NAME?: string;
  TRIP_TEMPLATE_ID?: number;
  TRIP_TEMPLATE_NAME?: string;
  TRUCK_TYPE_ID?: number;
  TRUCK_TYPE_NAME?: string;
  TRIP_AMOUNT?: number;
  CURRENCY_ID?: number;
  CURRENCY_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface CustomerWiseTripTemplatePriceMappingState {
  items: CustomerWiseTripTemplatePriceMappingGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomerWiseTripTemplatePriceMappingState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCustomerWiseTripTemplatePriceMapping = createAsyncThunk(
  "customerWiseTripTemplatePriceMapping/fetchCustomerWiseTripTemplatePriceMapping",
  async (status: string = "AC", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customer-wise-trip-template-price-mapping?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch customer wise trip template price mappings");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PRICE_CUSTOMER_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch customer wise trip template price mappings");
    }
  }
);

export const addCustomerWiseTripTemplatePriceMapping = createAsyncThunk(
  "customerWiseTripTemplatePriceMapping/addCustomerWiseTripTemplatePriceMapping",
  async (item: CustomerWiseTripTemplatePriceMappingGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customer-wise-trip-template-price-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add customer wise trip template price mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add customer wise trip template price mapping");
    }
  }
);

export const updateCustomerWiseTripTemplatePriceMapping = createAsyncThunk(
  "customerWiseTripTemplatePriceMapping/updateCustomerWiseTripTemplatePriceMapping",
  async (item: CustomerWiseTripTemplatePriceMappingGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PRICE_CUSTOMER_ID: Number(item.id) || item.PRICE_CUSTOMER_ID };
      const response = await fetch(`${API_URL}/customer-wise-trip-template-price-mapping/${payload.PRICE_CUSTOMER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update customer wise trip template price mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update customer wise trip template price mapping");
    }
  }
);

export const deleteCustomerWiseTripTemplatePriceMapping = createAsyncThunk(
  "customerWiseTripTemplatePriceMapping/deleteCustomerWiseTripTemplatePriceMapping",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/customer-wise-trip-template-price-mapping/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete customer wise trip template price mapping");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete customer wise trip template price mapping");
    }
  }
);

const customerWiseTripTemplatePriceMappingSlice = createSlice({
  name: "customerWiseTripTemplatePriceMapping",
  initialState,
  reducers: {
    clearCustomerWiseTripTemplatePriceMappingError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerWiseTripTemplatePriceMapping.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerWiseTripTemplatePriceMapping.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCustomerWiseTripTemplatePriceMapping.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch customer wise trip template price mappings";
      })
      .addCase(addCustomerWiseTripTemplatePriceMapping.pending, (state) => { state.error = null; })
      .addCase(addCustomerWiseTripTemplatePriceMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add customer wise trip template price mapping";
      })
      .addCase(updateCustomerWiseTripTemplatePriceMapping.pending, (state) => { state.error = null; })
      .addCase(updateCustomerWiseTripTemplatePriceMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update customer wise trip template price mapping";
      })
      .addCase(deleteCustomerWiseTripTemplatePriceMapping.pending, (state) => { state.error = null; })
      .addCase(deleteCustomerWiseTripTemplatePriceMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete customer wise trip template price mapping";
      });
  },
});

export const { clearCustomerWiseTripTemplatePriceMappingError } = customerWiseTripTemplatePriceMappingSlice.actions;
export default customerWiseTripTemplatePriceMappingSlice.reducer;
