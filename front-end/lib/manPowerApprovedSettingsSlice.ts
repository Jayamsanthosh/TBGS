import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ManPowerApprovedSettingsGridData {
  id?: string | number;
  MAN_POWER_APPROVED_ID?: number;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  DEPARTMENT_ID?: number;
  DEPARTMENT_NAME?: string;
  DESIGNATION_ID?: number;
  DESIGNATION_NAME?: string;
  EMPLOYMENT_TYPE_ID?: number;
  EMPLOYMENT_TYPE_NAME?: string;
  NEW_APPROVED_MAN_POWER?: number;
  MAN_POWER_REQUEST_ID?: number;
  APPROVED_BY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ManPowerApprovedSettingsState {
  items: ManPowerApprovedSettingsGridData[];
  current: ManPowerApprovedSettingsGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ManPowerApprovedSettingsState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchManPowerApprovedSettings = createAsyncThunk(
  "manPowerApprovedSettings/fetchManPowerApprovedSettings",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/man-power-approved-settings?status=${encodeURIComponent(status)}`
        : `${API_URL}/man-power-approved-settings`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch man power approved settings");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.MAN_POWER_APPROVED_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch man power approved settings");
    }
  }
);

export const getManPowerApprovedSettingsById = createAsyncThunk(
  "manPowerApprovedSettings/getManPowerApprovedSettingsById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/man-power-approved-settings/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch man power approved settings");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch man power approved settings");
    }
  }
);

export const addManPowerApprovedSettings = createAsyncThunk(
  "manPowerApprovedSettings/addManPowerApprovedSettings",
  async (item: ManPowerApprovedSettingsGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/man-power-approved-settings`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add man power approved settings");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add man power approved settings");
    }
  }
);

export const updateManPowerApprovedSettings = createAsyncThunk(
  "manPowerApprovedSettings/updateManPowerApprovedSettings",
  async (item: ManPowerApprovedSettingsGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, MAN_POWER_APPROVED_ID: Number(item.id) || item.MAN_POWER_APPROVED_ID };
      const response = await fetch(`${API_URL}/man-power-approved-settings/${payload.MAN_POWER_APPROVED_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update man power approved settings");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update man power approved settings");
    }
  }
);

export const deleteManPowerApprovedSettings = createAsyncThunk(
  "manPowerApprovedSettings/deleteManPowerApprovedSettings",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/man-power-approved-settings/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete man power approved settings");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete man power approved settings");
    }
  }
);

const manPowerApprovedSettingsSlice = createSlice({
  name: "manPowerApprovedSettings",
  initialState,
  reducers: {
    clearManPowerApprovedSettingsError(state) {
      state.error = null;
    },
    clearCurrentManPowerApprovedSettings(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManPowerApprovedSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManPowerApprovedSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchManPowerApprovedSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch man power approved settings";
      })
      .addCase(getManPowerApprovedSettingsById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getManPowerApprovedSettingsById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getManPowerApprovedSettingsById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch man power approved settings";
      })
      .addCase(addManPowerApprovedSettings.pending, (state) => { state.error = null; })
      .addCase(addManPowerApprovedSettings.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add man power approved settings";
      })
      .addCase(updateManPowerApprovedSettings.pending, (state) => { state.error = null; })
      .addCase(updateManPowerApprovedSettings.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update man power approved settings";
      })
      .addCase(deleteManPowerApprovedSettings.pending, (state) => { state.error = null; })
      .addCase(deleteManPowerApprovedSettings.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete man power approved settings";
      });
  },
});

export const { clearManPowerApprovedSettingsError, clearCurrentManPowerApprovedSettings } = manPowerApprovedSettingsSlice.actions;
export default manPowerApprovedSettingsSlice.reducer;
