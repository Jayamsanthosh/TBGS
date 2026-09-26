import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AdditionalChargeTypeGridData {
  id?: string | number;
  additionalChargeTypeId?: number;
  additionalChargeTypeCode?: string;
  additionalChargeTypeName?: string;
  description?: string;
  sortOrder?: number | null;
  remarks?: string;
  statusMaster?: string;
  createdBy?: string;
  createdDate?: string;
  createdMacAddress?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  modifiedMacAddress?: string;
}

export interface AdditionalChargeTypeOption {
  additionalChargeTypeId?: number;
  additionalChargeTypeCode?: string;
  additionalChargeTypeName?: string;
  sortOrder?: number | null;
  displayText?: string;
}

export interface AdditionalChargeTypeListParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface AdditionalChargeTypeState {
  items: AdditionalChargeTypeGridData[];
  total: number;
  options: AdditionalChargeTypeOption[];
  loading: boolean;
  error: string | null;
}

const initialState: AdditionalChargeTypeState = {
  items: [],
  total: 0,
  options: [],
  loading: false,
  error: null,
};

export const fetchAdditionalChargeTypes = createAsyncThunk(
  "additionalChargeType/fetchAll",
  async (params: AdditionalChargeTypeListParams = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.search) query.set("search", params.search);
      if (params.page) query.set("page", String(params.page));
      if (params.pageSize) query.set("pageSize", String(params.pageSize));
      const qs = query.toString();

      const response = await fetch(
        `${API_URL}/additional-charge-type-master${qs ? `?${qs}` : ""}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch additional charge types");
      }
      const json = await response.json();
      const rows = json.data || [];
      return {
        rows: rows.map((u: any) => ({ ...u, id: u.additionalChargeTypeId || u.ADDITIONAL_CHARGE_TYPE_ID })),
        total: json.total ?? rows.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch additional charge types");
    }
  }
);

export const fetchAdditionalChargeTypeById = createAsyncThunk(
  "additionalChargeType/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/additional-charge-type-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch additional charge type");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch additional charge type");
    }
  }
);

export const loadAdditionalChargeTypeOptions = createAsyncThunk(
  "additionalChargeType/loadOptions",
  async (includeInactive: boolean = false, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/additional-charge-type-master/load?includeInactive=${includeInactive}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to load additional charge types");
      }
      const json = await response.json();
      return (json.data || []).map((o: any) => ({ ...o, id: o.additionalChargeTypeId }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load additional charge types");
    }
  }
);

export const addAdditionalChargeType = createAsyncThunk(
  "additionalChargeType/add",
  async (item: AdditionalChargeTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/additional-charge-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add additional charge type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add additional charge type");
    }
  }
);

export const updateAdditionalChargeType = createAsyncThunk(
  "additionalChargeType/update",
  async (item: AdditionalChargeTypeGridData, { rejectWithValue }) => {
    try {
      const payload = {
        ...item,
        ADDITIONAL_CHARGE_TYPE_ID: Number(item.id) || item.additionalChargeTypeId,
      };
      const response = await fetch(
        `${API_URL}/additional-charge-type-master/${payload.ADDITIONAL_CHARGE_TYPE_ID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update additional charge type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update additional charge type");
    }
  }
);

export const deleteAdditionalChargeType = createAsyncThunk(
  "additionalChargeType/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/additional-charge-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete additional charge type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete additional charge type");
    }
  }
);

const additionalChargeTypeSlice = createSlice({
  name: "additionalChargeType",
  initialState,
  reducers: {
    clearAdditionalChargeTypeError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdditionalChargeTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAdditionalChargeTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(fetchAdditionalChargeTypes.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch additional charge types";
      })
      .addCase(loadAdditionalChargeTypeOptions.pending, (state) => {
        state.error = null;
      })
      .addCase(loadAdditionalChargeTypeOptions.fulfilled, (state, action) => {
        state.options = action.payload;
      })
      .addCase(loadAdditionalChargeTypeOptions.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to load additional charge types";
      })
      .addCase(addAdditionalChargeType.pending, (state) => {
        state.error = null;
      })
      .addCase(addAdditionalChargeType.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add additional charge type";
      })
      .addCase(updateAdditionalChargeType.pending, (state) => {
        state.error = null;
      })
      .addCase(updateAdditionalChargeType.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update additional charge type";
      })
      .addCase(deleteAdditionalChargeType.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteAdditionalChargeType.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete additional charge type";
      });
  },
});

export const { clearAdditionalChargeTypeError } = additionalChargeTypeSlice.actions;
export default additionalChargeTypeSlice.reducer;
