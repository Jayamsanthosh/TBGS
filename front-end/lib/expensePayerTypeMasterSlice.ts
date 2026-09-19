import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ExpensePayerTypeGridData {
  id?: string | number;
  PAID_BY_ID?: number;
  PAID_BY_NAME: string;
  PAID_BY_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ExpensePayerTypeState {
  expensePayerTypes: ExpensePayerTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ExpensePayerTypeState = {
  expensePayerTypes: [],
  loading: false,
  error: null,
};

export const fetchExpensePayerTypes = createAsyncThunk(
  "expensePayerTypes/fetchExpensePayerTypes",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/expense-payer-type-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch expense payer types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PAID_BY_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch expense payer types");
    }
  }
);

export const addExpensePayerType = createAsyncThunk(
  "expensePayerTypes/addExpensePayerType",
  async (item: ExpensePayerTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/expense-payer-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add expense payer type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add expense payer type");
    }
  }
);

export const updateExpensePayerType = createAsyncThunk(
  "expensePayerTypes/updateExpensePayerType",
  async (item: ExpensePayerTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PAID_BY_ID: Number(item.id) || item.PAID_BY_ID };
      const response = await fetch(`${API_URL}/expense-payer-type-master/${payload.PAID_BY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update expense payer type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update expense payer type");
    }
  }
);

export const deleteExpensePayerType = createAsyncThunk(
  "expensePayerTypes/deleteExpensePayerType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/expense-payer-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete expense payer type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete expense payer type");
    }
  }
);

const expensePayerTypeSlice = createSlice({
  name: "expensePayerTypes",
  initialState,
  reducers: {
    clearExpensePayerTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchExpensePayerTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchExpensePayerTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.expensePayerTypes = action.payload;
      })
      .addCase(fetchExpensePayerTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch expense payer types";
      })
      .addCase(addExpensePayerType.pending, (state) => { state.error = null; })
      .addCase(addExpensePayerType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add expense payer type";
      })
      .addCase(updateExpensePayerType.pending, (state) => { state.error = null; })
      .addCase(updateExpensePayerType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update expense payer type";
      })
      .addCase(deleteExpensePayerType.pending, (state) => { state.error = null; })
      .addCase(deleteExpensePayerType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete expense payer type";
      });
  },
});

export const { clearExpensePayerTypeError } = expensePayerTypeSlice.actions;
export default expensePayerTypeSlice.reducer;