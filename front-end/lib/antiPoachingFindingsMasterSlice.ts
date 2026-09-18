import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AntiPoachingFindingsMasterGridData {
  id?: string | number;
  ANTI_POACHING_FINDINGS_ID?: number;
  ANTI_POACHING_FINDINGS_NAME?: string;
  ANTI_POACHING_FINDINGS_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface AntiPoachingFindingsMasterState {
  records: AntiPoachingFindingsMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: AntiPoachingFindingsMasterState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchAntiPoachingFindingsMasters = createAsyncThunk(
  "antiPoachingFindingsMaster/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/anti-poaching-findings-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch findings");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.ANTI_POACHING_FINDINGS_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch findings");
    }
  }
);

export const fetchAntiPoachingFindingsMasterById = createAsyncThunk(
  "antiPoachingFindingsMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/anti-poaching-findings-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch finding");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch finding");
    }
  }
);

export const addAntiPoachingFindingsMaster = createAsyncThunk(
  "antiPoachingFindingsMaster/add",
  async (item: any, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/anti-poaching-findings-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add finding");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add finding");
    }
  }
);

export const updateAntiPoachingFindingsMaster = createAsyncThunk(
  "antiPoachingFindingsMaster/update",
  async (item: any, { rejectWithValue }) => {
    try {
      const payload = { ...item, ANTI_POACHING_FINDINGS_ID: Number(item.id) || item.ANTI_POACHING_FINDINGS_ID };
      const response = await fetch(`${API_URL}/anti-poaching-findings-master/${payload.ANTI_POACHING_FINDINGS_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update finding");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update finding");
    }
  }
);

export const deleteAntiPoachingFindingsMaster = createAsyncThunk(
  "antiPoachingFindingsMaster/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/anti-poaching-findings-master/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER: "Admin", ROLE: "Admin", MAC_ADDRESS: "WEB" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete finding");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete finding");
    }
  }
);

const antiPoachingFindingsMasterSlice = createSlice({
  name: "antiPoachingFindingsMaster",
  initialState,
  reducers: {
    clearAntiPoachingFindingsMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAntiPoachingFindingsMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAntiPoachingFindingsMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchAntiPoachingFindingsMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch findings";
      })
      .addCase(addAntiPoachingFindingsMaster.pending, (state) => { state.error = null; })
      .addCase(addAntiPoachingFindingsMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add finding";
      })
      .addCase(updateAntiPoachingFindingsMaster.pending, (state) => { state.error = null; })
      .addCase(updateAntiPoachingFindingsMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update finding";
      })
      .addCase(deleteAntiPoachingFindingsMaster.pending, (state) => { state.error = null; })
      .addCase(deleteAntiPoachingFindingsMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete finding";
      });
  },
});

export const { clearAntiPoachingFindingsMasterError } = antiPoachingFindingsMasterSlice.actions;
export default antiPoachingFindingsMasterSlice.reducer;
