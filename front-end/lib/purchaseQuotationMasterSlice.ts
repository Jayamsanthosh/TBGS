import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PurchaseQuotationDtl {
  key?: string;
  PURCHASE_QUOTATION_DTL_ID?: number;
  PURCHASE_QUOTATION_NO?: string;
  PURCHASE_REQUEST_NO?: string;
  PURCHASE_REQUEST_DTL_ID?: number;
  CAMP_ID?: number;
  REQUEST_STORE_ID?: number;
  REFERENCE_TYPE_ID?: number;
  REFERENCE_NO?: string;
  LINE_NO?: number;
  MAIN_CATEGORY_ID?: number;
  SUB_CATEGORY_ID?: number;
  PRODUCT_ID?: number;
  PRODUCT_NAME?: string;
  MAIN_CATEGORY_NAME?: string;
  SUB_CATEGORY_NAME?: string;
  NO_OF_PCS_PER_PACKING?: any;
  TOTAL_QUANTITY?: any;
  UOM_ID?: number;
  UOM_NAME?: string;
  TOTAL_PACKING?: any;
  ALT_UOM_ID?: number;
  ALT_UOM_NAME?: string;
  RATE?: any;
  SUB_TOTAL_AMOUNT_FC?: any;
  DISCOUNT_PERCENTAGE?: any;
  DISCOUNT_AMOUNT_FC?: any;
  TOTAL_PRODUCT_AMOUNT_FC?: any;
  TAX_ID?: number;
  TAX_NAME?: string;
  TAX_PERCENTAGE?: any;
  TAX_AMOUNT_FC?: any;
  FINAL_AMOUNT_FC?: any;
  EXCHANGE_RATE?: any;
  SUB_TOTAL_AMOUNT_LC?: any;
  DISCOUNT_AMOUNT_LC?: any;
  ADDITIONAL_COST_AMOUNT_LC?: any;
  TOTAL_PRODUCT_AMOUNT_LC?: any;
  TAX_AMOUNT_LC?: any;
  FINAL_AMOUNT_LC?: any;
  REQUIRED_DATE?: string;
  REASON?: string;
  REMARKS?: string;
  STATUS_ENTRY?: string;
  SOURCE_LINE_NO?: number;
}

export interface PurchaseQuotationGridData {
  id?: string | number;
  sno?: number;
  purchaseQuotationNo?: string;
  PURCHASE_QUOTATION_NO?: string;
  refNo?: string;
  purchaseQuotationDate?: string;
  companyId?: number;
  companyName?: string;
  supplierBpId?: number;
  supplierName?: string;
  branchId?: number;
  branchName?: string;
  poStoreId?: number;
  poStoreName?: string;
  supplierQuotationNo?: string;
  supplierQuotationDate?: string;
  validFromDate?: string;
  validToDate?: string;
  paymentTermId?: number;
  paymentModeId?: number;
  shipmentModeId?: number;
  shipmentModeName?: string;
  deliveryDate?: string;
  deliveryTerm?: string;
  shipmentRemarks?: string;
  deliveryLocationId?: number;
  totalSubTotalHdrAmountFc?: any;
  totalDiscountHdrAmountFc?: any;
  totalAdditionalCostAmountFc?: any;
  totalProductHdrAmountFc?: any;
  totalVatHdrAmountFc?: any;
  finalProductHdrAmountFc?: any;
  currencyId?: number;
  exchangeRate?: any;
  totalSubTotalHdrAmountLc?: any;
  totalDiscountHdrAmountLc?: any;
  totalAdditionalCostAmountLc?: any;
  totalProductHdrAmountLc?: any;
  totalTaxHdrAmountLc?: any;
  finalProductHdrAmountLc?: any;
  sectionHeadResponsePersonEmpId?: number;
  sectionHeadResponseDate?: string;
  sectionHeadResponseStatus?: string;
  sectionHeadResponseRemarks?: string;
  sectionHeadResponseIpAddress?: string;
  response1EmpId?: number;
  response1Date?: string;
  response1Status?: string;
  response1Remarks?: string;
  response1IpAddress?: string;
  response2EmpId?: number;
  response2Date?: string;
  response2Status?: string;
  response2Remarks?: string;
  response2IpAddress?: string;
  finalResponseEmpId?: number;
  finalResponseDate?: string;
  finalResponseStatus?: string;
  finalResponseRemarks?: string;
  finalResponseIpAddress?: string;
  quotationStatusId?: number;
  quotationStatusName?: string;
  remarks?: string;
  statusEntry?: string;
  createdBy?: string;
  createdDate?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: PurchaseQuotationDtl[];
  deletedIds?: number[];
}

