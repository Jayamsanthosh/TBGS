import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CashAdvanceGridData {
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
  ADVANCE_AMOUNT?: number;
  REASON?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface CashAdvanceState {
  items: CashAdvanceGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CashAdvanceState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCashAdvances = createAsyncThunk(
  "cashAdvance/fetchCashAdvances",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/cash-advance?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch cash advances");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch cash advances");
    }
  }
);

export const addCashAdvance = createAsyncThunk(
  "cashAdvance/addCashAdvance",
  async (item: CashAdvanceGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/cash-advance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add cash advance");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add cash advance");
    }
  }
);

export const updateCashAdvance = createAsyncThunk(
  "cashAdvance/updateCashAdvance",
  async (item: CashAdvanceGridData, { rejectWithValue }) => {
    try {
      const body = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/cash-advance/${body.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update cash advance");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update cash advance");
    }
  }
);

export const deleteCashAdvance = createAsyncThunk(
  "cashAdvance/deleteCashAdvance",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/cash-advance/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete cash advance");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete cash advance");
    }
  }
);

const cashAdvanceSlice = createSlice({
  name: "cashAdvance",
  initialState,
  reducers: {
    clearCashAdvanceError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCashAdvances.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCashAdvances.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCashAdvances.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch cash advances";
      })
      .addCase(addCashAdvance.pending, (state) => { state.error = null; })
      .addCase(addCashAdvance.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add cash advance";
      })
      .addCase(updateCashAdvance.pending, (state) => { state.error = null; })
      .addCase(updateCashAdvance.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update cash advance";
      })
      .addCase(deleteCashAdvance.pending, (state) => { state.error = null; })
      .addCase(deleteCashAdvance.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete cash advance";
      });
  },
});

export const { clearCashAdvanceError } = cashAdvanceSlice.actions;
export default cashAdvanceSlice.reducer;