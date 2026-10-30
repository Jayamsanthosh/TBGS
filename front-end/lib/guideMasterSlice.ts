import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface GuideMasterGridData {
  id?: string | number;
  GUIDE_ID?: number;
  GUIDE_NAME: string;
  GUIDE_DESCRIPTION?: string | null;
  REMARKS?: string | null;
  STATUS_MASTER?: string;
  CREATED_BY?: string;
  LINK_ID?: number | null;
}

interface GuideMasterState {
  records: GuideMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: GuideMasterState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchGuideMasters = createAsyncThunk(
  "guideMaster/fetchAll",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/guide-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch guides");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.GUIDE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch guides");
    }
  }
);

export const fetchGuideMasterById = createAsyncThunk(
  "guideMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/guide-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch guide");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch guide");
    }
  }
);

export const addGuideMaster = createAsyncThunk(
  "guideMaster/add",
  async (item: GuideMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/guide-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add guide");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add guide");
    }
  }
);

export const updateGuideMaster = createAsyncThunk(
  "guideMaster/update",
  async (item: GuideMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, GUIDE_ID: Number(item.id) || item.GUIDE_ID };
      const response = await fetch(`${API_URL}/guide-master/${payload.GUIDE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update guide");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update guide");
    }
  }
);

export const deleteGuideMaster = createAsyncThunk(
  "guideMaster/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/guide-master/${id}`, { method: "DELETE" });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete guide");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete guide");
    }
  }
);

const guideMasterSlice = createSlice({
  name: "guideMaster",
  initialState,
  reducers: {
    clearGuideMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchGuideMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGuideMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchGuideMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch guides";
      })
      .addCase(addGuideMaster.pending, (state) => { state.error = null; })
      .addCase(addGuideMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add guide";
      })
      .addCase(updateGuideMaster.pending, (state) => { state.error = null; })
      .addCase(updateGuideMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update guide";
      })
      .addCase(deleteGuideMaster.pending, (state) => { state.error = null; })
      .addCase(deleteGuideMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete guide";
      });
  },
});

export const { clearGuideMasterError } = guideMasterSlice.actions;
export default guideMasterSlice.reducer;
