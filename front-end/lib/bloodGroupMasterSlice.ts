import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BloodGroupGridData {
  id?: string | number;
  BLOOD_GROUP_ID?: number;
  BLOOD_GROUP_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BloodGroupState {
  bloodGroups: BloodGroupGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BloodGroupState = {
  bloodGroups: [],
  loading: false,
  error: null,
};

export const fetchBloodGroups = createAsyncThunk(
  "bloodGroup/fetchBloodGroups",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/blood-group-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/blood-group-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch blood groups");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BLOOD_GROUP_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch blood groups");
    }
  }
);

export const addBloodGroup = createAsyncThunk(
  "bloodGroup/addBloodGroup",
  async (item: BloodGroupGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/blood-group-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add blood group");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add blood group");
    }
  }
);

export const updateBloodGroup = createAsyncThunk(
  "bloodGroup/updateBloodGroup",
  async (item: BloodGroupGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BLOOD_GROUP_ID: Number(item.id) || item.BLOOD_GROUP_ID };
      const response = await fetch(`${API_URL}/blood-group-master/${payload.BLOOD_GROUP_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update blood group");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update blood group");
    }
  }
);

export const deleteBloodGroup = createAsyncThunk(
  "bloodGroup/deleteBloodGroup",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/blood-group-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete blood group");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete blood group");
    }
  }
);

const bloodGroupSlice = createSlice({
  name: "bloodGroup",
  initialState,
  reducers: {
    clearBloodGroupError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBloodGroups.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBloodGroups.fulfilled, (state, action) => {
        state.loading = false;
        state.bloodGroups = action.payload;
      })
      .addCase(fetchBloodGroups.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch blood groups";
      })
      .addCase(addBloodGroup.pending, (state) => { state.error = null; })
      .addCase(addBloodGroup.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add blood group";
      })
      .addCase(updateBloodGroup.pending, (state) => { state.error = null; })
      .addCase(updateBloodGroup.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update blood group";
      })
      .addCase(deleteBloodGroup.pending, (state) => { state.error = null; })
      .addCase(deleteBloodGroup.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete blood group";
      });
  },
});

export const { clearBloodGroupError } = bloodGroupSlice.actions;
export default bloodGroupSlice.reducer;
