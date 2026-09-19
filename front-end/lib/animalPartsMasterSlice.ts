import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AnimalPartsGridData {
  id?: string | number;
  ANIMAL_PARTS_ID?: number;
  ANIMAL_PARTS_NAME?: string;
  ANIMAL_PARTS_DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface AnimalPartsState {
  items: AnimalPartsGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: AnimalPartsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchItems = createAsyncThunk(
  "animalPartsMaster/fetchItems",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/animal-parts-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/animal-parts-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch animal parts");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.ANIMAL_PARTS_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch animal parts");
    }
  }
);

export const addItem = createAsyncThunk(
  "animalPartsMaster/addItem",
  async (item: AnimalPartsGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/animal-parts-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add animal parts");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add animal parts");
    }
  }
);

export const updateItem = createAsyncThunk(
  "animalPartsMaster/updateItem",
  async (item: AnimalPartsGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, ANIMAL_PARTS_ID: Number(item.id) || item.ANIMAL_PARTS_ID };
      const response = await fetch(`${API_URL}/animal-parts-master/${payload.ANIMAL_PARTS_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update animal parts");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update animal parts");
    }
  }
);

export const deleteItem = createAsyncThunk(
  "animalPartsMaster/deleteItem",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/animal-parts-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete animal parts");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete animal parts");
    }
  }
);

const animalPartsMasterSlice = createSlice({
  name: "animalPartsMaster",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchItems.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchItems.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchItems.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addItem.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(addItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateItem.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(updateItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(deleteItem.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteItem.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(deleteItem.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = animalPartsMasterSlice.actions;
export default animalPartsMasterSlice.reducer;
