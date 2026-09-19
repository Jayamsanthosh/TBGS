import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface RackSectionMasterGridData {
  id?: string | number;
  RACK_SECTION_ID?: number;
  RACK_SECTION_NAME?: string;
  RACK_SECTION_DESCRIPTION?: string;
  STATUS_MASTER?: string;
}

interface RackSectionMasterState {
  records: RackSectionMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: RackSectionMasterState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchRackSectionMasters = createAsyncThunk(
  "rackSectionMaster/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/rack-section-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch rack sections");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.RACK_SECTION_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch rack sections");
    }
  }
);

export const fetchRackSectionMasterById = createAsyncThunk(
  "rackSectionMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/rack-section-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch rack section");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch rack section");
    }
  }
);

export const addRackSectionMaster = createAsyncThunk(
  "rackSectionMaster/add",
  async (item: any, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/rack-section-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add rack section");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add rack section");
    }
  }
);

export const updateRackSectionMaster = createAsyncThunk(
  "rackSectionMaster/update",
  async (item: any, { rejectWithValue }) => {
    try {
      const payload = { ...item, RACK_SECTION_ID: Number(item.id) || item.RACK_SECTION_ID };
      const response = await fetch(`${API_URL}/rack-section-master/${payload.RACK_SECTION_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update rack section");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update rack section");
    }
  }
);

export const deleteRackSectionMaster = createAsyncThunk(
  "rackSectionMaster/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/rack-section-master/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER: "Admin", ROLE: "Admin", MAC_ADDRESS: "WEB" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete rack section");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete rack section");
    }
  }
);

const rackSectionMasterSlice = createSlice({
  name: "rackSectionMaster",
  initialState,
  reducers: {
    clearRackSectionMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRackSectionMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRackSectionMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchRackSectionMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch rack sections";
      })
      .addCase(addRackSectionMaster.pending, (state) => { state.error = null; })
      .addCase(addRackSectionMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add rack section";
      })
      .addCase(updateRackSectionMaster.pending, (state) => { state.error = null; })
      .addCase(updateRackSectionMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update rack section";
      })
      .addCase(deleteRackSectionMaster.pending, (state) => { state.error = null; })
      .addCase(deleteRackSectionMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete rack section";
      });
  },
});

export const { clearRackSectionMasterError } = rackSectionMasterSlice.actions;
export default rackSectionMasterSlice.reducer;
