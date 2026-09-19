import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CashAdvanceRequestGridData {
  id?: string | number;
  SNO?: number;
  CASH_ADV_REQUEST_REF_NO?: string;
  SALARY_DEDUCTION_TYPE?: string;
  ADVANCE_TYPE?: string;
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

  GROSS_PAY?: number;
  NET_PAY?: number;
  ELIGIBLE_AMOUNT?: number;
  REQUEST_AMOUNT?: number;
  APPROVED_AMOUNT?: number;

  DEDUCTION_FROM_DATE?: string;
  DEDUCTION_TO_DATE?: string;
  NO_OF_MONTHS?: number;
  MONTHLY_DEDUCTION?: number;

  PAYMENT_MODE_ID?: number;
  BANK_ID?: number;
  ACCOUNT_NO?: string;

  REASON?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface CashAdvanceRequestState {
  items: CashAdvanceRequestGridData[];
  current: CashAdvanceRequestGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: CashAdvanceRequestState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchCashAdvanceRequests = createAsyncThunk(
  "cashAdvanceRequest/fetchCashAdvanceRequests",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/cash-advance-request?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch cash advance requests");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch cash advance requests");
    }
  }
);

export const getCashAdvanceRequestById = createAsyncThunk(
  "cashAdvanceRequest/getCashAdvanceRequestById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/cash-advance-request/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch cash advance request");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch cash advance request");
    }
  }
);

export const addCashAdvanceRequest = createAsyncThunk(
  "cashAdvanceRequest/addCashAdvanceRequest",
  async (item: CashAdvanceRequestGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/cash-advance-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add cash advance request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add cash advance request");
    }
  }
);

export const updateCashAdvanceRequest = createAsyncThunk(
  "cashAdvanceRequest/updateCashAdvanceRequest",
  async (item: CashAdvanceRequestGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const payload = {
        ...item,
        SNO: Number(item.id) || item.SNO,
        ROLE: authUser?.role || authUser?.ROLE || "Admin",
      };
      const response = await fetch(`${API_URL}/cash-advance-request/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update cash advance request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update cash advance request");
    }
  }
);

export const submitCashAdvanceRequest = createAsyncThunk(
  "cashAdvanceRequest/submitCashAdvanceRequest",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const ROLE = authUser?.role || authUser?.ROLE || "Administrator";
      const response = await fetch(
        `${API_URL}/cash-advance-request/${encodeURIComponent(String(id))}/submit?ROLE=${encodeURIComponent(ROLE)}`,
        { method: "POST" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit cash advance request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit cash advance request");
    }
  }
);

export const deleteCashAdvanceRequest = createAsyncThunk(
  "cashAdvanceRequest/deleteCashAdvanceRequest",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/cash-advance-request/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete cash advance request");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete cash advance request");
    }
  }
);

const cashAdvanceRequestSlice = createSlice({
  name: "cashAdvanceRequest",
  initialState,
  reducers: {
    clearCashAdvanceRequestError(state) {
      state.error = null;
    },
    clearCurrentCashAdvanceRequest(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCashAdvanceRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCashAdvanceRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCashAdvanceRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch cash advance requests";
      })
      .addCase(getCashAdvanceRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getCashAdvanceRequestById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getCashAdvanceRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch cash advance request";
      })
      .addCase(addCashAdvanceRequest.pending, (state) => { state.error = null; })
      .addCase(addCashAdvanceRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add cash advance request";
      })
      .addCase(updateCashAdvanceRequest.pending, (state) => { state.error = null; })
      .addCase(updateCashAdvanceRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update cash advance request";
      })
      .addCase(submitCashAdvanceRequest.pending, (state) => { state.error = null; })
      .addCase(submitCashAdvanceRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to submit cash advance request";
      })
      .addCase(deleteCashAdvanceRequest.pending, (state) => { state.error = null; })
      .addCase(deleteCashAdvanceRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete cash advance request";
      });
  },
});

export const { clearCashAdvanceRequestError, clearCurrentCashAdvanceRequest } = cashAdvanceRequestSlice.actions;
export default cashAdvanceRequestSlice.reducer;