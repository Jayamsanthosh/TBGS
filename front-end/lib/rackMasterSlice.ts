import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface RackMasterGridData {
  id?: string | number;
  RACK_ID?: number;
  RACK_NAME?: string;
  RACK_DESCRIPTION?: string;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  CAMP_ID?: number;
  CAMP_NAME?: string;
  STORE_ID?: number;
  STORE_NAME?: string;
  RACK_SECTION_ID?: number;
  RACK_SECTION_NAME?: string;
  MAX_CAPACITY?: number;
  STATUS_MASTER?: string;
  REMARKS?: string;
}

interface RackMasterState {
  records: RackMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: RackMasterState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchRackMasters = createAsyncThunk(
  "rackMaster/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/rack-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch racks");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.RACK_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch racks");
    }
  }
);

export const fetchRackMasterById = createAsyncThunk(
  "rackMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/rack-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch rack");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch rack");
    }
  }
);

export const addRackMaster = createAsyncThunk(
  "rackMaster/add",
  async (item: any, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/rack-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add rack");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add rack");
    }
  }
);

export const updateRackMaster = createAsyncThunk(
  "rackMaster/update",
  async (item: any, { rejectWithValue }) => {
    try {
      const payload = { ...item, RACK_ID: Number(item.id) || item.RACK_ID };
      const response = await fetch(`${API_URL}/rack-master/${payload.RACK_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update rack");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update rack");
    }
  }
);

export const deleteRackMaster = createAsyncThunk(
  "rackMaster/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/rack-master/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER: "Admin", ROLE: "Admin", MAC_ADDRESS: "WEB" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete rack");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete rack");
    }
  }
);

const rackMasterSlice = createSlice({
  name: "rackMaster",
  initialState,
  reducers: {
    clearRackMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRackMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRackMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchRackMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch racks";
      })
      .addCase(addRackMaster.pending, (state) => { state.error = null; })
      .addCase(addRackMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add rack";
      })
      .addCase(updateRackMaster.pending, (state) => { state.error = null; })
      .addCase(updateRackMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update rack";
      })
      .addCase(deleteRackMaster.pending, (state) => { state.error = null; })
      .addCase(deleteRackMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete rack";
      });
  },
});

export const { clearRackMasterError } = rackMasterSlice.actions;
export default rackMasterSlice.reducer;
