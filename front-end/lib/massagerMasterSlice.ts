import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface MassagerMasterGridData {
  id?: string | number;
  MASSAGER_ID?: number;
  MASSAGER_NAME?: string;
  ADDRESS?: string;
  LOCATION_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface MassagerMasterState {
  massagers: MassagerMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: MassagerMasterState = {
  massagers: [],
  loading: false,
  error: null,
};

export const fetchMassagers = createAsyncThunk(
  "massagerMaster/fetchMassagers",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/massager-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/massager-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch massagers");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.MASSAGER_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch massagers");
    }
  }
);

export const addMassager = createAsyncThunk(
  "massagerMaster/addMassager",
  async (item: MassagerMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/massager-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add massager");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add massager");
    }
  }
);

export const updateMassager = createAsyncThunk(
  "massagerMaster/updateMassager",
  async (item: MassagerMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, MASSAGER_ID: Number(item.id) || item.MASSAGER_ID };
      const response = await fetch(`${API_URL}/massager-master/${payload.MASSAGER_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update massager");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update massager");
    }
  }
);

export const deleteMassager = createAsyncThunk(
  "massagerMaster/deleteMassager",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/massager-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete massager");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete massager");
    }
  }
);

const massagerMasterSlice = createSlice({
  name: "massagerMaster",
  initialState,
  reducers: {
    clearMassagerMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMassagers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMassagers.fulfilled, (state, action) => {
        state.loading = false;
        state.massagers = action.payload;
      })
      .addCase(fetchMassagers.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch massagers";
      })
      .addCase(addMassager.pending, (state) => { state.error = null; })
      .addCase(addMassager.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add massager";
      })
      .addCase(updateMassager.pending, (state) => { state.error = null; })
      .addCase(updateMassager.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update massager";
      })
      .addCase(deleteMassager.pending, (state) => { state.error = null; })
      .addCase(deleteMassager.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete massager";
      });
  },
});

export const { clearMassagerMasterError } = massagerMasterSlice.actions;
export default massagerMasterSlice.reducer;
