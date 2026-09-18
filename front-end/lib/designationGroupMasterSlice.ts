import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface DesignationGroupGridData {
  id?: string | number;
  DESIGNATION_GROUP_ID?: number;
  DESIGNATION_GROUP_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface DesignationGroupState {
  items: DesignationGroupGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: DesignationGroupState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchItems = createAsyncThunk(
  "designationGroupMaster/fetchItems",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/designation-group-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/designation-group-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch designation groups");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.DESIGNATION_GROUP_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch designation groups");
    }
  }
);

export const addItem = createAsyncThunk(
  "designationGroupMaster/addItem",
  async (item: DesignationGroupGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/designation-group-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add designation group");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add designation group");
    }
  }
);

export const updateItem = createAsyncThunk(
  "designationGroupMaster/updateItem",
  async (item: DesignationGroupGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, DESIGNATION_GROUP_ID: Number(item.id) || item.DESIGNATION_GROUP_ID };
      const response = await fetch(`${API_URL}/designation-group-master/${payload.DESIGNATION_GROUP_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update designation group");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update designation group");
    }
  }
);

export const deleteItem = createAsyncThunk(
  "designationGroupMaster/deleteItem",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/designation-group-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete designation group");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete designation group");
    }
  }
);

const designationGroupMasterSlice = createSlice({
  name: "designationGroupMaster",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch designation groups";
      })
      .addCase(addItem.pending, (state) => { state.error = null; })
      .addCase(addItem.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add designation group";
      })
      .addCase(updateItem.pending, (state) => { state.error = null; })
      .addCase(updateItem.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update designation group";
      })
      .addCase(deleteItem.pending, (state) => { state.error = null; })
      .addCase(deleteItem.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete designation group";
      });
  },
});

export const { clearError } = designationGroupMasterSlice.actions;
export default designationGroupMasterSlice.reducer;
