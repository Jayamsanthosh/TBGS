import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface StatusMasterGridData {
  id?: string | number;
  statusId?: number;
  statusCode?: string;
  statusName?: string;
  statusCategory?: string;
  description?: string;
  sortOrder?: number;
  remarks?: string;
  statusMaster?: string;
  createdBy?: string;
  createdDate?: string;
  createdMacAddress?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  modifiedMacAddress?: string;
}

export interface StatusMasterOption {
  statusId?: number;
  statusCode?: string;
  statusName?: string;
  statusCategory?: string;
  sortOrder?: number;
  displayText?: string;
}

export interface StatusMasterListParams {
  status?: string;
  category?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface StatusMasterState {
  items: StatusMasterGridData[];
  total: number;
  options: StatusMasterOption[];
  loading: boolean;
  error: string | null;
}

const initialState: StatusMasterState = {
  items: [],
  total: 0,
  options: [],
  loading: false,
  error: null,
};

export const fetchStatuses = createAsyncThunk(
  "statusMaster/fetchAll",
  async (params: StatusMasterListParams = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.category) query.set("category", params.category);
      if (params.search) query.set("search", params.search);
      if (params.page) query.set("page", String(params.page));
      if (params.pageSize) query.set("pageSize", String(params.pageSize));
      const qs = query.toString();

      const response = await fetch(`${API_URL}/status-master${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch statuses");
      }
      const json = await response.json();
      const rows = json.data || [];
      return {
        rows: rows.map((u: any) => ({ ...u, id: u.statusId || u.STATUS_ID })),
        total: json.total ?? rows.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch statuses");
    }
  }
);

export const fetchStatusById = createAsyncThunk(
  "statusMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/status-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch status");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch status");
    }
  }
);

export const loadStatusOptions = createAsyncThunk(
  "statusMaster/loadOptions",
  async (params: { category?: string; includeInactive?: boolean } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.category) query.set("category", params.category);
      query.set("includeInactive", params.includeInactive ? "true" : "false");
      const response = await fetch(
        `${API_URL}/status-master/load?${query.toString()}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to load statuses");
      }
      const json = await response.json();
      return (json.data || []).map((o: any) => ({ ...o, id: o.statusId }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load statuses");
    }
  }
);

export const addStatus = createAsyncThunk(
  "statusMaster/add",
  async (item: StatusMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/status-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add status");
    }
  }
);

export const updateStatus = createAsyncThunk(
  "statusMaster/update",
  async (item: StatusMasterGridData, { rejectWithValue }) => {
    try {
      const payload = {
        ...item,
        STATUS_ID: Number(item.id) || item.statusId,
      };
      const response = await fetch(`${API_URL}/status-master/${payload.STATUS_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update status");
    }
  }
);

export const deleteStatus = createAsyncThunk(
  "statusMaster/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/status-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete status");
    }
  }
);

const statusMasterSlice = createSlice({
  name: "statusMaster",
  initialState,
  reducers: {
    clearStatusMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStatuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(fetchStatuses.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch statuses";
      })
      .addCase(loadStatusOptions.pending, (state) => {
        state.error = null;
      })
      .addCase(loadStatusOptions.fulfilled, (state, action) => {
        state.options = action.payload;
      })
      .addCase(loadStatusOptions.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to load statuses";
      })
      .addCase(addStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(addStatus.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add status";
      })
      .addCase(updateStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(updateStatus.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update status";
      })
      .addCase(deleteStatus.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteStatus.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete status";
      });
  },
});

export const { clearStatusMasterError } = statusMasterSlice.actions;
export default statusMasterSlice.reducer;