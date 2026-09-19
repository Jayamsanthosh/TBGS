import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface DistrictGridData {
  id?: string | number;
  District_id?: number;
  District_Name?: string;
  COUNTRY_ID?: number;
  REGION_ID?: number;
  TOTAL_POPULATION?: number;
  ZONE_NAME?: string;
  DISTANCE_FROM_ARUSHA?: number;
  STATUS_MASTER?: string;
}

interface DistrictsState {
  districts: DistrictGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: DistrictsState = {
  districts: [],
  loading: false,
  error: null,
};

export const fetchDistricts = createAsyncThunk(
  "districts/fetchDistricts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/district-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch districts");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.District_id }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch districts");
    }
  }
);

export const addDistrict = createAsyncThunk(
  "districts/addDistrict",
  async (item: DistrictGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/district-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add district");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add district");
    }
  }
);

export const updateDistrict = createAsyncThunk(
  "districts/updateDistrict",
  async (item: DistrictGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, District_id: Number(item.id) || item.District_id };
      const response = await fetch(`${API_URL}/district-master/${payload.District_id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update district");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update district");
    }
  }
);

export const deleteDistrict = createAsyncThunk(
  "districts/deleteDistrict",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/district-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete district");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete district");
    }
  }
);

const districtsSlice = createSlice({
  name: "districts",
  initialState,
  reducers: {
    clearDistrictsError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchDistricts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDistricts.fulfilled, (state, action) => {
        state.loading = false;
        state.districts = action.payload;
      })
      .addCase(fetchDistricts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch districts";
      })
      .addCase(addDistrict.pending, (state) => { state.error = null; })
      .addCase(addDistrict.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add district";
      })
      .addCase(updateDistrict.pending, (state) => { state.error = null; })
      .addCase(updateDistrict.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update district";
      })
      .addCase(deleteDistrict.pending, (state) => { state.error = null; })
      .addCase(deleteDistrict.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete district";
      });
  },
});

export const { clearDistrictsError } = districtsSlice.actions;
export default districtsSlice.reducer;
