import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface DesignationGridData {
  id?: string | number;
  DESIGNATION_ID?: number;
  DESIGNATION_NAME: string;
  designation_group_id?: number;
  DESIGNATION_GROUP_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface DesignationState {
  designations: DesignationGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: DesignationState = {
  designations: [],
  loading: false,
  error: null,
};

export const fetchDesignations = createAsyncThunk(
  "designation/fetchDesignations",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/designation-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch designations");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.DESIGNATION_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch designations");
    }
  }
);

export const addDesignation = createAsyncThunk(
  "designation/addDesignation",
  async (item: DesignationGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/designation-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add designation");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add designation");
    }
  }
);

export const updateDesignation = createAsyncThunk(
  "designation/updateDesignation",
  async (item: DesignationGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, DESIGNATION_ID: Number(item.id) || item.DESIGNATION_ID };
      const response = await fetch(`${API_URL}/designation-master/${payload.DESIGNATION_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update designation");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update designation");
    }
  }
);

export const deleteDesignation = createAsyncThunk(
  "designation/deleteDesignation",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/designation-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete designation");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete designation");
    }
  }
);

const designationSlice = createSlice({
  name: "designation",
  initialState,
  reducers: {
    clearDesignationError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDesignations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDesignations.fulfilled, (state, action) => {
        state.loading = false;
        state.designations = action.payload;
      })
      .addCase(fetchDesignations.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch designations";
      })
      .addCase(addDesignation.pending, (state) => { state.error = null; })
      .addCase(addDesignation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add designation";
      })
      .addCase(updateDesignation.pending, (state) => { state.error = null; })
      .addCase(updateDesignation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update designation";
      })
      .addCase(deleteDesignation.pending, (state) => { state.error = null; })
      .addCase(deleteDesignation.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete designation";
      });
  },
});

export const { clearDesignationError } = designationSlice.actions;
export default designationSlice.reducer;
