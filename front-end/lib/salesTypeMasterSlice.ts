import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface SalesTypeMasterGridData {
  id?: string | number;
  SALES_TYPE_ID?: number;
  SALES_TYPE_NAME?: string;
  SALES_TYPE_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface SalesTypeMasterState {
  records: SalesTypeMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: SalesTypeMasterState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchSalesTypeMasters = createAsyncThunk(
  "salesTypeMaster/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sales-type-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch sales types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SALES_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sales types");
    }
  }
);

export const fetchSalesTypeMasterById = createAsyncThunk(
  "salesTypeMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sales-type-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch sales type");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sales type");
    }
  }
);

export const addSalesTypeMaster = createAsyncThunk(
  "salesTypeMaster/add",
  async (item: any, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sales-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add sales type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add sales type");
    }
  }
);

export const updateSalesTypeMaster = createAsyncThunk(
  "salesTypeMaster/update",
  async (item: any, { rejectWithValue }) => {
    try {
      const payload = { ...item, SALES_TYPE_ID: Number(item.id) || item.SALES_TYPE_ID };
      const response = await fetch(`${API_URL}/sales-type-master/${payload.SALES_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update sales type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update sales type");
    }
  }
);

export const deleteSalesTypeMaster = createAsyncThunk(
  "salesTypeMaster/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sales-type-master/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER: "Admin", ROLE: "Admin", MAC_ADDRESS: "WEB" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete sales type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete sales type");
    }
  }
);

const salesTypeMasterSlice = createSlice({
  name: "salesTypeMaster",
  initialState,
  reducers: {
    clearSalesTypeMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSalesTypeMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesTypeMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchSalesTypeMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch sales types";
      })
      .addCase(addSalesTypeMaster.pending, (state) => { state.error = null; })
      .addCase(addSalesTypeMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add sales type";
      })
      .addCase(updateSalesTypeMaster.pending, (state) => { state.error = null; })
      .addCase(updateSalesTypeMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update sales type";
      })
      .addCase(deleteSalesTypeMaster.pending, (state) => { state.error = null; })
      .addCase(deleteSalesTypeMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete sales type";
      });
  },
});

export const { clearSalesTypeMasterError } = salesTypeMasterSlice.actions;
export default salesTypeMasterSlice.reducer;
