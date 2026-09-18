import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface UserStoreMappingGridData {
  id?: string | number;
  USER_TO_STORE_ID?: number;
  LOGIN_ID?: number;
  COMPANY_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  ROLE_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface UserStoreMappingState {
  mappings: UserStoreMappingGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: UserStoreMappingState = {
  mappings: [],
  loading: false,
  error: null,
};

export const fetchUserStoreMappings = createAsyncThunk(
  "userStoreMapping/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/user-store-mapping`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch mappings");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.USER_TO_STORE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch mappings");
    }
  }
);

export const addUserStoreMapping = createAsyncThunk(
  "userStoreMapping/add",
  async (item: UserStoreMappingGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/user-store-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add mapping");
    }
  }
);

export const updateUserStoreMapping = createAsyncThunk(
  "userStoreMapping/update",
  async (item: UserStoreMappingGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, USER_TO_STORE_ID: Number(item.id) || item.USER_TO_STORE_ID };
      const response = await fetch(`${API_URL}/user-store-mapping/${payload.USER_TO_STORE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update mapping");
    }
  }
);

export const deleteUserStoreMapping = createAsyncThunk(
  "userStoreMapping/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/user-store-mapping/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete mapping");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete mapping");
    }
  }
);

const userStoreMappingSlice = createSlice({
  name: "userStoreMapping",
  initialState,
  reducers: {
    clearUserStoreMappingError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserStoreMappings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserStoreMappings.fulfilled, (state, action) => {
        state.loading = false;
        state.mappings = action.payload;
      })
      .addCase(fetchUserStoreMappings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch mappings";
      })
      .addCase(addUserStoreMapping.pending, (state) => { state.error = null; })
      .addCase(addUserStoreMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add mapping";
      })
      .addCase(updateUserStoreMapping.pending, (state) => { state.error = null; })
      .addCase(updateUserStoreMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update mapping";
      })
      .addCase(deleteUserStoreMapping.pending, (state) => { state.error = null; })
      .addCase(deleteUserStoreMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete mapping";
      });
  },
});

export const { clearUserStoreMappingError } = userStoreMappingSlice.actions;
export default userStoreMappingSlice.reducer;
