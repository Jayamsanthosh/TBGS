import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ManPowerChangeRequestGridData {
  id?: string | number;
  MAN_POWER_REQUEST_ID?: number;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  DEPARTMENT_ID?: number;
  DEPARTMENT_NAME?: string;
  DESIGNATION_ID?: number;
  DESIGNATION_NAME?: string;
  EMPLOYMENT_TYPE_ID?: number;
  EMPLOYMENT_TYPE_NAME?: string;
  OLD_APPROVED_MAN_POWER?: number;
  ADD_REMOVE_MAN_POWER?: number;
  NEW_APPROVED_MAN_POWER?: number;
  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  RESPONSE_1_EMP_ID?: number;
  RESPONSE_1_DATE?: string;
  RESPONSE_1_STATUS?: string;
  RESPONSE_1_REMARKS?: string;
  RESPONSE_2_EMP_ID?: number;
  RESPONSE_2_DATE?: string;
  RESPONSE_2_STATUS?: string;
  RESPONSE_2_REMARKS?: string;
  FINAL_RESPONSE_PERSON?: string;
  FINAL_RESPONSE_DATE?: string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ManPowerChangeRequestState {
  items: ManPowerChangeRequestGridData[];
  current: ManPowerChangeRequestGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: ManPowerChangeRequestState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchManPowerChangeRequests = createAsyncThunk(
  "manPowerChangeRequest/fetchManPowerChangeRequests",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/man-power-change-request?status=${encodeURIComponent(status)}`
        : `${API_URL}/man-power-change-request`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch man power change requests");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.MAN_POWER_REQUEST_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch man power change requests");
    }
  }
);

export const getManPowerChangeRequestById = createAsyncThunk(
  "manPowerChangeRequest/getManPowerChangeRequestById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/man-power-change-request/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch man power change request");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch man power change request");
    }
  }
);

export const addManPowerChangeRequest = createAsyncThunk(
  "manPowerChangeRequest/addManPowerChangeRequest",
  async (item: ManPowerChangeRequestGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/man-power-change-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add man power change request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add man power change request");
    }
  }
);

export const updateManPowerChangeRequest = createAsyncThunk(
  "manPowerChangeRequest/updateManPowerChangeRequest",
  async (item: ManPowerChangeRequestGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, MAN_POWER_REQUEST_ID: Number(item.id) || item.MAN_POWER_REQUEST_ID };
      const response = await fetch(`${API_URL}/man-power-change-request/${payload.MAN_POWER_REQUEST_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update man power change request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update man power change request");
    }
  }
);

export const deleteManPowerChangeRequest = createAsyncThunk(
  "manPowerChangeRequest/deleteManPowerChangeRequest",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/man-power-change-request/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete man power change request");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete man power change request");
    }
  }
);

const manPowerChangeRequestSlice = createSlice({
  name: "manPowerChangeRequest",
  initialState,
  reducers: {
    clearManPowerChangeRequestError(state) {
      state.error = null;
    },
    clearCurrentManPowerChangeRequest(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchManPowerChangeRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchManPowerChangeRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchManPowerChangeRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch man power change requests";
      })
      .addCase(getManPowerChangeRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getManPowerChangeRequestById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getManPowerChangeRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch man power change request";
      })
      .addCase(addManPowerChangeRequest.pending, (state) => { state.error = null; })
      .addCase(addManPowerChangeRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add man power change request";
      })
      .addCase(updateManPowerChangeRequest.pending, (state) => { state.error = null; })
      .addCase(updateManPowerChangeRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update man power change request";
      })
      .addCase(deleteManPowerChangeRequest.pending, (state) => { state.error = null; })
      .addCase(deleteManPowerChangeRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete man power change request";
      });
  },
});

export const { clearManPowerChangeRequestError, clearCurrentManPowerChangeRequest } = manPowerChangeRequestSlice.actions;
export default manPowerChangeRequestSlice.reducer;
