import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface RoleGridData {
  id?: string | number;
  ROLE_ID?: number;
  ROLE_NAME: string;
  ROLE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface RolesState {
  roles: RoleGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: RolesState = {
  roles: [],
  loading: false,
  error: null,
};

export const fetchRoles = createAsyncThunk(
  "roles/fetchRoles",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/roles`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch roles");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.ROLE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch roles");
    }
  }
);

export const addRole = createAsyncThunk(
  "roles/addRole",
  async (item: RoleGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/roles`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add role");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add role");
    }
  }
);

export const updateRole = createAsyncThunk(
  "roles/updateRole",
  async (item: RoleGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, ROLE_ID: Number(item.id) || item.ROLE_ID };
      const response = await fetch(`${API_URL}/roles/${payload.ROLE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update role");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update role");
    }
  }
);

export const deleteRole = createAsyncThunk(
  "roles/deleteRole",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(`${API_URL}/roles/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER, ROLE }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete role");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete role");
    }
  }
);

const rolesSlice = createSlice({
  name: "roles",
  initialState,
  reducers: {
    clearRolesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.loading = false;
        state.roles = action.payload;
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch roles";
      })
      .addCase(addRole.pending, (state) => { state.error = null; })
      .addCase(addRole.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add role";
      })
      .addCase(updateRole.pending, (state) => { state.error = null; })
      .addCase(updateRole.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update role";
      })
      .addCase(deleteRole.pending, (state) => { state.error = null; })
      .addCase(deleteRole.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete role";
      });
  },
});

export const { clearRolesError } = rolesSlice.actions;
export default rolesSlice.reducer;
