import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ShipmentModeMasterGridData {
  id?: string | number;
  shipmentModeId?: number;
  shipmentModeName?: string;
  remarks?: string;
  statusEntry?: string;
  createdBy?: string;
  createdDate?: string;
  createdMacAddress?: string;
  modifiedBy?: string;
  modifiedDate?: string;
  modifiedMacAddress?: string;
}

export interface ShipmentModeMasterOption {
  shipmentModeId?: number;
  shipmentModeName?: string;
  statusEntry?: string;
  displayText?: string;
}

export interface ShipmentModeMasterListParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

interface ShipmentModeMasterState {
  items: ShipmentModeMasterGridData[];
  total: number;
  options: ShipmentModeMasterOption[];
  loading: boolean;
  error: string | null;
}

const initialState: ShipmentModeMasterState = {
  items: [],
  total: 0,
  options: [],
  loading: false,
  error: null,
};

export const fetchShipmentModes = createAsyncThunk(
  "shipmentModeMaster/fetchAll",
  async (params: ShipmentModeMasterListParams = {}, { rejectWithValue }) => {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set("status", params.status);
      if (params.search) query.set("search", params.search);
      if (params.page) query.set("page", String(params.page));
      if (params.pageSize) query.set("pageSize", String(params.pageSize));
      const qs = query.toString();

      const response = await fetch(`${API_URL}/shipment-mode-master${qs ? `?${qs}` : ""}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch shipment modes");
      }
      const json = await response.json();
      const rows = json.data || [];
      return {
        rows: rows.map((u: any) => ({ ...u, id: u.shipmentModeId || u.SHIPMENT_MODE_ID })),
        total: json.total ?? rows.length,
      };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch shipment modes");
    }
  }
);

export const fetchShipmentModeById = createAsyncThunk(
  "shipmentModeMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/shipment-mode-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch shipment mode");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch shipment mode");
    }
  }
);

export const loadShipmentModeOptions = createAsyncThunk(
  "shipmentModeMaster/loadOptions",
  async (params: { includeInactive?: boolean } = {}, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/shipment-mode-master/load?includeInactive=${params.includeInactive ? "true" : "false"}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to load shipment modes");
      }
      const json = await response.json();
      return (json.data || []).map((o: any) => ({ ...o, id: o.shipmentModeId }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load shipment modes");
    }
  }
);

export const addShipmentMode = createAsyncThunk(
  "shipmentModeMaster/add",
  async (item: ShipmentModeMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/shipment-mode-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add shipment mode");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add shipment mode");
    }
  }
);

export const updateShipmentMode = createAsyncThunk(
  "shipmentModeMaster/update",
  async (item: ShipmentModeMasterGridData, { rejectWithValue }) => {
    try {
      const payload = {
        ...item,
        SHIPMENT_MODE_ID: Number(item.id) || item.shipmentModeId,
      };
      const response = await fetch(`${API_URL}/shipment-mode-master/${payload.SHIPMENT_MODE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update shipment mode");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update shipment mode");
    }
  }
);

export const deleteShipmentMode = createAsyncThunk(
  "shipmentModeMaster/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/shipment-mode-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete shipment mode");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete shipment mode");
    }
  }
);

const shipmentModeMasterSlice = createSlice({
  name: "shipmentModeMaster",
  initialState,
  reducers: {
    clearShipmentModeMasterError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchShipmentModes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchShipmentModes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.rows;
        state.total = action.payload.total;
      })
      .addCase(fetchShipmentModes.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch shipment modes";
      })
      .addCase(loadShipmentModeOptions.pending, (state) => {
        state.error = null;
      })
      .addCase(loadShipmentModeOptions.fulfilled, (state, action) => {
        state.options = action.payload;
      })
      .addCase(loadShipmentModeOptions.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to load shipment modes";
      })
      .addCase(addShipmentMode.pending, (state) => {
        state.error = null;
      })
      .addCase(addShipmentMode.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to add shipment mode";
      })
      .addCase(updateShipmentMode.pending, (state) => {
        state.error = null;
      })
      .addCase(updateShipmentMode.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to update shipment mode";
      })
      .addCase(deleteShipmentMode.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteShipmentMode.rejected, (state, action) => {
        state.error =
          (action.payload as string) || action.error.message || "Failed to delete shipment mode";
      });
  },
});

export const { clearShipmentModeMasterError } = shipmentModeMasterSlice.actions;
export default shipmentModeMasterSlice.reducer;