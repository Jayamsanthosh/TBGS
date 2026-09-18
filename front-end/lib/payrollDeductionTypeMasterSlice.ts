import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PayrollDeductionTypeGridData {
  id?: string | number;
  DEDUCTION_TYPE_ID?: number;
  SALARY_DEDUCTION_TYPE?: string;
  DEDUCTION_TYPE_NAME?: string;
  DEDUCTION_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface PayrollDeductionTypeState {
  deductionTypes: PayrollDeductionTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: PayrollDeductionTypeState = {
  deductionTypes: [],
  loading: false,
  error: null,
};

export const fetchPayrollDeductionTypes = createAsyncThunk(
  "payrollDeductionTypes/fetchPayrollDeductionTypes",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status && status !== "ALL"
        ? `${API_URL}/payroll-deduction-type-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/payroll-deduction-type-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch deduction types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.DEDUCTION_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch deduction types");
    }
  }
);

export const addPayrollDeductionType = createAsyncThunk(
  "payrollDeductionTypes/addPayrollDeductionType",
  async (item: PayrollDeductionTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/payroll-deduction-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add deduction type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add deduction type");
    }
  }
);

export const updatePayrollDeductionType = createAsyncThunk(
  "payrollDeductionTypes/updatePayrollDeductionType",
  async (item: PayrollDeductionTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, DEDUCTION_TYPE_ID: Number(item.id) || item.DEDUCTION_TYPE_ID };
      const response = await fetch(`${API_URL}/payroll-deduction-type-master/${payload.DEDUCTION_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update deduction type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update deduction type");
    }
  }
);

export const deletePayrollDeductionType = createAsyncThunk(
  "payrollDeductionTypes/deletePayrollDeductionType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/payroll-deduction-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete deduction type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete deduction type");
    }
  }
);

const payrollDeductionTypesSlice = createSlice({
  name: "payrollDeductionTypes",
  initialState,
  reducers: {
    clearPayrollDeductionTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPayrollDeductionTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPayrollDeductionTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.deductionTypes = action.payload;
      })
      .addCase(fetchPayrollDeductionTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch deduction types";
      })
      .addCase(addPayrollDeductionType.pending, (state) => { state.error = null; })
      .addCase(addPayrollDeductionType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add deduction type";
      })
      .addCase(updatePayrollDeductionType.pending, (state) => { state.error = null; })
      .addCase(updatePayrollDeductionType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update deduction type";
      })
      .addCase(deletePayrollDeductionType.pending, (state) => { state.error = null; })
      .addCase(deletePayrollDeductionType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete deduction type";
      });
  },
});

export const { clearPayrollDeductionTypeError } = payrollDeductionTypesSlice.actions;
export default payrollDeductionTypesSlice.reducer;