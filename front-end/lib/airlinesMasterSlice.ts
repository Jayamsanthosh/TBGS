import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AirlinesGridData {
  id?: string | number;
  AIRLINE_ID?: number;
  AIRLINE_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface AirlinesState {
  airlines: AirlinesGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: AirlinesState = {
  airlines: [],
  loading: false,
  error: null,
};

export const fetchAirlines = createAsyncThunk(
  "airlines/fetchAirlines",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/airlines-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch airlines");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.AIRLINE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch airlines");
    }
  }
);

export const addAirlines = createAsyncThunk(
  "airlines/addAirlines",
  async (item: AirlinesGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/airlines-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add airline");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add airline");
    }
  }
);

export const updateAirlines = createAsyncThunk(
  "airlines/updateAirlines",
  async (item: AirlinesGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, AIRLINE_ID: Number(item.id) || item.AIRLINE_ID };
      const response = await fetch(`${API_URL}/airlines-master/${payload.AIRLINE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update airline");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update airline");
    }
  }
);

export const deleteAirlines = createAsyncThunk(
  "airlines/deleteAirlines",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/airlines-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete airline");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete airline");
    }
  }
);

const airlinesSlice = createSlice({
  name: "airlines",
  initialState,
  reducers: {
    clearAirlinesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAirlines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAirlines.fulfilled, (state, action) => {
        state.loading = false;
        state.airlines = action.payload;
      })
      .addCase(fetchAirlines.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch airlines";
      })
      .addCase(addAirlines.pending, (state) => { state.error = null; })
      .addCase(addAirlines.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add airline";
      })
      .addCase(updateAirlines.pending, (state) => { state.error = null; })
      .addCase(updateAirlines.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update airline";
      })
      .addCase(deleteAirlines.pending, (state) => { state.error = null; })
      .addCase(deleteAirlines.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete airline";
      });
  },
});

export const { clearAirlinesError } = airlinesSlice.actions;
export default airlinesSlice.reducer;
