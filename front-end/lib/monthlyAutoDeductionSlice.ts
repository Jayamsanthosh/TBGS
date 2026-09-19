import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface MonthlyAutoDeductionGridData {
  id?: string | number;
  M_AUTO_REF_NO?: number;
  SALARY_DEDUCTION_TYPE?: string;
  REQUEST_REF_NO?: string;
  DEDUCTION_TYPE_ID?: number;
  REQUEST_TYPE?: string;
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
  TOTAL_DEDUCTION_AMOUNT?: number;
  DEDUCTION_FROM_DATE?: string;
  DEDUCTION_TO_DATE?: string;
  NO_OF_MONTHS?: number;
  MONTHLY_DEDUCTION?: number;
  REASON?: string;
  APPROVED_BY?: string;
  REMARKS?: string;
  STATUS_ENTRY?: string;
}

interface MonthlyAutoDeductionState {
  items: MonthlyAutoDeductionGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: MonthlyAutoDeductionState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchMonthlyAutoDeductions = createAsyncThunk(
  "monthlyAutoDeduction/fetchMonthlyAutoDeductions",
  async (args: { status?: string; fromDate?: string; toDate?: string } = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      query.set("status", args.status || "ALL");
      if (args.fromDate) query.set("fromDate", args.fromDate);
      if (args.toDate) query.set("toDate", args.toDate);
      const response = await fetch(`${API_URL}/monthly-auto-deduction?${query.toString()}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch monthly auto deductions");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.M_AUTO_REF_NO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch monthly auto deductions");
    }
  }
);

export const addMonthlyAutoDeduction = createAsyncThunk(
  "monthlyAutoDeduction/addMonthlyAutoDeduction",
  async (item: MonthlyAutoDeductionGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/monthly-auto-deduction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add monthly auto deduction");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add monthly auto deduction");
    }
  }
);

export const updateMonthlyAutoDeduction = createAsyncThunk(
  "monthlyAutoDeduction/updateMonthlyAutoDeduction",
  async (item: MonthlyAutoDeductionGridData, { rejectWithValue }) => {
    try {
      const body = { ...item, M_AUTO_REF_NO: Number(item.id) || item.M_AUTO_REF_NO };
      const response = await fetch(`${API_URL}/monthly-auto-deduction/${body.M_AUTO_REF_NO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update monthly auto deduction");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update monthly auto deduction");
    }
  }
);

export const submitMonthlyAutoDeduction = createAsyncThunk(
  "monthlyAutoDeduction/submitMonthlyAutoDeduction",
  async (item: MonthlyAutoDeductionGridData, { rejectWithValue, getState }) => {
    try {
      const refNo = item.M_AUTO_REF_NO;
      const state: any = getState();
      const authUser = state.auth?.user;
      const Role = authUser?.role || authUser?.ROLE || "Administrator";
      const response = await fetch(`${API_URL}/monthly-auto-deduction/${encodeURIComponent(String(refNo))}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ Role }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to submit monthly auto deduction");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to submit monthly auto deduction");
    }
  }
);

export const deleteMonthlyAutoDeduction = createAsyncThunk(
  "monthlyAutoDeduction/deleteMonthlyAutoDeduction",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/monthly-auto-deduction/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete monthly auto deduction");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete monthly auto deduction");
    }
  }
);

const monthlyAutoDeductionSlice = createSlice({
  name: "monthlyAutoDeduction",
  initialState,
  reducers: {
    clearMonthlyAutoDeductionError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlyAutoDeductions.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMonthlyAutoDeductions.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchMonthlyAutoDeductions.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch monthly auto deductions";
      })
      .addCase(addMonthlyAutoDeduction.pending, (state) => {
        state.error = null;
      })
      .addCase(addMonthlyAutoDeduction.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add monthly auto deduction";
      })
      .addCase(updateMonthlyAutoDeduction.pending, (state) => {
        state.error = null;
      })
      .addCase(updateMonthlyAutoDeduction.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update monthly auto deduction";
      })
      .addCase(submitMonthlyAutoDeduction.pending, (state) => {
        state.error = null;
      })
      .addCase(submitMonthlyAutoDeduction.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to submit monthly auto deduction";
      })
      .addCase(deleteMonthlyAutoDeduction.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteMonthlyAutoDeduction.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete monthly auto deduction";
      });
  },
});

export const { clearMonthlyAutoDeductionError } = monthlyAutoDeductionSlice.actions;
export default monthlyAutoDeductionSlice.reducer;