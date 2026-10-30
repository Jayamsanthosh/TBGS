import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface TransportServiceTypeMasterGridData {
  id?: string | number;
  TRANSPORT_SERVICE_TYPE_ID?: number;
  TRANSPORT_SERVICE_TYPE_NAME: string;
  DESCRIPTION?: string | null;
  REMARKS?: string | null;
  STATUS_MASTER?: string;
  CREATED_BY?: string;
  LINK_ID?: number | null;
  LINK_NAME?: string | null;
}

interface TransportServiceTypeMasterState {
  records: TransportServiceTypeMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: TransportServiceTypeMasterState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchTransportServiceTypeMasters = createAsyncThunk(
  "transportServiceTypeMaster/fetchAll",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/transport-service-type-master?status=${encodeURIComponent(status)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(
          errorData.message || "Failed to fetch transport service types"
        );
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({
        ...u,
        id: u.TRANSPORT_SERVICE_TYPE_ID,
      }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch transport service types");
    }
  }
);

export const fetchTransportServiceTypeMasterById = createAsyncThunk(
  "transportServiceTypeMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/transport-service-type-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch transport service type");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch transport service type");
    }
  }
);

export const addTransportServiceTypeMaster = createAsyncThunk(
  "transportServiceTypeMaster/add",
  async (item: TransportServiceTypeMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/transport-service-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(
          errorData.message || "Failed to add transport service type"
        );
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add transport service type");
    }
  }
);

export const updateTransportServiceTypeMaster = createAsyncThunk(
  "transportServiceTypeMaster/update",
  async (item: TransportServiceTypeMasterGridData, { rejectWithValue }) => {
    try {
      const payload = {
        ...item,
        TRANSPORT_SERVICE_TYPE_ID:
          Number(item.id) || item.TRANSPORT_SERVICE_TYPE_ID,
      };
      const response = await fetch(
        `${API_URL}/transport-service-type-master/${payload.TRANSPORT_SERVICE_TYPE_ID}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(
          errorData.message || "Failed to update transport service type"
        );
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update transport service type");
    }
  }
);

export const deleteTransportServiceTypeMaster = createAsyncThunk(
  "transportServiceTypeMaster/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/transport-service-type-master/${id}`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(
          errorData.message || "Failed to delete transport service type"
        );
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete transport service type");
    }
  }
);

const transportServiceTypeMasterSlice = createSlice({
  name: "transportServiceTypeMaster",
  initialState,
  reducers: {
    clearTransportServiceTypeMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransportServiceTypeMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransportServiceTypeMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchTransportServiceTypeMasters.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch transport service types";
      })
      .addCase(addTransportServiceTypeMaster.pending, (state) => {
        state.error = null;
      })
      .addCase(addTransportServiceTypeMaster.rejected, (state, action) => {
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to add transport service type";
      })
      .addCase(updateTransportServiceTypeMaster.pending, (state) => {
        state.error = null;
      })
      .addCase(updateTransportServiceTypeMaster.rejected, (state, action) => {
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to update transport service type";
      })
      .addCase(deleteTransportServiceTypeMaster.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteTransportServiceTypeMaster.rejected, (state, action) => {
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to delete transport service type";
      });
  },
});

export const { clearTransportServiceTypeMasterError } =
  transportServiceTypeMasterSlice.actions;
export default transportServiceTypeMasterSlice.reducer;
