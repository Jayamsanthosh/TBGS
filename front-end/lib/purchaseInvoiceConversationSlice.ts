import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface InvoiceConversationData {
  id?: number;
  CONVERSATION_ID?: number;
  PAGE_REF_NO?: string | null;
  LINK_PAGES_ID?: number | null;
  RESPONSE_EMP_ID?: number | null;
  RESPONSE_EMP_NAME?: string | null;
  DISCUSSION_DETAILS?: string | null;
  RESPONSE_STATUS?: string | null;
  STATUS_ENTRY?: string | null;
  REMARKS?: string | null;
  RESPONSE_DATE?: string | null;
  CREATED_DATE?: string | null;
  CREATED_BY?: string | null;
  MODIFIED_BY?: string | null;
  MODIFIED_DATE?: string | null;
}

interface InvoiceConversationState {
  items: InvoiceConversationData[];
  statuses: string[];
  current: InvoiceConversationData | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
}

const initialState: InvoiceConversationState = {
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

export const fetchInvoiceConversations = createAsyncThunk(
  "purchaseInvoiceConversation/fetchAll",
  async (
    params: { refNo: string; statusEntry?: string; linkPagesId?: number },
    { rejectWithValue }
  ) => {
    try {
      const q = new URLSearchParams();
      if (params.statusEntry) q.set("statusEntry", params.statusEntry);
      if (params.linkPagesId) q.set("linkPagesId", String(params.linkPagesId));
      const qs = q.toString();
      const response = await fetch(
        `${API_URL}/purchase-invoice/conversation/${encodeURIComponent(params.refNo)}${qs ? `?${qs}` : ""}`
      );
      if (!response.ok) {
        return rejectWithValue(await errorText(response, "Failed to fetch the conversation"));
      }
      const json = await response.json();
      return (json.data || []) as InvoiceConversationData[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch the conversation");
    }
  }
);

export const fetchInvoiceConversation = createAsyncThunk(
  "purchaseInvoiceConversation/fetchOne",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-invoice/conversation-row/${id}`);
      if (!response.ok) {
        return rejectWithValue(await errorText(response, "Failed to fetch the conversation"));
      }
      const json = await response.json();
      return (json.data || null) as InvoiceConversationData | null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch the conversation");
    }
  }
);

export const fetchInvoiceResponseStatuses = createAsyncThunk(
  "purchaseInvoiceConversation/fetchStatuses",
  async (linkPagesId: number | undefined, { rejectWithValue }) => {
    try {
      const qs = linkPagesId ? `?linkPagesId=${linkPagesId}` : "";
      const response = await fetch(`${API_URL}/purchase-invoice/conversation/statuses${qs}`);
      if (!response.ok) {
        return rejectWithValue(await errorText(response, "Failed to fetch response statuses"));
      }
      const json = await response.json();
      return (json.data || []) as string[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch response statuses");
    }
  }
);

export const addInvoiceConversation = createAsyncThunk(
  "purchaseInvoiceConversation/add",
  async (item: InvoiceConversationData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-invoice/conversation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        return rejectWithValue(await errorText(response, "Failed to save the conversation"));
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to save the conversation");
    }
  }
);

export const updateInvoiceConversation = createAsyncThunk(
  "purchaseInvoiceConversation/update",
  async (item: InvoiceConversationData, { rejectWithValue }) => {
    try {
      const id = Number(item.CONVERSATION_ID ?? item.id);
      const response = await fetch(`${API_URL}/purchase-invoice/conversation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        return rejectWithValue(await errorText(response, "Failed to update the conversation"));
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update the conversation");
    }
  }
);

/* No user or role is sent: the server reads the session. */
export const deleteInvoiceConversation = createAsyncThunk(
  "purchaseInvoiceConversation/delete",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/purchase-invoice/conversation/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        return rejectWithValue(await errorText(response, "Failed to delete the conversation"));
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete the conversation");
    }
  }
);

const conversationSlice = createSlice({
  name: "purchaseInvoiceConversation",
  initialState,
  reducers: {
    clearInvoiceConversationError(state) {
      state.error = null;
    },
    resetInvoiceConversation(state) {
      state.items = [];
      state.current = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInvoiceConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
        /* The thread being replaced belongs to another invoice, so it is
           cleared here rather than left on screen until the new rows land. */
        state.items = [];
      })
      .addCase(fetchInvoiceConversations.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchInvoiceConversations.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch the conversation";
      })
      .addCase(fetchInvoiceConversation.fulfilled, (state, action) => {
        state.current = action.payload;
      })
      .addCase(fetchInvoiceResponseStatuses.fulfilled, (state, action) => {
        state.statuses = action.payload;
      })
      .addCase(addInvoiceConversation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(addInvoiceConversation.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(addInvoiceConversation.rejected, (state, action) => {
        state.saving = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to save the conversation";
      })
      .addCase(updateInvoiceConversation.pending, (state) => {
        state.saving = true;
        state.error = null;
      })
      .addCase(updateInvoiceConversation.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(updateInvoiceConversation.rejected, (state, action) => {
        state.saving = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to update the conversation";
      })
      .addCase(deleteInvoiceConversation.pending, (state) => {
        state.saving = true;
      })
      .addCase(deleteInvoiceConversation.fulfilled, (state) => {
        state.saving = false;
      })
      .addCase(deleteInvoiceConversation.rejected, (state, action) => {
        state.saving = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete the conversation";
      });
  },
});

export const { clearInvoiceConversationError, resetInvoiceConversation } =
  conversationSlice.actions;
export default conversationSlice.reducer;
