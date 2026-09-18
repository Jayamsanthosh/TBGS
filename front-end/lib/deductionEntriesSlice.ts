import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface DeductionEntriesGridData {
  id?: string | number;
  DED_REF_ID?: number;
  M_AUTO_REF_NO?: number;
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
  DEDUCTION_AMOUNT?: number;
  REMARKS?: string;
  STATUS_ENTRY?: string;
}

interface DeductionEntriesState {
  items: DeductionEntriesGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: DeductionEntriesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchDeductionEntries = createAsyncThunk(
  "deductionEntries/fetchDeductionEntries",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/deduction-entries?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch deduction entries");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.DED_REF_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch deduction entries");
    }
  }
);

export const addDeductionEntries = createAsyncThunk(
  "deductionEntries/addDeductionEntries",
  async (item: DeductionEntriesGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/deduction-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add deduction entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add deduction entry");
    }
  }
);

export const updateDeductionEntries = createAsyncThunk(
  "deductionEntries/updateDeductionEntries",
  async (item: DeductionEntriesGridData, { rejectWithValue }) => {
    try {
      const body = { ...item, DED_REF_ID: Number(item.id) || item.DED_REF_ID };
      const response = await fetch(`${API_URL}/deduction-entries/${body.DED_REF_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update deduction entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update deduction entry");
    }
  }
);

export const deleteDeductionEntries = createAsyncThunk(
  "deductionEntries/deleteDeductionEntries",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/deduction-entries/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete deduction entry");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete deduction entry");
    }
  }
);

const deductionEntriesSlice = createSlice({
  name: "deductionEntries",
  initialState,
  reducers: {
    clearDeductionEntriesError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDeductionEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDeductionEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchDeductionEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch deduction entries";
      })
      .addCase(addDeductionEntries.pending, (state) => {
        state.error = null;
      })
      .addCase(addDeductionEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add deduction entry";
      })
      .addCase(updateDeductionEntries.pending, (state) => {
        state.error = null;
      })
      .addCase(updateDeductionEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update deduction entry";
      })
      .addCase(deleteDeductionEntries.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteDeductionEntries.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete deduction entry";
      });
  },
});

export const { clearDeductionEntriesError } = deductionEntriesSlice.actions;
export default deductionEntriesSlice.reducer;