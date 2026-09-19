import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface UserGridData {
  id?: string | number;
  LOGIN_ID?: number;
  EMP_ID?: number;
  LOGIN_NAME: string;
  PASSWORD?: string;
  ROLE?: string;
  MOBILE_NO?: string;
  MAIL_ID?: string;
  STOCK_SHOW_STATUS?: 'YES' | 'NO';
  OUTSIDE_ACCESS_Y_N?: 'YES' | 'NO';
  STATUS_MASTER?: string;
  REMARKS?: string;
}

interface UsersState {
  users: UserGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  users: [],
  loading: false,
  error: null,
};

export const fetchUsers = createAsyncThunk(
  "users/fetchUsers",
  async (_, { rejectWithValue, getState }) => {
    try {
      const response = await fetch(`${API_URL}/users`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch users");
      }
      const json = await response.json();
      let allUsers = (json.data || []).map((u: any) => ({
        ...u,
        id: u.LOGIN_ID,
        EMP_ID: u.EMP_ID ?? u.Emp_Id ?? null,
      }));
      
      // Hide current logged-in user
      const state: any = getState();
      const currentUserId = state.auth?.user?.id || state.auth?.user?.LOGIN_ID;
      
      if (currentUserId) {
        allUsers = allUsers.filter((u: any) => String(u.id) !== String(currentUserId));
      }
      
      return allUsers;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch users");
    }
  }
);

export const addUser = createAsyncThunk(
  "users/addUser",
  async (item: UserGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add user");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add user");
    }
  }
);

export const updateUser = createAsyncThunk(
  "users/updateUser",
  async (item: UserGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, LOGIN_ID: Number(item.id) || item.LOGIN_ID };
      const response = await fetch(`${API_URL}/users/${payload.LOGIN_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update user");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update user");
    }
  }
);

export const deleteUser = createAsyncThunk(
  "users/deleteUser",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(`${API_URL}/users/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER, ROLE }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete user");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete user");
    }
  }
);

const usersSlice = createSlice({
  name: "users",
  initialState,
  reducers: {
    clearUsersError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.loading = false;
        state.users = action.payload;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch users";
      })
      .addCase(addUser.pending, (state) => { state.error = null; })
      .addCase(addUser.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add user";
      })
      .addCase(updateUser.pending, (state) => { state.error = null; })
      .addCase(updateUser.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update user";
      })
      .addCase(deleteUser.pending, (state) => { state.error = null; })
      .addCase(deleteUser.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete user";
      });
  },
});

export const { clearUsersError } = usersSlice.actions;
export default usersSlice.reducer;
