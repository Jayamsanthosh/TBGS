import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BatchMasterData {
  BATCH_ID?: number;
  BATCH_NO?: string;
  LINK_PAGES_ID?: number | null;
  BATCH_SOURCE_REF_NO?: string;
  BATCH_SOURCE_DTL_ID?: number | null;
  COMPANY_ID?: number | null;
  CAMP_ID?: number | null;
  STORE_ID?: number | null;
  PRODUCT_ID?: number | null;
  BATCH_QTY?: any;
  UOM_ID?: number | null;
  MANUFACTURE_DATE?: string;
  EXPIRY_DATE?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface BatchMasterState {
  items: BatchMasterData[];
  loading: boolean;
  error: string | null;
}

const initialState: BatchMasterState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchBatchesBySource = createAsyncThunk(
  "batchMaster/fetchBySource",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/batch-master?refNo=${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch batches");
      }
      const json = await response.json();
      return json.data || [];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch batches");
    }
  }
);

export const fetchBatchById = createAsyncThunk(
  "batchMaster/fetchById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/batch-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch batch");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch batch");
    }
  }
);

export const addBatch = createAsyncThunk(
  "batchMaster/add",
  async (item: BatchMasterData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/batch-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add batch");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add batch");
    }
  }
);

export const updateBatch = createAsyncThunk(
  "batchMaster/update",
  async (item: BatchMasterData, { rejectWithValue }) => {
    try {
      const id = item.BATCH_ID;
      const response = await fetch(`${API_URL}/batch-master/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update batch");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update batch");
    }
  }
);

export const deleteBatch = createAsyncThunk(
  "batchMaster/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/batch-master/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete batch");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete batch");
    }
  }
);

const batchMasterSlice = createSlice({
  name: "batchMaster",
  initialState,
  reducers: {
    clearBatchMasterError(state) {
      state.error = null;
    },
    clearBatches(state) {
      state.items = [];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBatchesBySource.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBatchesBySource.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchBatchesBySource.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch batches";
      })
      .addCase(addBatch.pending, (state) => {
        state.error = null;
      })
      .addCase(addBatch.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add batch";
      })
      .addCase(updateBatch.pending, (state) => {
        state.error = null;
      })
      .addCase(updateBatch.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update batch";
      })
      .addCase(deleteBatch.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteBatch.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete batch";
      });
  },
});

export const { clearBatchMasterError, clearBatches } = batchMasterSlice.actions;
export default batchMasterSlice.reducer;
