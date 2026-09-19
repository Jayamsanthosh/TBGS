import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface UomGridData {
  id?: string | number;
  UOM_ID?: number;
  UOM_NAME: string;
  KG_PER_UOM?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface UomsState {
  uoms: UomGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: UomsState = {
  uoms: [],
  loading: false,
  error: null,
};

export const fetchUoms = createAsyncThunk(
  "uoms/fetchUoms",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/uom-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch UOMs");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.UOM_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch UOMs");
    }
  }
);

export const addUom = createAsyncThunk(
  "uoms/addUom",
  async (item: UomGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/uom-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add UOM");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add UOM");
    }
  }
);

export const updateUom = createAsyncThunk(
  "uoms/updateUom",
  async (item: UomGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, UOM_ID: Number(item.id) || item.UOM_ID };
      const response = await fetch(`${API_URL}/uom-master/${payload.UOM_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update UOM");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update UOM");
    }
  }
);

export const deleteUom = createAsyncThunk(
  "uoms/deleteUom",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/uom-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete UOM");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete UOM");
    }
  }
);

const uomsSlice = createSlice({
  name: "uoms",
  initialState,
  reducers: {
    clearUomsError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUoms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUoms.fulfilled, (state, action) => {
        state.loading = false;
        state.uoms = action.payload;
      })
      .addCase(fetchUoms.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch UOMs";
      })
      .addCase(addUom.pending, (state) => { state.error = null; })
      .addCase(addUom.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add UOM";
      })
      .addCase(updateUom.pending, (state) => { state.error = null; })
      .addCase(updateUom.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update UOM";
      })
      .addCase(deleteUom.pending, (state) => { state.error = null; })
      .addCase(deleteUom.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete UOM";
      });
  },
});

export const { clearUomsError } = uomsSlice.actions;
export default uomsSlice.reducer;
