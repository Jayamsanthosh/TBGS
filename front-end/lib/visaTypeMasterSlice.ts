import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface VisaTypeGridData {
  id?: string | number;
  VISA_TYPE_ID?: number;
  VISA_TYPE_NAME: string;
  VISA_VALIDITY_DAYS?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface VisaTypeState {
  visaTypes: VisaTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: VisaTypeState = {
  visaTypes: [],
  loading: false,
  error: null,
};

export const fetchVisaTypes = createAsyncThunk(
  "visaType/fetchVisaTypes",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/visa-type-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/visa-type-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch visa types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.VISA_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch visa types");
    }
  }
);

export const addVisaType = createAsyncThunk(
  "visaType/addVisaType",
  async (item: VisaTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/visa-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add visa type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add visa type");
    }
  }
);

export const updateVisaType = createAsyncThunk(
  "visaType/updateVisaType",
  async (item: VisaTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, VISA_TYPE_ID: Number(item.id) || item.VISA_TYPE_ID };
      const response = await fetch(`${API_URL}/visa-type-master/${payload.VISA_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update visa type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update visa type");
    }
  }
);

export const deleteVisaType = createAsyncThunk(
  "visaType/deleteVisaType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/visa-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete visa type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete visa type");
    }
  }
);

const visaTypeSlice = createSlice({
  name: "visaType",
  initialState,
  reducers: {
    clearVisaTypeError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVisaTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVisaTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.visaTypes = action.payload;
      })
      .addCase(fetchVisaTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch visa types";
      })
      .addCase(addVisaType.pending, (state) => { state.error = null; })
      .addCase(addVisaType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add visa type";
      })
      .addCase(updateVisaType.pending, (state) => { state.error = null; })
      .addCase(updateVisaType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update visa type";
      })
      .addCase(deleteVisaType.pending, (state) => { state.error = null; })
      .addCase(deleteVisaType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete visa type";
      });
  },
});

export const { clearVisaTypeError } = visaTypeSlice.actions;
export default visaTypeSlice.reducer;
