import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AnimalHuntingChargesMasterGridData {
  id?: string | number;
  ANIMAL_HUNT_CHARGE_ID?: number;
  SNO?: number;
  COMPANY_ID?: number;
  EFFECTIVE_YEAR?: string;
  ISSUING_AUTHORITY?: string;
  APPROVAL_REFERENCE_NO?: string;
  APPROVAL_DATE?: string;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  CURRENCY_ID?: number;
  ANIMAL_ID?: number;
  GOVT_RATE?: number;
  ACTUAL_AMOUNT?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  REMARKS_HDR?: string;
  STATUS_HDR?: string;
  REMARKS_DTL?: string;
  STATUS_DTL?: string;
  COMPANY_NAME?: string;
  CURRENCY_NAME?: string;
  ANIMAL_NAME?: string;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: any[];
  deletedIds?: number[];
}

interface AnimalHuntingChargesMasterState {
  items: AnimalHuntingChargesMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: AnimalHuntingChargesMasterState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchAnimalHuntingChargesMaster = createAsyncThunk(
  "animalHuntingChargesMaster/fetchAnimalHuntingChargesMaster",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/animal-hunting-charges-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch animal hunting charges data");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch animal hunting charges data");
    }
  }
);

export const fetchAnimalHuntingChargesHdr = createAsyncThunk(
  "animalHuntingChargesMaster/fetchAnimalHuntingChargesHdr",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/animal-hunting-charges-master/hdr/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch hunting charge header");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch hunting charge header");
    }
  }
);

export const fetchAnimalHuntingChargesDtl = createAsyncThunk(
  "animalHuntingChargesMaster/fetchAnimalHuntingChargesDtl",
  async (sno: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/animal-hunting-charges-master/dtl/${sno}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch hunting charge detail");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch hunting charge detail");
    }
  }
);

export const addAnimalHuntingChargesMaster = createAsyncThunk(
  "animalHuntingChargesMaster/addAnimalHuntingChargesMaster",
  async (item: AnimalHuntingChargesMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/animal-hunting-charges-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add animal hunting charges");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add animal hunting charges");
    }
  }
);

export const updateAnimalHuntingChargesMaster = createAsyncThunk(
  "animalHuntingChargesMaster/updateAnimalHuntingChargesMaster",
  async (item: AnimalHuntingChargesMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/animal-hunting-charges-master/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update animal hunting charges");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update animal hunting charges");
    }
  }
);

export const deleteAnimalHuntingChargesMaster = createAsyncThunk(
  "animalHuntingChargesMaster/deleteAnimalHuntingChargesMaster",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/animal-hunting-charges-master/dtl/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER: "Admin", ROLE: "Admin", MAC_ADDRESS: "WEB" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete animal hunting charges");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete animal hunting charges");
    }
  }
);

const animalHuntingChargesMasterCombinedSlice = createSlice({
  name: "animalHuntingChargesMaster",
  initialState,
  reducers: {
    clearAnimalHuntingChargesMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnimalHuntingChargesMaster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnimalHuntingChargesMaster.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchAnimalHuntingChargesMaster.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch animal hunting charges data";
      })
      .addCase(addAnimalHuntingChargesMaster.pending, (state) => { state.error = null; })
      .addCase(addAnimalHuntingChargesMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add animal hunting charges";
      })
      .addCase(updateAnimalHuntingChargesMaster.pending, (state) => { state.error = null; })
      .addCase(updateAnimalHuntingChargesMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update animal hunting charges";
      })
      .addCase(deleteAnimalHuntingChargesMaster.pending, (state) => { state.error = null; })
      .addCase(deleteAnimalHuntingChargesMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete animal hunting charges";
      });
  },
});

export const { clearAnimalHuntingChargesMasterError } = animalHuntingChargesMasterCombinedSlice.actions;
export default animalHuntingChargesMasterCombinedSlice.reducer;
