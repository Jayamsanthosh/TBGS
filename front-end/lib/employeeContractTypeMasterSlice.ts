import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface EmployeeContractTypeGridData {
  id?: string | number;
  CONTRACT_TYPE_ID?: number;
  CONTRACT_TYPE_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface EmployeeContractTypeState {
  employeeContractTypes: EmployeeContractTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeContractTypeState = {
  employeeContractTypes: [],
  loading: false,
  error: null,
};

export const fetchEmployeeContractTypes = createAsyncThunk(
  "employeeContractType/fetchEmployeeContractTypes",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/employee-contract-type-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/employee-contract-type-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch contract types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.CONTRACT_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch contract types");
    }
  }
);

export const addEmployeeContractType = createAsyncThunk(
  "employeeContractType/addEmployeeContractType",
  async (item: EmployeeContractTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-contract-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add contract type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add contract type");
    }
  }
);

export const updateEmployeeContractType = createAsyncThunk(
  "employeeContractType/updateEmployeeContractType",
  async (item: EmployeeContractTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, CONTRACT_TYPE_ID: Number(item.id) || item.CONTRACT_TYPE_ID };
      const response = await fetch(`${API_URL}/employee-contract-type-master/${payload.CONTRACT_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update contract type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update contract type");
    }
  }
);

export const deleteEmployeeContractType = createAsyncThunk(
  "employeeContractType/deleteEmployeeContractType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/employee-contract-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete contract type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete contract type");
    }
  }
);

const employeeContractTypeSlice = createSlice({
  name: "employeeContractType",
  initialState,
  reducers: {
    clearEmployeeContractTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeContractTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeContractTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.employeeContractTypes = action.payload;
      })
      .addCase(fetchEmployeeContractTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch contract types";
      })
      .addCase(addEmployeeContractType.pending, (state) => { state.error = null; })
      .addCase(addEmployeeContractType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add contract type";
      })
      .addCase(updateEmployeeContractType.pending, (state) => { state.error = null; })
      .addCase(updateEmployeeContractType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update contract type";
      })
      .addCase(deleteEmployeeContractType.pending, (state) => { state.error = null; })
      .addCase(deleteEmployeeContractType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete contract type";
      });
  },
});

export const { clearEmployeeContractTypeError } = employeeContractTypeSlice.actions;
export default employeeContractTypeSlice.reducer;
