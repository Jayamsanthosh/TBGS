import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PurchaseRequestTypeGridData {
  id?: string | number;
  requestTypeId?: number;
  requestTypeCode?: string;
  requestTypeName?: string;
  description?: string;
  remarks?: string;
  statusMaster?: string;
  createdBy?: string;
  createdDate?: string;
  createdMacAddress?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  modifiedMacAddress?: string;
}

export interface PurchaseRequestTypeOption {
  requestTypeId?: number;
  requestTypeCode?: string;
  requestTypeName?: string;
  displayText?: string;
}

export interface PurchaseRequestTypeListParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface PurchaseRequestTypeState {
  items: PurchaseRequestTypeGridData[];
  total: number;
  options: PurchaseRequestTypeOption[];
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseRequestTypeState = {
  items: [],
  total: 0,
  options: [],
  loading: false,
  error: null,
};

export const fetchPurchaseRequestTypes = createAsyncThunk(
  "purchaseRequestType/fetchAll",
  async (params: PurchaseRequestTypeListParams = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.search) query.set("search", params.search);
      if (params.page) query.set("page", String(params.page));
      if (params.pageSize) query.set("pageSize", String(params.pageSize));
      const qs = query.toString();

      const response = await fetch(
        `${API_URL}/purchase-request-type-master${qs ? `?${qs}` : ""}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase request types");
      }
      const json = await response.json();
      const rows = json.data || [];
      return {
        rows: rows.map((u: any) => ({ ...u, id: u.requestTypeId || u.REQUEST_TYPE_ID })),
        total: json.total ?? rows.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase request types");
    }
  }
);

export const fetchPurchaseRequestTypeById = createAsyncThunk(
  "purchaseRequestType/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-request-type-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase request type");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase request type");
    }
  }
);

export const loadPurchaseRequestTypeOptions = createAsyncThunk(
  "purchaseRequestType/loadOptions",
  async (includeInactive: boolean = false, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/purchase-request-type-master/load?includeInactive=${includeInactive}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to load purchase request types");
      }
      const json = await response.json();
      return (json.data || []).map((o: any) => ({ ...o, id: o.requestTypeId }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load purchase request types");
    }
  }
);

export const addPurchaseRequestType = createAsyncThunk(
  "purchaseRequestType/add",
  async (item: PurchaseRequestTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-request-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add purchase request type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add purchase request type");
    }
  }
);

export const updatePurchaseRequestType = createAsyncThunk(
  "purchaseRequestType/update",
  async (item: PurchaseRequestTypeGridData, { rejectWithValue }) => {
    try {
      const payload = {
        ...item,
        REQUEST_TYPE_ID: Number(item.id) || item.requestTypeId,
      };
      const response = await fetch(
        `${API_URL}/purchase-request-type-master/${payload.REQUEST_TYPE_ID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update purchase request type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update purchase request type");
    }
  }
);

export const deletePurchaseRequestType = createAsyncThunk(
  "purchaseRequestType/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/purchase-request-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete purchase request type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase request type");
    }
  }
);

const purchaseRequestTypeSlice = createSlice({
  name: "purchaseRequestType",
  initialState,
  reducers: {
    clearPurchaseRequestTypeError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseRequestTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseRequestTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(fetchPurchaseRequestTypes.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch purchase request types";
      })
      .addCase(loadPurchaseRequestTypeOptions.pending, (state) => {
        state.error = null;
      })
      .addCase(loadPurchaseRequestTypeOptions.fulfilled, (state, action) => {
        state.options = action.payload;
      })
      .addCase(loadPurchaseRequestTypeOptions.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to load purchase request types";
      })
      .addCase(addPurchaseRequestType.pending, (state) => {
        state.error = null;
      })
      .addCase(addPurchaseRequestType.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add purchase request type";
      })
      .addCase(updatePurchaseRequestType.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePurchaseRequestType.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update purchase request type";
      })
      .addCase(deletePurchaseRequestType.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePurchaseRequestType.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete purchase request type";
      });
  },
});

export const { clearPurchaseRequestTypeError } = purchaseRequestTypeSlice.actions;
export default purchaseRequestTypeSlice.reducer;