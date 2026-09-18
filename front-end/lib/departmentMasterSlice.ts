import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface DepartmentGridData {
  id?: string | number;
  DEPARTMENT_ID?: number;
  DEPARTMENT_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface DepartmentState {
  departments: DepartmentGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentState = {
  departments: [],
  loading: false,
  error: null,
};

export const fetchDepartments = createAsyncThunk(
  "department/fetchDepartments",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/department-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch departments");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.DEPARTMENT_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch departments");
    }
  }
);

export const addDepartment = createAsyncThunk(
  "department/addDepartment",
  async (item: DepartmentGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/department-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add department");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add department");
    }
  }
);

export const updateDepartment = createAsyncThunk(
  "department/updateDepartment",
  async (item: DepartmentGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, DEPARTMENT_ID: Number(item.id) || item.DEPARTMENT_ID };
      const response = await fetch(`${API_URL}/department-master/${payload.DEPARTMENT_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update department");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update department");
    }
  }
);

export const deleteDepartment = createAsyncThunk(
  "department/deleteDepartment",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/department-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete department");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete department");
    }
  }
);

const departmentSlice = createSlice({
  name: "department",
  initialState,
  reducers: {
    clearDepartmentError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartments.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartments.fulfilled, (state, action) => {
        state.loading = false;
        state.departments = action.payload;
      })
      .addCase(fetchDepartments.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch departments";
      })
      .addCase(addDepartment.pending, (state) => { state.error = null; })
      .addCase(addDepartment.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add department";
      })
      .addCase(updateDepartment.pending, (state) => { state.error = null; })
      .addCase(updateDepartment.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update department";
      })
      .addCase(deleteDepartment.pending, (state) => { state.error = null; })
      .addCase(deleteDepartment.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete department";
      });
  },
});

export const { clearDepartmentError } = departmentSlice.actions;
export default departmentSlice.reducer;
