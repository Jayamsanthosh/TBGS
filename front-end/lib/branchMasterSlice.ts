import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BranchGridData {
  id?: string | number;
  BRANCH_ID?: number;
  BRANCH_NAME: string;
  BRANCH_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BranchState {
  branches: BranchGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BranchState = {
  branches: [],
  loading: false,
  error: null,
};

export const fetchBranches = createAsyncThunk(
  "branches/fetchBranches",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/branch-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch branches");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BRANCH_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch branches");
    }
  }
);

export const addBranch = createAsyncThunk(
  "branches/addBranch",
  async (item: BranchGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/branch-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add branch");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add branch");
    }
  }
);

export const updateBranch = createAsyncThunk(
  "branches/updateBranch",
  async (item: BranchGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BRANCH_ID: Number(item.id) || item.BRANCH_ID };
      const response = await fetch(`${API_URL}/branch-master/${payload.BRANCH_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update branch");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update branch");
    }
  }
);

export const deleteBranch = createAsyncThunk(
  "branches/deleteBranch",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/branch-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete branch");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete branch");
    }
  }
);

const branchSlice = createSlice({
  name: "branches",
  initialState,
  reducers: {
    clearBranchError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBranches.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBranches.fulfilled, (state, action) => {
        state.loading = false;
        state.branches = action.payload;
      })
      .addCase(fetchBranches.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch branches";
      })
      .addCase(addBranch.pending, (state) => { state.error = null; })
      .addCase(addBranch.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add branch";
      })
      .addCase(updateBranch.pending, (state) => { state.error = null; })
      .addCase(updateBranch.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update branch";
      })
      .addCase(deleteBranch.pending, (state) => { state.error = null; })
      .addCase(deleteBranch.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete branch";
      });
  },
});

export const { clearBranchError } = branchSlice.actions;
export default branchSlice.reducer;