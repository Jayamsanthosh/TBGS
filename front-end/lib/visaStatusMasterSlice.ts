import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface VisaStatusGridData {
  id?: string | number;
  VISA_STATUS_ID?: number;
  VISA_STATUS_NAME: string;
  VISA_STATUS_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface VisaStatusState {
  visaStatuses: VisaStatusGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: VisaStatusState = {
  visaStatuses: [],
  loading: false,
  error: null,
};

export const fetchVisaStatuses = createAsyncThunk(
  "visaStatuses/fetchVisaStatuses",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/visa-status-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch visa statuses");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.VISA_STATUS_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch visa statuses");
    }
  }
);

export const addVisaStatus = createAsyncThunk(
  "visaStatuses/addVisaStatus",
  async (item: VisaStatusGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/visa-status-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add visa status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add visa status");
    }
  }
);

export const updateVisaStatus = createAsyncThunk(
  "visaStatuses/updateVisaStatus",
  async (item: VisaStatusGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, VISA_STATUS_ID: Number(item.id) || item.VISA_STATUS_ID };
      const response = await fetch(`${API_URL}/visa-status-master/${payload.VISA_STATUS_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update visa status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update visa status");
    }
  }
);

export const deleteVisaStatus = createAsyncThunk(
  "visaStatuses/deleteVisaStatus",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/visa-status-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete visa status");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete visa status");
    }
  }
);

const visaStatusSlice = createSlice({
  name: "visaStatuses",
  initialState,
  reducers: {
    clearVisaStatusError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaStatuses.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisaStatuses.fulfilled, (state, action) => {
        state.loading = false;
        state.visaStatuses = action.payload;
      })
      .addCase(fetchVisaStatuses.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch visa statuses";
      })
      .addCase(addVisaStatus.pending, (state) => { state.error = null; })
      .addCase(addVisaStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add visa status";
      })
      .addCase(updateVisaStatus.pending, (state) => { state.error = null; })
      .addCase(updateVisaStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update visa status";
      })
      .addCase(deleteVisaStatus.pending, (state) => { state.error = null; })
      .addCase(deleteVisaStatus.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete visa status";
      });
  },
});

export const { clearVisaStatusError } = visaStatusSlice.actions;
export default visaStatusSlice.reducer;