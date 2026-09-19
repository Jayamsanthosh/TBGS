import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CostCentreGridData {
  id?: string | number;
  COST_CENTRE_ID?: number;
  COST_CENTRE_NAME?: string;
  COMPANY_ID?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface CostCentreState {
  centres: CostCentreGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CostCentreState = {
  centres: [],
  loading: false,
  error: null,
};

export const fetchCostCentres = createAsyncThunk(
  "costCentre/fetchAll",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/cost-centre-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch cost centres");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.COST_CENTRE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch cost centres");
    }
  }
);

export const addCostCentre = createAsyncThunk(
  "costCentre/add",
  async (item: CostCentreGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/cost-centre-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add cost centre");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add cost centre");
    }
  }
);

export const updateCostCentre = createAsyncThunk(
  "costCentre/update",
  async (item: CostCentreGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, COST_CENTRE_ID: Number(item.id) || item.COST_CENTRE_ID };
      const response = await fetch(`${API_URL}/cost-centre-master/${payload.COST_CENTRE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update cost centre");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update cost centre");
    }
  }
);

export const deleteCostCentre = createAsyncThunk(
  "costCentre/delete",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/cost-centre-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete cost centre");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete cost centre");
    }
  }
);

const costCentreSlice = createSlice({
  name: "costCentre",
  initialState,
  reducers: {
    clearCostCentreError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCostCentres.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCostCentres.fulfilled, (state, action) => {
        state.loading = false;
        state.centres = action.payload;
      })
      .addCase(fetchCostCentres.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch cost centres";
      })
      .addCase(addCostCentre.pending, (state) => { state.error = null; })
      .addCase(addCostCentre.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add cost centre";
      })
      .addCase(updateCostCentre.pending, (state) => { state.error = null; })
      .addCase(updateCostCentre.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update cost centre";
      })
      .addCase(deleteCostCentre.pending, (state) => { state.error = null; })
      .addCase(deleteCostCentre.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete cost centre";
      });
  },
});

export const { clearCostCentreError } = costCentreSlice.actions;
export default costCentreSlice.reducer;
