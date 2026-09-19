import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ParticipantTypeGridData {
  id?: string | number;
  PARTICIPANT_TYPE_ID?: number;
  PARTICIPANT_TYPE_NAME: string;
  PARTICIPANT_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ParticipantTypeState {
  participantTypes: ParticipantTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ParticipantTypeState = {
  participantTypes: [],
  loading: false,
  error: null,
};

export const fetchParticipantTypes = createAsyncThunk(
  "participantTypes/fetchParticipantTypes",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/participant-type-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch participant types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PARTICIPANT_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch participant types");
    }
  }
);

export const addParticipantType = createAsyncThunk(
  "participantTypes/addParticipantType",
  async (item: ParticipantTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/participant-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add participant type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add participant type");
    }
  }
);

export const updateParticipantType = createAsyncThunk(
  "participantTypes/updateParticipantType",
  async (item: ParticipantTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PARTICIPANT_TYPE_ID: Number(item.id) || item.PARTICIPANT_TYPE_ID };
      const response = await fetch(`${API_URL}/participant-type-master/${payload.PARTICIPANT_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update participant type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update participant type");
    }
  }
);

export const deleteParticipantType = createAsyncThunk(
  "participantTypes/deleteParticipantType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/participant-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete participant type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete participant type");
    }
  }
);

const participantTypeSlice = createSlice({
  name: "participantTypes",
  initialState,
  reducers: {
    clearParticipantTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchParticipantTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchParticipantTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.participantTypes = action.payload;
      })
      .addCase(fetchParticipantTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch participant types";
      })
      .addCase(addParticipantType.pending, (state) => { state.error = null; })
      .addCase(addParticipantType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add participant type";
      })
      .addCase(updateParticipantType.pending, (state) => { state.error = null; })
      .addCase(updateParticipantType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update participant type";
      })
      .addCase(deleteParticipantType.pending, (state) => { state.error = null; })
      .addCase(deleteParticipantType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete participant type";
      });
  },
});

export const { clearParticipantTypeError } = participantTypeSlice.actions;
export default participantTypeSlice.reducer;