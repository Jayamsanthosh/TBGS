import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ArrearsRequestGridData {
  id?: string | number;
  SNO?: number;
  ARREAR_REQUEST_REF_NO?: string;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: number;

  EMP_ID?: number;
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;

  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DEPARTMENT_GROUP_ID?: number;
  DESIGNATION_GROUP_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  EMPLOYMENT_TYPE_ID?: number;
  CURRENCY_ID?: number;

  REQUEST_AMOUNT?: number;
  APPROVED_AMOUNT?: number;

  REASON?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface ArrearsRequestState {
  items: ArrearsRequestGridData[];
  current: ArrearsRequestGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ArrearsRequestState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchArrearsRequests = createAsyncThunk(
  "arrearsRequest/fetchArrearsRequests",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/arrears-request?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch arrear requests");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch arrear requests");
    }
  }
);

export const getArrearsRequestById = createAsyncThunk(
  "arrearsRequest/getArrearsRequestById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/arrears-request/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch arrear request");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch arrear request");
    }
  }
);

export const addArrearsRequest = createAsyncThunk(
  "arrearsRequest/addArrearsRequest",
  async (item: ArrearsRequestGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/arrears-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add arrear request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add arrear request");
    }
  }
);

export const updateArrearsRequest = createAsyncThunk(
  "arrearsRequest/updateArrearsRequest",
  async (item: ArrearsRequestGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/arrears-request/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update arrear request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update arrear request");
    }
  }
);

export const deleteArrearsRequest = createAsyncThunk(
  "arrearsRequest/deleteArrearsRequest",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/arrears-request/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete arrear request");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete arrear request");
    }
  }
);

const arrearsRequestSlice = createSlice({
  name: "arrearsRequest",
  initialState,
  reducers: {
    clearArrearsRequestError(state) {
      state.error = null;
    },
    clearCurrentArrearsRequest(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchArrearsRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchArrearsRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchArrearsRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch arrear requests";
      })
      .addCase(getArrearsRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getArrearsRequestById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getArrearsRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch arrear request";
      })
      .addCase(addArrearsRequest.pending, (state) => { state.error = null; })
      .addCase(addArrearsRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add arrear request";
      })
      .addCase(updateArrearsRequest.pending, (state) => { state.error = null; })
      .addCase(updateArrearsRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update arrear request";
      })
      .addCase(deleteArrearsRequest.pending, (state) => { state.error = null; })
      .addCase(deleteArrearsRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete arrear request";
      });
  },
});

export const { clearArrearsRequestError, clearCurrentArrearsRequest } = arrearsRequestSlice.actions;
export default arrearsRequestSlice.reducer;