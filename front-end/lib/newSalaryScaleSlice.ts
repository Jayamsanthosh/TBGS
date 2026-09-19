import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface SalaryScaleGridData {
  id?: string | number;
  SALARY_SCALE_ID?: number;
  DESIGNATION_GROUP_ID?: number;
  DESIGNATION_GROUP_NAME?: string;
  SALARY_SCALE_NAME?: string;
  BASIC?: number;
  FOT?: number;
  ATTENDANCE?: number;
  ONE_1YP?: number;
  TECHNICAL?: number;
  POLYVALENT?: number;
  RESPONSIBILITY?: number;
  LOYALTY?: number;
  NIGHT_ALLOWANCE?: number;
  MISCELLANIES?: number;
  PRODUCTIVITY?: number;
  CAPACITY?: number;
  DISCIPLINARY?: number;
  HOUSE_ALLOW?: number;
  MEDICIAL?: number;
  EDUCATION?: number;
  EXTRA1?: number;
  EXTRA2?: number;
  EXTRA3?: number;
  EXTRA4?: number;
  EXTRA5?: number;
  EXTRA6?: number;
  TOTAL?: number;
  OT_NONOT?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface SalaryScaleState {
  items: SalaryScaleGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: SalaryScaleState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchItems = createAsyncThunk(
  "newSalaryScale/fetchItems",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/new-salary-scale?status=${encodeURIComponent(status)}`
        : `${API_URL}/new-salary-scale`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch salary scales");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SALARY_SCALE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch salary scales");
    }
  }
);

export const addItem = createAsyncThunk(
  "newSalaryScale/addItem",
  async (item: SalaryScaleGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/new-salary-scale`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add salary scale");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add salary scale");
    }
  }
);

export const updateItem = createAsyncThunk(
  "newSalaryScale/updateItem",
  async (item: SalaryScaleGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SALARY_SCALE_ID: Number(item.id) || item.SALARY_SCALE_ID };
      const response = await fetch(`${API_URL}/new-salary-scale/${payload.SALARY_SCALE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update salary scale");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update salary scale");
    }
  }
);

export const deleteItem = createAsyncThunk(
  "newSalaryScale/deleteItem",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/new-salary-scale/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete salary scale");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete salary scale");
    }
  }
);

const newSalaryScaleSlice = createSlice({
  name: "newSalaryScale",
  initialState,
  reducers: {
    clearError(state) {
      state.error = null;
    }
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
        state.error = (action.payload as string) || action.error.message || "Failed to fetch salary scales";
      })
      .addCase(addItem.pending, (state) => { state.error = null; })
      .addCase(addItem.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add salary scale";
      })
      .addCase(updateItem.pending, (state) => { state.error = null; })
      .addCase(updateItem.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update salary scale";
      })
      .addCase(deleteItem.pending, (state) => { state.error = null; })
      .addCase(deleteItem.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete salary scale";
      });
  },
});

export const { clearError } = newSalaryScaleSlice.actions;
export default newSalaryScaleSlice.reducer;
