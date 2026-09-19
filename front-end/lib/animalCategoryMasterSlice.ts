import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface AnimalCategoryGridData {
  id?: string | number;
  ANIMAL_CATEGORY_ID?: number;
  ANIMAL_CATEGORY_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface AnimalCategoryState {
  items: AnimalCategoryGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: AnimalCategoryState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchItems = createAsyncThunk(
  "animalCategoryMaster/fetchItems",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/animal-category-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/animal-category-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch animal categories");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.ANIMAL_CATEGORY_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch animal categories");
    }
  }
);

export const addItem = createAsyncThunk(
  "animalCategoryMaster/addItem",
  async (item: AnimalCategoryGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/animal-category-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add animal category");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add animal category");
    }
  }
);

export const updateItem = createAsyncThunk(
  "animalCategoryMaster/updateItem",
  async (item: AnimalCategoryGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, ANIMAL_CATEGORY_ID: Number(item.id) || item.ANIMAL_CATEGORY_ID };
      const response = await fetch(`${API_URL}/animal-category-master/${payload.ANIMAL_CATEGORY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update animal category");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update animal category");
    }
  }
);

export const deleteItem = createAsyncThunk(
  "animalCategoryMaster/deleteItem",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/animal-category-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete animal category");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete animal category");
    }
  }
);

const animalCategoryMasterSlice = createSlice({
  name: "animalCategoryMaster",
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

export const { clearError } = animalCategoryMasterSlice.actions;
export default animalCategoryMasterSlice.reducer;