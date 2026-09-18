import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface FieldCombinedDtl {
  ACTIVITY_ID_FLD_DTL?: number;
  ACTIVITY_NAME_FLD_DTL: string;
  ACTIVITY_DESC_FLD_DTL?: string;
  REMARKS_FLD_DTL?: string;
  STATUS_FLD_DTL?: string;
}

export interface FieldCombinedGridData {
  id?: string | number;
  FIELD_ID_FLD_HDR?: number;
  PROJECT_NAME_FLD_HDR: string;
  FIELD_CATEGORY_FLD_HDR: string;
  FIELD_DESC_FLD_HDR?: string;
  REMARKS_FLD_HDR?: string;
  STATUS_FLD_HDR?: string;
  ACTIVITY_ID_FLD_DTL?: number;
  ACTIVITY_NAME_FLD_DTL: string;
  ACTIVITY_DESC_FLD_DTL?: string;
  REMARKS_FLD_DTL?: string;
  STATUS_FLD_DTL?: string;
  dtls?: FieldCombinedDtl[];
  deletedIds?: number[];
}

interface FieldCombinedState {
  items: FieldCombinedGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: FieldCombinedState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchFieldCombined = createAsyncThunk(
  "fieldCombined/fetchFieldCombined",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/field`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch field data");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.ACTIVITY_ID_FLD_DTL }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch field data");
    }
  }
);

export const addFieldCombined = createAsyncThunk(
  "fieldCombined/addFieldCombined",
  async (item: FieldCombinedGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/field`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add field");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add field");
    }
  }
);

export const updateFieldCombined = createAsyncThunk(
  "fieldCombined/updateFieldCombined",
  async (item: FieldCombinedGridData, { rejectWithValue }) => {
    try {
      const headerId = item.FIELD_ID_FLD_HDR;
      const response = await fetch(`${API_URL}/field/${headerId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update field");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update field");
    }
  }
);

export const deleteFieldCombined = createAsyncThunk(
  "fieldCombined/deleteFieldCombined",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/field/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete field");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete field");
    }
  }
);

const fieldCombinedSlice = createSlice({
  name: "fieldCombined",
  initialState,
  reducers: {
    clearFieldCombinedError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchFieldCombined.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFieldCombined.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchFieldCombined.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch field data";
      })
      .addCase(addFieldCombined.pending, (state) => { state.error = null; })
      .addCase(addFieldCombined.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add field";
      })
      .addCase(updateFieldCombined.pending, (state) => { state.error = null; })
      .addCase(updateFieldCombined.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update field";
      })
      .addCase(deleteFieldCombined.pending, (state) => { state.error = null; })
      .addCase(deleteFieldCombined.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete field";
      });
  },
});

export const { clearFieldCombinedError } = fieldCombinedSlice.actions;
export default fieldCombinedSlice.reducer;