export interface PurchaseQuotationOption {
  id?: string | number;
  purchaseQuotationNo?: string;
  purchaseQuotationDate?: string;
  companyId?: number;
  companyName?: string;
  supplierBpId?: number;
  supplierName?: string;
  approvalStatus?: string;
  statusEntry?: string;
  displayText?: string;
}

export interface PurchaseQuotationListParams {
  status?: string;
  search?: string;
  fromDate?: string;
  toDate?: string;
  companyId?: number;
  supplierBpId?: number;
  page?: number;
  pageSize?: number;
}

interface PurchaseQuotationMasterState {
  items: PurchaseQuotationGridData[];
  total: number;
  options: PurchaseQuotationOption[];
  loading: boolean;
  error: string | null;
}

const initialState: PurchaseQuotationMasterState = {
  items: [],
  total: 0,
  options: [],
  loading: false,
  error: null,
};

const identity = (getState: any) => {
  const state: any = getState();
  const authUser = state.auth?.user;
  return {
    USER: authUser?.loginName || authUser?.LOGIN_NAME || "Admin",
    ROLE: authUser?.role || authUser?.ROLE || "Admin",
    MAC_ADDRESS: "WEB",
  };
};

export const fetchPurchaseQuotations = createAsyncThunk(
  "purchaseQuotationMaster/fetchAll",
  async (params: PurchaseQuotationListParams = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.search) query.set("search", params.search);
      if (params.fromDate) query.set("fromDate", params.fromDate);
      if (params.toDate) query.set("toDate", params.toDate);
      if (params.companyId) query.set("companyId", String(params.companyId));
      if (params.supplierBpId) query.set("supplierBpId", String(params.supplierBpId));
      if (params.page) query.set("page", String(params.page));
      if (params.pageSize) query.set("pageSize", String(params.pageSize));
      const qs = query.toString();

      const response = await fetch(`${API_URL}/purchase-quotation${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase quotations");
      }
      const json = await response.json();
      const rows = json.data || [];
      return {
        rows: rows.map((u: any) => ({
          ...u,
          id: u.sno ?? u.purchaseQuotationNo ?? u.PURCHASE_QUOTATION_NO,
        })),
        total: json.total ?? rows.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase quotations");
    }
  }
);

export const fetchPurchaseQuotationHdr = createAsyncThunk(
  "purchaseQuotationMaster/fetchHdr",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-quotation/hdr/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase quotation header");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase quotation header");
    }
  }
);

export const fetchPurchaseQuotationDtls = createAsyncThunk(
  "purchaseQuotationMaster/fetchDtls",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-quotation/dtls/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase quotation details");
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase quotation details");
    }
  }
);

export const fetchPurchaseQuotationDtl = createAsyncThunk(
  "purchaseQuotationMaster/fetchDtl",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-quotation/dtl/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch purchase quotation detail");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch purchase quotation detail");
    }
  }
);

export const loadPurchaseQuotationOptions = createAsyncThunk(
  "purchaseQuotationMaster/loadOptions",
  async (
    params: { companyId?: number; supplierBpId?: number; statusEntry?: string; approvalStatus?: string } = {},
    { rejectWithValue }
  ) => {
    try {
      const query = new URLSearchParams();
      if (params.companyId) query.set("companyId", String(params.companyId));
      if (params.supplierBpId) query.set("supplierBpId", String(params.supplierBpId));
      if (params.statusEntry) query.set("statusEntry", params.statusEntry);
      if (params.approvalStatus) query.set("approvalStatus", params.approvalStatus);
      const qs = query.toString();
      const response = await fetch(`${API_URL}/purchase-quotation/load${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to load purchase quotations");
      }
      const json = await response.json();
      return (json.data || []).map((o: any) => ({ ...o, id: o.purchaseQuotationNo }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load purchase quotations");
    }
  }
);

export const addPurchaseQuotation = createAsyncThunk(
  "purchaseQuotationMaster/add",
  async (item: PurchaseQuotationGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-quotation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add purchase quotation");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add purchase quotation");
    }
  }
);

