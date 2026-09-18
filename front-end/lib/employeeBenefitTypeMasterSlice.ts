import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface EmployeeBenefitTypeGridData {
  id?: string | number;
  BENEFIT_TYPE_ID?: number;
  BENEFIT_TYPE_NAME?: string;
  BENEFIT_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface EmployeeBenefitTypeState {
  benefitTypes: EmployeeBenefitTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeBenefitTypeState = {
  benefitTypes: [],
  loading: false,
  error: null,
};

export const fetchEmployeeBenefitTypes = createAsyncThunk(
  "employeeBenefitTypes/fetchEmployeeBenefitTypes",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status && status !== "ALL"
        ? `${API_URL}/employee-benefit-type-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/employee-benefit-type-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch benefit types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BENEFIT_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch benefit types");
    }
  }
);

export const addEmployeeBenefitType = createAsyncThunk(
  "employeeBenefitTypes/addEmployeeBenefitType",
  async (item: EmployeeBenefitTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-benefit-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add benefit type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add benefit type");
    }
  }
);

export const updateEmployeeBenefitType = createAsyncThunk(
  "employeeBenefitTypes/updateEmployeeBenefitType",
  async (item: EmployeeBenefitTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BENEFIT_TYPE_ID: Number(item.id) || item.BENEFIT_TYPE_ID };
      const response = await fetch(`${API_URL}/employee-benefit-type-master/${payload.BENEFIT_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update benefit type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update benefit type");
    }
  }
);

export const deleteEmployeeBenefitType = createAsyncThunk(
  "employeeBenefitTypes/deleteEmployeeBenefitType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/employee-benefit-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete benefit type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete benefit type");
    }
  }
);

const employeeBenefitTypesSlice = createSlice({
  name: "employeeBenefitTypes",
  initialState,
  reducers: {
    clearEmployeeBenefitTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeBenefitTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeBenefitTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.benefitTypes = action.payload;
      })
      .addCase(fetchEmployeeBenefitTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch benefit types";
      })
      .addCase(addEmployeeBenefitType.pending, (state) => { state.error = null; })
      .addCase(addEmployeeBenefitType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add benefit type";
      })
      .addCase(updateEmployeeBenefitType.pending, (state) => { state.error = null; })
      .addCase(updateEmployeeBenefitType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update benefit type";
      })
      .addCase(deleteEmployeeBenefitType.pending, (state) => { state.error = null; })
      .addCase(deleteEmployeeBenefitType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete benefit type";
      });
  },
});

export const { clearEmployeeBenefitTypeError } = employeeBenefitTypesSlice.actions;
export default employeeBenefitTypesSlice.reducer;