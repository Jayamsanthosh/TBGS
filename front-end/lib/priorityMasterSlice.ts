import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PriorityGridData {
  id?: string | number;
  PRIORITY_ID?: number;
  PRIORITY_NAME: string;
  PRIORITY_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface PriorityState {
  priorities: PriorityGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: PriorityState = {
  priorities: [],
  loading: false,
  error: null,
};

export const fetchPriorities = createAsyncThunk(
  "priorities/fetchPriorities",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/priority-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch priorities");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PRIORITY_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch priorities");
    }
  }
);

export const addPriority = createAsyncThunk(
  "priorities/addPriority",
  async (item: PriorityGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/priority-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add priority");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add priority");
    }
  }
);

export const updatePriority = createAsyncThunk(
  "priorities/updatePriority",
  async (item: PriorityGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PRIORITY_ID: Number(item.id) || item.PRIORITY_ID };
      const response = await fetch(`${API_URL}/priority-master/${payload.PRIORITY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update priority");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update priority");
    }
  }
);

export const deletePriority = createAsyncThunk(
  "priorities/deletePriority",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/priority-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete priority");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete priority");
    }
  }
);

const prioritySlice = createSlice({
  name: "priorities",
  initialState,
  reducers: {
    clearPriorityError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPriorities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPriorities.fulfilled, (state, action) => {
        state.loading = false;
        state.priorities = action.payload;
      })
      .addCase(fetchPriorities.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch priorities";
      })
      .addCase(addPriority.pending, (state) => { state.error = null; })
      .addCase(addPriority.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add priority";
      })
      .addCase(updatePriority.pending, (state) => { state.error = null; })
      .addCase(updatePriority.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update priority";
      })
      .addCase(deletePriority.pending, (state) => { state.error = null; })
      .addCase(deletePriority.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete priority";
      });
  },
});

export const { clearPriorityError } = prioritySlice.actions;
export default prioritySlice.reducer;