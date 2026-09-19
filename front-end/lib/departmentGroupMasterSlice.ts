import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface DepartmentGroupGridData {
  id?: string | number;
  DEPARTMENT_GROUP_ID?: number;
  DEPARTMENT_GROUP_NAME: string;
  MANAGER_EMP_ID?: number;
  TO_MAIL_ADDRESS?: string;
  CC_MAIL_ADDRESS?: string;
  BCC_MAIL_ADDRESS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface DepartmentGroupState {
  departmentGroups: DepartmentGroupGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: DepartmentGroupState = {
  departmentGroups: [],
  loading: false,
  error: null,
};

export const fetchDepartmentGroups = createAsyncThunk(
  "departmentGroup/fetchDepartmentGroups",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/department-group-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch department groups");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.DEPARTMENT_GROUP_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch department groups");
    }
  }
);

export const addDepartmentGroup = createAsyncThunk(
  "departmentGroup/addDepartmentGroup",
  async (item: DepartmentGroupGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/department-group-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add department group");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add department group");
    }
  }
);

export const updateDepartmentGroup = createAsyncThunk(
  "departmentGroup/updateDepartmentGroup",
  async (item: DepartmentGroupGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, DEPARTMENT_GROUP_ID: Number(item.id) || item.DEPARTMENT_GROUP_ID };
      const response = await fetch(`${API_URL}/department-group-master/${payload.DEPARTMENT_GROUP_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update department group");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update department group");
    }
  }
);

export const deleteDepartmentGroup = createAsyncThunk(
  "departmentGroup/deleteDepartmentGroup",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/department-group-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete department group");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete department group");
    }
  }
);

const departmentGroupSlice = createSlice({
  name: "departmentGroup",
  initialState,
  reducers: {
    clearDepartmentGroupError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDepartmentGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDepartmentGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.departmentGroups = action.payload;
      })
      .addCase(fetchDepartmentGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch department groups";
      })
      .addCase(addDepartmentGroup.pending, (state) => { state.error = null; })
      .addCase(addDepartmentGroup.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add department group";
      })
      .addCase(updateDepartmentGroup.pending, (state) => { state.error = null; })
      .addCase(updateDepartmentGroup.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update department group";
      })
      .addCase(deleteDepartmentGroup.pending, (state) => { state.error = null; })
      .addCase(deleteDepartmentGroup.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete department group";
      });
  },
});

export const { clearDepartmentGroupError } = departmentGroupSlice.actions;
export default departmentGroupSlice.reducer;
