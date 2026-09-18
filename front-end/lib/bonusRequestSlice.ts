import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BonusRequestGridData {
  id?: string | number;
  SNO?: number;
  BONUS_REQUEST_REF_NO?: string;
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

  BONUS_TYPE?: string;
  REQUEST_AMOUNT?: number;
  APPROVED_AMOUNT?: number;
  PAYMENT_REF_NO?: string;
  PAYMENT_MODE_ID?: number;
  BANK_ID?: number;
  ACCOUNT_NO?: string;
  PAID_STATUS?: string;
  REASON?: string;

  REMARKS?: string;
  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface BonusRequestState {
  items: BonusRequestGridData[];
  current: BonusRequestGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: BonusRequestState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchBonusRequests = createAsyncThunk(
  "bonusRequest/fetchBonusRequests",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bonus-request?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch bonus requests");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch bonus requests");
    }
  }
);

export const getBonusRequestById = createAsyncThunk(
  "bonusRequest/getBonusRequestById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bonus-request/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch bonus request");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch bonus request");
    }
  }
);

export const addBonusRequest = createAsyncThunk(
  "bonusRequest/addBonusRequest",
  async (item: BonusRequestGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/bonus-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add bonus request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add bonus request");
    }
  }
);

export const updateBonusRequest = createAsyncThunk(
  "bonusRequest/updateBonusRequest",
  async (item: BonusRequestGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/bonus-request/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update bonus request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update bonus request");
    }
  }
);

export const deleteBonusRequest = createAsyncThunk(
  "bonusRequest/deleteBonusRequest",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/bonus-request/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete bonus request");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete bonus request");
    }
  }
);

const bonusRequestSlice = createSlice({
  name: "bonusRequest",
  initialState,
  reducers: {
    clearBonusRequestError(state) {
      state.error = null;
    },
    clearCurrentBonusRequest(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBonusRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBonusRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBonusRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch bonus requests";
      })
      .addCase(getBonusRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getBonusRequestById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getBonusRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch bonus request";
      })
      .addCase(addBonusRequest.pending, (state) => { state.error = null; })
      .addCase(addBonusRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add bonus request";
      })
      .addCase(updateBonusRequest.pending, (state) => { state.error = null; })
      .addCase(updateBonusRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update bonus request";
      })
      .addCase(deleteBonusRequest.pending, (state) => { state.error = null; })
      .addCase(deleteBonusRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete bonus request";
      });
  },
});

export const { clearBonusRequestError, clearCurrentBonusRequest } = bonusRequestSlice.actions;
export default bonusRequestSlice.reducer;
