import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ApprovalTemplateRequesterDtlData {
  APPROVAL_TEMPLATE_REQ_DTL_ID?: number;
  APPROVAL_TEMPLATE_ID?: number;
  USER_ID?: number;
  USER_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

export interface ApprovalTemplateStageDtlData {
  APPROVAL_TEMPLATE_STAGE_DTL_ID?: number;
  APPROVAL_TEMPLATE_ID?: number;
  APPROVAL_STAGE_ID?: number;
  APPROVAL_STAGE_NAME?: string;
  STAGE_ORDER?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

export interface ApprovalTemplateHdrGridData {
  id?: string | number;
  APPROVAL_TEMPLATE_ID?: number;
  APPROVAL_TEMPLATE_NAME?: string;
  PAGE_LINK_ID?: number | null;
  LINK_PAGES_ID?: number | null;
  COMPANY_ID?: number | null;
  CAMP_ID?: number | null;
  STORE_ID?: number | null;
  AMOUNT_VALIDATION_STATUS?: string;
  MIN_AMOUNT?: number | string | null;
  MAX_AMOUNT?: number | string | null;
  EFFECTIVE_FROM?: string | null;
  EFFECTIVE_TO?: string | null;
  REMARKS?: string;
  STATUS_MASTER?: string;
  LINK_NAME?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  requesterDtls?: ApprovalTemplateRequesterDtlData[];
  stageDtls?: ApprovalTemplateStageDtlData[];
  deletedRequesterIds?: number[];
  deletedStageIds?: number[];
}

interface ApprovalTemplateState {
  items: ApprovalTemplateHdrGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ApprovalTemplateState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchApprovalTemplateHdr = createAsyncThunk(
  "approvalTemplate/fetchApprovalTemplateHdr",
  async (
    params: { status?: string; search?: string; pageLinkId?: number; companyId?: number; campId?: number; storeId?: number } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.search) q.set("search", params.search);
      if (params?.pageLinkId != null) q.set("pageLinkId", String(params.pageLinkId));
      if (params?.companyId != null) q.set("companyId", String(params.companyId));
      if (params?.campId != null) q.set("campId", String(params.campId));
      if (params?.storeId != null) q.set("storeId", String(params.storeId));
      const qs = q.toString();
      const response = await fetch(`${API_URL}/approval-template${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch approval templates");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.APPROVAL_TEMPLATE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch approval templates");
    }
  }
);

export const fetchApprovalTemplateHdrById = createAsyncThunk(
  "approvalTemplate/fetchApprovalTemplateHdrById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/approval-template/hdr/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch approval template");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch approval template");
    }
  }
);

export const fetchApprovalTemplateRequesterDtls = createAsyncThunk(
  "approvalTemplate/fetchApprovalTemplateRequesterDtls",
  async (templateId: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/approval-template/hdr/${templateId}/requester-dtls`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch template requesters");
      }
      const json = await response.json();
      return json.data as ApprovalTemplateRequesterDtlData[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch template requesters");
    }
  }
);

export const fetchApprovalTemplateStageDtls = createAsyncThunk(
  "approvalTemplate/fetchApprovalTemplateStageDtls",
  async (templateId: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/approval-template/hdr/${templateId}/stage-dtls`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch template stages");
      }
      const json = await response.json();
      return json.data as ApprovalTemplateStageDtlData[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch template stages");
    }
  }
);

export const addApprovalTemplateHdr = createAsyncThunk(
  "approvalTemplate/addApprovalTemplateHdr",
  async (item: ApprovalTemplateHdrGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/approval-template`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add approval template");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add approval template");
    }
  }
);

export const updateApprovalTemplateHdr = createAsyncThunk(
  "approvalTemplate/updateApprovalTemplateHdr",
  async (item: ApprovalTemplateHdrGridData, { rejectWithValue }) => {
    try {
      const id = Number(item.APPROVAL_TEMPLATE_ID) || Number(item.id);
      const response = await fetch(`${API_URL}/approval-template/hdr/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update approval template");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update approval template");
    }
  }
);

export const deleteApprovalTemplateHdr = createAsyncThunk(
  "approvalTemplate/deleteApprovalTemplateHdr",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/approval-template/hdr/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete approval template");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete approval template");
    }
  }
);

const approvalTemplateSlice = createSlice({
  name: "approvalTemplate",
  initialState,
  reducers: {
    clearApprovalTemplateError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApprovalTemplateHdr.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovalTemplateHdr.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchApprovalTemplateHdr.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch approval templates";
      })
      .addCase(addApprovalTemplateHdr.pending, (state) => { state.error = null; })
      .addCase(addApprovalTemplateHdr.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add approval template";
      })
      .addCase(updateApprovalTemplateHdr.pending, (state) => { state.error = null; })
      .addCase(updateApprovalTemplateHdr.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update approval template";
      })
      .addCase(deleteApprovalTemplateHdr.pending, (state) => { state.error = null; })
      .addCase(deleteApprovalTemplateHdr.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete approval template";
      });
  },
});

export const { clearApprovalTemplateError } = approvalTemplateSlice.actions;
export default approvalTemplateSlice.reducer;
