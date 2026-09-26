import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ReferenceTypeMasterGridData {
  id?: string | number;
  referenceTypeId?: number;
  referenceTypeCode?: string;
  referenceTypeName?: string;
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

export interface ReferenceTypeMasterOption {
  referenceTypeId?: number;
  referenceTypeCode?: string;
  referenceTypeName?: string;
  sortOrder?: number;
  displayText?: string;
}

export interface ReferenceTypeMasterListParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface ReferenceTypeMasterState {
  items: ReferenceTypeMasterGridData[];
  total: number;
  options: ReferenceTypeMasterOption[];
  loading: boolean;
  error: string | null;
}

const initialState: ReferenceTypeMasterState = {
  items: [],
  total: 0,
  options: [],
  loading: false,
  error: null,
};

export const fetchReferenceTypes = createAsyncThunk(
  "referenceTypeMaster/fetchAll",
  async (params: ReferenceTypeMasterListParams = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.search) query.set("search", params.search);
      if (params.page) query.set("page", String(params.page));
      if (params.pageSize) query.set("pageSize", String(params.pageSize));
      const qs = query.toString();

      const response = await fetch(`${API_URL}/reference-type-master${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch reference types");
      }
      const json = await response.json();
      const rows = json.data || [];
      return {
        rows: rows.map((u: any) => ({ ...u, id: u.referenceTypeId || u.REFERENCE_TYPE_ID })),
        total: json.total ?? rows.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch reference types");
    }
  }
);

export const fetchReferenceTypeById = createAsyncThunk(
  "referenceTypeMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/reference-type-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch reference type");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch reference type");
    }
  }
);

export const loadReferenceTypeOptions = createAsyncThunk(
  "referenceTypeMaster/loadOptions",
  async (params: { includeInactive?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/reference-type-master/load?includeInactive=${params.includeInactive ? "true" : "false"}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to load reference types");
      }
      const json = await response.json();
      return (json.data || []).map((o: any) => ({ ...o, id: o.referenceTypeId }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load reference types");
    }
  }
);

export const addReferenceType = createAsyncThunk(
  "referenceTypeMaster/add",
  async (item: ReferenceTypeMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/reference-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add reference type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add reference type");
    }
  }
);

export const updateReferenceType = createAsyncThunk(
  "referenceTypeMaster/update",
  async (item: ReferenceTypeMasterGridData, { rejectWithValue }) => {
    try {
      const payload = {
        ...item,
        REFERENCE_TYPE_ID: Number(item.id) || item.referenceTypeId,
      };
      const response = await fetch(`${API_URL}/reference-type-master/${payload.REFERENCE_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update reference type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update reference type");
    }
  }
);

export const deleteReferenceType = createAsyncThunk(
  "referenceTypeMaster/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/reference-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete reference type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete reference type");
    }
  }
);

const referenceTypeMasterSlice = createSlice({
  name: "referenceTypeMaster",
  initialState,
  reducers: {
    clearReferenceTypeMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReferenceTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchReferenceTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(fetchReferenceTypes.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch reference types";
      })
      .addCase(loadReferenceTypeOptions.pending, (state) => {
        state.error = null;
      })
      .addCase(loadReferenceTypeOptions.fulfilled, (state, action) => {
        state.options = action.payload;
      })
      .addCase(loadReferenceTypeOptions.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to load reference types";
      })
      .addCase(addReferenceType.pending, (state) => {
        state.error = null;
      })
      .addCase(addReferenceType.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add reference type";
      })
      .addCase(updateReferenceType.pending, (state) => {
        state.error = null;
      })
      .addCase(updateReferenceType.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update reference type";
      })
      .addCase(deleteReferenceType.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteReferenceType.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete reference type";
      });
  },
});

export const { clearReferenceTypeMasterError } = referenceTypeMasterSlice.actions;
export default referenceTypeMasterSlice.reducer;