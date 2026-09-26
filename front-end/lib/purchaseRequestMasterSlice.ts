import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PurchaseRequestDtl {
  key?: string;
  PURCHASE_REQUEST_DTL_ID?: number;
  REFERENCE_TYPE_ID?: number;
  REFERENCE_NO?: string;
  LINE_NO?: number;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  DESCRIPTION?: string;
  NO_OF_PCS_PER_PACKING?: any;
  Total_Quantity?: any;
  UOM_ID?: number;
  Total_Packing?: any;
  ALT_UOM_ID?: number;
  TRUCK_ID?: number;
  REQUIRED_DATE?: string;
  REASON?: string;
  STATUS_ENTRY?: string;
}

export interface PurchaseRequestGridData {
  id?: string | number;
  sno?: number;
  purchaseRequestNo?: string;
  PURCHASE_REQUEST_NO?: string;
  poRefNo?: string;
  requestRefNo?: string;
  refNo?: string;
  purchaseRequestDate?: string;
  poDate?: string;
  requestedByEmpId?: number;
  requestedBy?: string;
  companyId?: number;
  companyName?: string;
  branchId?: number;
  branchName?: string;
  poStoreId?: number;
  poStoreName?: string;
  campId?: number;
  campName?: string;
  requestStoreId?: number;
  requestStoreName?: string;
  requestTypeId?: number;
  requestTypeName?: string;
  priorityId?: number;
  priorityName?: string;
  requiredDate?: string;
  reason?: string;
  sectionHeadStatus?: string;
  response1Status?: string;
  response2Status?: string;
  finalResponseStatus?: string;
  statusId?: number;
  statusName?: string;
  remarks?: string;
  statusEntry?: string;
  createdBy?: string;
  createdDate?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: PurchaseRequestDtl[];
  deletedIds?: number[];
}

export interface PurchaseRequestOption {
  id?: string | number;
  purchaseRequestNo?: string;
  purchaseRequestDate?: string;
  companyId?: number;
  companyName?: string;
  approvalStatus?: string;
  statusEntry?: string;
  displayText?: string;
}

export interface PurchaseRequestListParams {
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  companyId?: number;
  storeId?: number;
  campId?: number;
  branchId?: number;
  page?: number;
  pageSize?: number;
}

interface PurchaseRequestMasterState {
  items: PurchaseRequestGridData[];
  total: number;
  options: PurchaseRequestOption[];
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseRequestMasterState = {
  items: [],
  total: 0,
  options: [],
  loading: false,
  error: null,
};

export const fetchPurchaseRequests = createAsyncThunk(
  "purchaseRequestMaster/fetchAll",
  async (params: PurchaseRequestListParams = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.search) query.set("search", params.search);
      if (params.fromDate) query.set("fromDate", params.fromDate);
      if (params.toDate) query.set("toDate", params.toDate);
      if (params.companyId) query.set("companyId", String(params.companyId));
      if (params.storeId) query.set("storeId", String(params.storeId));
      if (params.campId) query.set("campId", String(params.campId));
      if (params.branchId) query.set("branchId", String(params.branchId));
      if (params.page) query.set("page", String(params.page));
      if (params.pageSize) query.set("pageSize", String(params.pageSize));
      const qs = query.toString();

      const response = await fetch(`${API_URL}/purchase-request${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase requests");
      }
      const json = await response.json();
      const rows = json.data || [];
      return {
        rows: rows.map((u: any) => ({
          ...u,
          id: u.sno ?? u.purchaseRequestNo ?? u.PURCHASE_REQUEST_NO,
        })),
        total: json.total ?? rows.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase requests");
    }
  }
);

export const fetchPurchaseRequestHdr = createAsyncThunk(
  "purchaseRequestMaster/fetchHdr",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-request/hdr/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase request header");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase request header");
    }
  }
);

export const fetchPurchaseRequestDtls = createAsyncThunk(
  "purchaseRequestMaster/fetchDtls",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-request/dtls/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase request details");
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase request details");
    }
  }
);

export const fetchPurchaseRequestDtl = createAsyncThunk(
  "purchaseRequestMaster/fetchDtl",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-request/dtl/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase request detail");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase request detail");
    }
  }
);

export const loadPurchaseRequestOptions = createAsyncThunk(
  "purchaseRequestMaster/loadOptions",
  async (
    params: { companyId?: number; statusEntry?: string; approvalStatus?: string; includeInactive?: boolean } = {},
    { rejectWithValue }
  ) => {
    try {
      const query = new URLSearchParams();
      if (params.companyId) query.set("companyId", String(params.companyId));
      if (params.statusEntry) query.set("statusEntry", params.statusEntry);
      if (params.approvalStatus) query.set("approvalStatus", params.approvalStatus);
      query.set("includeInactive", params.includeInactive ? "true" : "false");
      const response = await fetch(`${API_URL}/purchase-request/load?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to load purchase requests");
      }
      const json = await response.json();
      return (json.data || []).map((o: any) => ({ ...o, id: o.purchaseRequestNo }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load purchase requests");
    }
  }
);

export const addPurchaseRequest = createAsyncThunk(
  "purchaseRequestMaster/add",
  async (item: PurchaseRequestGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add purchase request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add purchase request");
    }
  }
);

export const updatePurchaseRequest = createAsyncThunk(
  "purchaseRequestMaster/update",
  async (item: PurchaseRequestGridData, { rejectWithValue }) => {
    try {
      const refNo = item.purchaseRequestNo || item.PURCHASE_REQUEST_NO || "";
      const response = await fetch(`${API_URL}/purchase-request/${encodeURIComponent(refNo)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update purchase request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update purchase request");
    }
  }
);

export const deletePurchaseRequestDtl = createAsyncThunk(
  "purchaseRequestMaster/deleteDtl",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";
      const response = await fetch(`${API_URL}/purchase-request/dtl/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER, ROLE, MAC_ADDRESS: "WEB" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete purchase request detail");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase request detail");
    }
  }
);

export const deletePurchaseRequestHdr = createAsyncThunk(
  "purchaseRequestMaster/deleteHdr",
  async (refNo: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";
      const response = await fetch(
        `${API_URL}/purchase-request/hdr/${encodeURIComponent(String(refNo))}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ USER, ROLE, MAC_ADDRESS: "WEB" }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete purchase request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase request");
    }
  }
);

const purchaseRequestMasterSlice = createSlice({
  name: "purchaseRequestMaster",
  initialState,
  reducers: {
    clearPurchaseRequestMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(fetchPurchaseRequests.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch purchase requests";
      })
      .addCase(loadPurchaseRequestOptions.pending, (state) => {
        state.error = null;
      })
      .addCase(loadPurchaseRequestOptions.fulfilled, (state, action) => {
        state.options = action.payload;
      })
      .addCase(loadPurchaseRequestOptions.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to load purchase requests";
      })
      .addCase(addPurchaseRequest.pending, (state) => {
        state.error = null;
      })
      .addCase(addPurchaseRequest.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add purchase request";
      })
      .addCase(updatePurchaseRequest.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePurchaseRequest.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update purchase request";
      })
      .addCase(deletePurchaseRequestDtl.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePurchaseRequestDtl.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete purchase request detail";
      })
      .addCase(deletePurchaseRequestHdr.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePurchaseRequestHdr.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete purchase request";
      });
  },
});

export const { clearPurchaseRequestMasterError } = purchaseRequestMasterSlice.actions;
export default purchaseRequestMasterSlice.reducer;