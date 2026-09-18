import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface EmploymentTypeGridData {
  id?: string | number;
  EMPLOYMENT_TYPE_ID?: number;
  EMPLOYMENT_TYPE_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface EmploymentTypeState {
  employmentTypes: EmploymentTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: EmploymentTypeState = {
  employmentTypes: [],
  loading: false,
  error: null,
};

export const fetchEmploymentTypes = createAsyncThunk(
  "employmentType/fetchEmploymentTypes",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employment-type-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch employment types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.EMPLOYMENT_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch employment types");
    }
  }
);

export const addEmploymentType = createAsyncThunk(
  "employmentType/addEmploymentType",
  async (item: EmploymentTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employment-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add employment type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add employment type");
    }
  }
);

export const updateEmploymentType = createAsyncThunk(
  "employmentType/updateEmploymentType",
  async (item: EmploymentTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, EMPLOYMENT_TYPE_ID: Number(item.id) || item.EMPLOYMENT_TYPE_ID };
      const response = await fetch(`${API_URL}/employment-type-master/${payload.EMPLOYMENT_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update employment type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update employment type");
    }
  }
);

export const deleteEmploymentType = createAsyncThunk(
  "employmentType/deleteEmploymentType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/employment-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete employment type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete employment type");
    }
  }
);

const employmentTypeSlice = createSlice({
  name: "employmentType",
  initialState,
  reducers: {
    clearEmploymentTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmploymentTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmploymentTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.employmentTypes = action.payload;
      })
      .addCase(fetchEmploymentTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch employment types";
      })
      .addCase(addEmploymentType.pending, (state) => { state.error = null; })
      .addCase(addEmploymentType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add employment type";
      })
      .addCase(updateEmploymentType.pending, (state) => { state.error = null; })
      .addCase(updateEmploymentType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update employment type";
      })
      .addCase(deleteEmploymentType.pending, (state) => { state.error = null; })
      .addCase(deleteEmploymentType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete employment type";
      });
  },
});

export const { clearEmploymentTypeError } = employmentTypeSlice.actions;
export default employmentTypeSlice.reducer;
