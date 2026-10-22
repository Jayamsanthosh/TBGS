import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ApprovalStageDtlData {
  APPROVAL_STAGE_DTL_ID?: number;
  APPROVAL_STAGE_ID?: number;
  USER_ID?: number;
  USER_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

export interface ApprovalStageHdrGridData {
  id?: string | number;
  APPROVAL_STAGE_ID?: number;
  APPROVAL_STAGE_NAME?: string;
  APPROVAL_STAGE_ORDER?: number;
  NO_OF_APPROVALS_REQUIRED?: number;
  NO_OF_REJECT_REQUIRED?: number;
  REMARKS?: string;
  LINK_PAGES_ID?: number | null;
  STATUS_MASTER?: string;
  LINK_NAME?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: ApprovalStageDtlData[];
  deletedIds?: number[];
}

interface ApprovalStageState {
  items: ApprovalStageHdrGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ApprovalStageState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchApprovalStageHdr = createAsyncThunk(
  "approvalStage/fetchApprovalStageHdr",
  async (params: { status?: string; search?: string } | undefined, { rejectWithValue }) => {
    try {
      const q = new URLSearchParams();
      if (params?.status) q.set("status", params.status);
      if (params?.search) q.set("search", params.search);
      const qs = q.toString();
      const response = await fetch(`${API_URL}/approval-stage${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch approval stages");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.APPROVAL_STAGE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch approval stages");
    }
  }
);

export const fetchApprovalStageHdrById = createAsyncThunk(
  "approvalStage/fetchApprovalStageHdrById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/approval-stage/hdr/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch approval stage");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch approval stage");
    }
  }
);

export const fetchApprovalStageDtls = createAsyncThunk(
  "approvalStage/fetchApprovalStageDtls",
  async (stageId: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/approval-stage/hdr/${stageId}/dtls`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch stage users");
      }
      const json = await response.json();
      return json.data as ApprovalStageDtlData[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch stage users");
    }
  }
);

export const addApprovalStageHdr = createAsyncThunk(
  "approvalStage/addApprovalStageHdr",
  async (item: ApprovalStageHdrGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/approval-stage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add approval stage");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add approval stage");
    }
  }
);

export const updateApprovalStageHdr = createAsyncThunk(
  "approvalStage/updateApprovalStageHdr",
  async (item: ApprovalStageHdrGridData, { rejectWithValue }) => {
    try {
      const id = Number(item.APPROVAL_STAGE_ID) || Number(item.id);
      const response = await fetch(`${API_URL}/approval-stage/hdr/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update approval stage");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update approval stage");
    }
  }
);

export const deleteApprovalStageHdr = createAsyncThunk(
  "approvalStage/deleteApprovalStageHdr",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/approval-stage/hdr/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete approval stage");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete approval stage");
    }
  }
);

const approvalStageSlice = createSlice({
  name: "approvalStage",
  initialState,
  reducers: {
    clearApprovalStageError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchApprovalStageHdr.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchApprovalStageHdr.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchApprovalStageHdr.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch approval stages";
      })
      .addCase(addApprovalStageHdr.pending, (state) => { state.error = null; })
      .addCase(addApprovalStageHdr.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add approval stage";
      })
      .addCase(updateApprovalStageHdr.pending, (state) => { state.error = null; })
      .addCase(updateApprovalStageHdr.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update approval stage";
      })
      .addCase(deleteApprovalStageHdr.pending, (state) => { state.error = null; })
      .addCase(deleteApprovalStageHdr.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete approval stage";
      });
  },
});

export const { clearApprovalStageError } = approvalStageSlice.actions;
export default approvalStageSlice.reducer;
