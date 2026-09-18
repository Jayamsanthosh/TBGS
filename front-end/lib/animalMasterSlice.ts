import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AnimalGridData {
  id?: string | number;
  ANIMAL_ID?: number;
  ANIMAL_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface AnimalState {
  animals: AnimalGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: AnimalState = {
  animals: [],
  loading: false,
  error: null,
};

export const fetchAnimals = createAsyncThunk(
  "animal/fetchAnimals",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/animal-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch animals");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.ANIMAL_ID }));
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to fetch animals");
    }
  }
);

export const addAnimal = createAsyncThunk(
  "animal/addAnimal",
  async (item: AnimalGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/animal-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add animal");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to add animal");
    }
  }
);

export const updateAnimal = createAsyncThunk(
  "animal/updateAnimal",
  async (item: AnimalGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, ANIMAL_ID: Number(item.id) || item.ANIMAL_ID };
      const response = await fetch(`${API_URL}/animal-master/${payload.ANIMAL_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update animal");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to update animal");
    }
  }
);

export const deleteAnimal = createAsyncThunk(
  "animal/deleteAnimal",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/animal-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete animal");
      }
      return await response.json(); } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to delete animal");
    }
  }
);

const animalSlice = createSlice({
  name: "animal",
  initialState,
  reducers: {
    clearAnimalError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAnimals.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAnimals.fulfilled, (state, action) => {
        state.loading = false;
        state.animals = action.payload;
      })
      .addCase(fetchAnimals.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch animals";
      })
      .addCase(addAnimal.pending, (state) => { state.error = null; })
      .addCase(addAnimal.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add animal";
      })
      .addCase(updateAnimal.pending, (state) => { state.error = null; })
      .addCase(updateAnimal.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update animal";
      })
      .addCase(deleteAnimal.pending, (state) => { state.error = null; })
      .addCase(deleteAnimal.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete animal";
      });
  },
});

export const { clearAnimalError } = animalSlice.actions;
export default animalSlice.reducer;
