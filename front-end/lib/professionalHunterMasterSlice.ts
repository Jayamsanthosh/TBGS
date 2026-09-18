import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ProfessionalHunterMasterGridData {
  id?: string | number;
  PH_ID?: number;
  PH_NAME?: string;
  PH_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ProfessionalHunterMasterState {
  records: ProfessionalHunterMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ProfessionalHunterMasterState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchProfessionalHunterMasters = createAsyncThunk(
  "professionalHunterMaster/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/professional-hunter-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch hunters");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PH_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch hunters");
    }
  }
);

export const fetchProfessionalHunterMasterById = createAsyncThunk(
  "professionalHunterMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/professional-hunter-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch hunter");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch hunter");
    }
  }
);

export const addProfessionalHunterMaster = createAsyncThunk(
  "professionalHunterMaster/add",
  async (item: any, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/professional-hunter-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add hunter");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add hunter");
    }
  }
);

export const updateProfessionalHunterMaster = createAsyncThunk(
  "professionalHunterMaster/update",
  async (item: any, { rejectWithValue }) => {
    try {
      const payload = { ...item, PH_ID: Number(item.id) || item.PH_ID };
      const response = await fetch(`${API_URL}/professional-hunter-master/${payload.PH_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update hunter");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update hunter");
    }
  }
);

export const deleteProfessionalHunterMaster = createAsyncThunk(
  "professionalHunterMaster/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/professional-hunter-master/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER: "Admin", ROLE: "Admin", MAC_ADDRESS: "WEB" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete hunter");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete hunter");
    }
  }
);

const professionalHunterMasterSlice = createSlice({
  name: "professionalHunterMaster",
  initialState,
  reducers: {
    clearProfessionalHunterMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfessionalHunterMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProfessionalHunterMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchProfessionalHunterMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch hunters";
      })
      .addCase(addProfessionalHunterMaster.pending, (state) => { state.error = null; })
      .addCase(addProfessionalHunterMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add hunter";
      })
      .addCase(updateProfessionalHunterMaster.pending, (state) => { state.error = null; })
      .addCase(updateProfessionalHunterMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update hunter";
      })
      .addCase(deleteProfessionalHunterMaster.pending, (state) => { state.error = null; })
      .addCase(deleteProfessionalHunterMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete hunter";
      });
  },
});

export const { clearProfessionalHunterMasterError } = professionalHunterMasterSlice.actions;
export default professionalHunterMasterSlice.reducer;
