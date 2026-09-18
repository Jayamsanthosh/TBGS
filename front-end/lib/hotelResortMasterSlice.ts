import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface HotelResortMasterGridData {
  id?: string | number;
  HOTEL_ID?: number;
  HOTEL_TYPE?: string;
  HOTEL_NAME?: string;
  HOTEL_STAR?: string;
  COUNTRY_ID?: number;
  Country_Name?: string;
  REGION_ID?: number;
  REGION_NAME?: string;
  DISTRICT_ID?: number;
  District_Name?: string;
  LOCATION_NAME?: string;
  HOTEL_ADDRESS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface HotelResortMasterState {
  records: HotelResortMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: HotelResortMasterState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchHotelResortMasters = createAsyncThunk(
  "hotelResortMaster/fetchAll",
  async (status: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/hotel-resort-master?status=${status}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch hotels");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.HOTEL_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch hotels");
    }
  }
);

export const fetchHotelResortMasterById = createAsyncThunk(
  "hotelResortMaster/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/hotel-resort-master/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch hotel");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch hotel");
    }
  }
);

export const addHotelResortMaster = createAsyncThunk(
  "hotelResortMaster/add",
  async (item: any, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/hotel-resort-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add hotel");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add hotel");
    }
  }
);

export const updateHotelResortMaster = createAsyncThunk(
  "hotelResortMaster/update",
  async (item: any, { rejectWithValue }) => {
    try {
      const payload = { ...item, HOTEL_ID: Number(item.id) || item.HOTEL_ID };
      const response = await fetch(`${API_URL}/hotel-resort-master/${payload.HOTEL_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update hotel");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update hotel");
    }
  }
);

export const deleteHotelResortMaster = createAsyncThunk(
  "hotelResortMaster/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/hotel-resort-master/${id}?USER=Admin&ROLE=Admin&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete hotel");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete hotel");
    }
  }
);

const hotelResortMasterSlice = createSlice({
  name: "hotelResortMaster",
  initialState,
  reducers: {
    clearHotelResortMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHotelResortMasters.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchHotelResortMasters.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchHotelResortMasters.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch hotels";
      })
      .addCase(addHotelResortMaster.pending, (state) => { state.error = null; })
      .addCase(addHotelResortMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add hotel";
      })
      .addCase(updateHotelResortMaster.pending, (state) => { state.error = null; })
      .addCase(updateHotelResortMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update hotel";
      })
      .addCase(deleteHotelResortMaster.pending, (state) => { state.error = null; })
      .addCase(deleteHotelResortMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete hotel";
      });
  },
});

export const { clearHotelResortMasterError } = hotelResortMasterSlice.actions;
export default hotelResortMasterSlice.reducer;
