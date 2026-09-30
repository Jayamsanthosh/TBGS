import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ConversationGridData {
  id?: number;
  SNO?: number;
  PURCHASE_QUOTATION_NO?: string;
  RESPONSE_EMP_ID?: number | null;
  RESPONSE_EMP_NAME?: string | null;
  DISCUSSION_DETAILS?: string | null;
  RESPONSE_STATUS?: string | null;
  STATUS_ENTRY?: string | null;
  REMARKS?: string | null;
  CREATED_DATE?: string | null;
  CREATED_BY?: string | null;
  CREATED_MAC_ADDRESS?: string | null;
  MODIFIED_BY?: string | null;
  MODIFIED_DATE?: string | null;
  MODIFIED_MAC_ADDRESS?: string | null;
}

interface ConversationState {
  items: ConversationGridData[];
  statuses: string[];
  current: ConversationGridData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: ConversationState = {
  items: [],
  statuses: [],
  current: null,
  loading: false,
  saving: false,
  error: null,
};

const errorText = async (response: Response, fallback: string) => {
  const data = await response.json().catch(() => ({}));
  return data?.message || fallback;
};

export const fetchConversations = createAsyncThunk(
  "purchaseQuotationConversation/fetchAll",
  async (params: { refNo: string; statusEntry?: string }, { rejectWithValue }) => {
    try {
      const q = new URLSearchParams();
      if (params.statusEntry) q.set("statusEntry", params.statusEntry);
      const qs = q.toString();
      const response = await fetch(
        `${API_URL}/purchase-quotation/conversation/${encodeURIComponent(params.refNo)}${qs ? `?${qs}` : ""}`
      );
      if (!response.ok) return rejectWithValue(await errorText(response, "Failed to fetch the conversation"));
      const json = await response.json();
      return (json.data || []) as ConversationGridData[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch the conversation");
    }
  }
);

export const fetchConversation = createAsyncThunk(
  "purchaseQuotationConversation/fetchOne",
  async (sno: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-quotation/conversation-row/${sno}`);
      if (!response.ok) return rejectWithValue(await errorText(response, "Failed to fetch the conversation"));
      const json = await response.json();
      return (json.data || null) as ConversationGridData | null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch the conversation");
    }
  }
);

export const fetchResponseStatuses = createAsyncThunk(
  "purchaseQuotationConversation/fetchStatuses",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-quotation/conversation/statuses`);
      if (!response.ok) return rejectWithValue(await errorText(response, "Failed to fetch response statuses"));
      const json = await response.json();
      return (json.data || []) as string[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch response statuses");
    }
  }
);

export const addConversation = createAsyncThunk(
  "purchaseQuotationConversation/add",
  async (item: ConversationGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-quotation/conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) return rejectWithValue(await errorText(response, "Failed to save the conversation"));
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to save the conversation");
    }
  }
);

export const updateConversation = createAsyncThunk(
  "purchaseQuotationConversation/update",
  async (item: ConversationGridData, { rejectWithValue }) => {
    try {
      const sno = Number(item.SNO ?? item.id);
      const response = await fetch(`${API_URL}/purchase-quotation/conversation/${sno}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) return rejectWithValue(await errorText(response, "Failed to update the conversation"));
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update the conversation");
    }
  }
);

/* No user/role is sent: the server reads the session. */
export const deleteConversation = createAsyncThunk(
  "purchaseQuotationConversation/delete",
  async (sno: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-quotation/conversation/${sno}`, { method: "DELETE" });
      if (!response.ok) return rejectWithValue(await errorText(response, "Failed to delete the conversation"));
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete the conversation");
    }
  }
);

const conversationSlice = createSlice({
  name: "purchaseQuotationConversation",
  initialState,
  reducers: {
    clearConversationError(state) {
      state.error = null;
    },
    resetConversation(state) {
      state.items = [];
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch the conversation";
      })
      .addCase(fetchConversation.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(fetchResponseStatuses.fulfilled, (state, action) => {
        state.statuses = action.payload;
      })
      .addCase(addConversation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addConversation.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(addConversation.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || action.error.message || "Failed to save the conversation";
      })
      .addCase(updateConversation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateConversation.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateConversation.rejected, (state, action) => {
        state.saving = false;
        state.error = (action.payload as string) || action.error.message || "Failed to update the conversation";
      })
      .addCase(deleteConversation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete the conversation";
      });
  },
});

export const { clearConversationError, resetConversation } = conversationSlice.actions;
export default conversationSlice.reducer;
