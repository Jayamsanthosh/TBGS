import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface OpeningStockDtl {
  key?: string;
  OPENING_STOCK_DTL_ID?: number;
  LINE_NO?: number;
  MAIN_CATEGORY_ID?: number;
  MAIN_CATEGORY_NAME?: string;
  SUB_CATEGORY_ID?: number;
  SUB_CATEGORY_NAME?: string;
  PRODUCT_ID?: number;
  PRODUCT_NAME?: string;
  NO_OF_PCS_PER_PACKING?: any;
  TOTAL_QUANTITY?: any;
  UOM_ID?: number;
  UOM_NAME?: string;
  ALT_QUANTITY?: any;
  ALT_UOM_ID?: number;
  ALT_UOM_NAME?: string;
  RATE_FC?: any;
  TOTAL_COST_FC?: any;
  EXCHANGE_RATE?: any;
  RATE_LC?: any;
  TOTAL_COST_LC?: any;
  BATCH_NO?: string;
  SERIAL_NO?: string;
  MANUFACTURE_DATE?: string;
  EXPIRY_DATE?: string;
  RACK_ID?: number;
  RACK_NAME?: string;
  REMARKS?: string;
  STATUS_ENTRY?: string;
}

export interface OpeningStockGridData {
  id?: string | number;
  SNO?: number;
  OPENING_STOCK_REF_NO?: string;
  openingStockNo?: string;
  refNo?: string;
  OPENING_STOCK_DATE?: string;
  openingStockDate?: string;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  companyName?: string;
  CAMP_ID?: number;
  CAMP_NAME?: string;
  campName?: string;
  STORE_ID?: number;
  STORE_NAME?: string;
  storeName?: string;
  LOCATION_ID?: number;
  LOCATION_NAME?: string;
  locationName?: string;
  CURRENCY_ID?: number;
  CURRENCY_NAME?: string;
  currencyName?: string;
  EXCHANGE_RATE?: any;
  TOTAL_QUANTITY?: any;
  TOTAL_VALUE_FC?: any;
  TOTAL_VALUE_LC?: any;
  STATUS_ID?: number;
  STATUS_NAME?: string;
  statusName?: string;
  STATUS_ENTRY?: string;
  REMARKS?: string;
  LINK_PAGES_ID?: number;
  RESPONSE_BY_EMP_ID?: number;
  RESPONSE_DATE?: string;
  RESPONSE_REMARKS?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: OpeningStockDtl[];
  deletedIds?: number[];
}

interface OpeningStockMasterState {
  items: OpeningStockGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: OpeningStockMasterState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchOpeningStocks = createAsyncThunk(
  "openingStockMaster/fetchAll",
  async (_params: { companyId?: number } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/opening-stock`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch opening stock records");
      }
      const json = await response.json();
      const rows = json.data || [];
      return rows.map((u: any) => ({
        ...u,
        id: u.SNO ?? u.OPENING_STOCK_REF_NO ?? u.id,
      }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch opening stock records");
    }
  }
);

export const fetchOpeningStockHdr = createAsyncThunk(
  "openingStockMaster/fetchHdr",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/opening-stock/hdr/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch opening stock header");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch opening stock header");
    }
  }
);

export const fetchOpeningStockDtls = createAsyncThunk(
  "openingStockMaster/fetchDtls",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/opening-stock/dtls/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch opening stock details");
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch opening stock details");
    }
  }
);

export const fetchOpeningStockDtl = createAsyncThunk(
  "openingStockMaster/fetchDtl",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/opening-stock/dtl/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch opening stock detail");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch opening stock detail");
    }
  }
);

export const addOpeningStock = createAsyncThunk(
  "openingStockMaster/add",
  async (item: OpeningStockGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/opening-stock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add opening stock");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add opening stock");
    }
  }
);

export const updateOpeningStock = createAsyncThunk(
  "openingStockMaster/update",
  async (item: OpeningStockGridData, { rejectWithValue }) => {
    try {
      const refNo = item.openingStockNo || item.OPENING_STOCK_REF_NO || item.refNo || "";
      const response = await fetch(`${API_URL}/opening-stock/${encodeURIComponent(refNo)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update opening stock");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update opening stock");
    }
  }
);

export const deleteOpeningStockDtl = createAsyncThunk(
  "openingStockMaster/deleteDtl",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/opening-stock/dtl/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete opening stock detail");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete opening stock detail");
    }
  }
);

export const deleteOpeningStockHdr = createAsyncThunk(
  "openingStockMaster/deleteHdr",
  async (refNo: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/opening-stock/${encodeURIComponent(String(refNo))}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete opening stock");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete opening stock");
    }
  }
);

const openingStockMasterSlice = createSlice({
  name: "openingStockMaster",
  initialState,
  reducers: {
    clearOpeningStockMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOpeningStocks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOpeningStocks.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOpeningStocks.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch opening stock records";
      })
      .addCase(addOpeningStock.pending, (state) => {
        state.error = null;
      })
      .addCase(addOpeningStock.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add opening stock";
      })
      .addCase(updateOpeningStock.pending, (state) => {
        state.error = null;
      })
      .addCase(updateOpeningStock.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update opening stock";
      })
      .addCase(deleteOpeningStockDtl.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteOpeningStockDtl.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete opening stock detail";
      })
      .addCase(deleteOpeningStockHdr.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteOpeningStockHdr.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete opening stock";
      });
  },
});

export const { clearOpeningStockMasterError } = openingStockMasterSlice.actions;
export default openingStockMasterSlice.reducer;