export const updatePurchaseQuotation = createAsyncThunk(
  "purchaseQuotationMaster/update",
  async (item: PurchaseQuotationGridData, { rejectWithValue }) => {
    try {
      const refNo = item.purchaseQuotationNo || item.PURCHASE_QUOTATION_NO || "";
      const response = await fetch(`${API_URL}/purchase-quotation/${encodeURIComponent(refNo)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update purchase quotation");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update purchase quotation");
    }
  }
);

export const deletePurchaseQuotationDtl = createAsyncThunk(
  "purchaseQuotationMaster/deleteDtl",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const { USER, ROLE, MAC_ADDRESS } = identity(getState);
      const response = await fetch(`${API_URL}/purchase-quotation/dtl/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER, ROLE, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete purchase quotation detail");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase quotation detail");
    }
  }
);

export const deletePurchaseQuotationHdr = createAsyncThunk(
  "purchaseQuotationMaster/deleteHdr",
  async (refNo: string | number, { rejectWithValue, getState }) => {
    try {
      const { USER, ROLE, MAC_ADDRESS } = identity(getState);
      const response = await fetch(
        `${API_URL}/purchase-quotation/hdr/${encodeURIComponent(String(refNo))}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ USER, ROLE, MAC_ADDRESS }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete purchase quotation");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete purchase quotation");
    }
  }
);

/* Advances a saved quotation to PENDING FOR APPROVAL. Uses the dedicated
   /submit endpoint rather than the record PUT, because the update SP is a full
   overwrite and would clear the supplier, amounts and approval history. */
export const submitPurchaseQuotation = createAsyncThunk(
  "purchaseQuotationMaster/submit",
  async (arg: { refNo: string | number; quotationStatusId: number }, { rejectWithValue, getState }) => {
    try {
      const { USER, MAC_ADDRESS } = identity(getState);
      const response = await fetch(
        `${API_URL}/purchase-quotation/${encodeURIComponent(String(arg.refNo))}/submit`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quotationStatusId: arg.quotationStatusId, USER, MAC_ADDRESS }),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit purchase quotation");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit purchase quotation");
    }
  }
);

const purchaseQuotationMasterSlice = createSlice({
  name: "purchaseQuotationMaster",
  initialState,
  reducers: {
    clearPurchaseQuotationMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPurchaseQuotations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPurchaseQuotations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(fetchPurchaseQuotations.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch purchase quotations";
      })
      .addCase(loadPurchaseQuotationOptions.pending, (state) => {
        state.error = null;
      })
      .addCase(loadPurchaseQuotationOptions.fulfilled, (state, action) => {
        state.options = action.payload;
      })
      .addCase(loadPurchaseQuotationOptions.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to load purchase quotations";
      })
      .addCase(addPurchaseQuotation.pending, (state) => {
        state.error = null;
      })
      .addCase(addPurchaseQuotation.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add purchase quotation";
      })
      .addCase(updatePurchaseQuotation.pending, (state) => {
        state.error = null;
      })
      .addCase(updatePurchaseQuotation.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update purchase quotation";
      })
      .addCase(deletePurchaseQuotationDtl.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePurchaseQuotationDtl.rejected, (state, action) => {
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to delete purchase quotation detail";
      })
      .addCase(deletePurchaseQuotationHdr.pending, (state) => {
        state.error = null;
      })
      .addCase(deletePurchaseQuotationHdr.rejected, (state, action) => {
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to delete purchase quotation";
      });
  },
});

export const { clearPurchaseQuotationMasterError } = purchaseQuotationMasterSlice.actions;
export default purchaseQuotationMasterSlice.reducer;
