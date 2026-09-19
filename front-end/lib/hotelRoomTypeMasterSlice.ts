import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface HotelRoomTypeGridData {
  id?: string | number;
  ROOM_TYPE_ID?: number;
  ROOM_TYPE_NAME?: string;
  DESCRIPTION?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface HotelRoomTypeState {
  items: HotelRoomTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: HotelRoomTypeState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchItems = createAsyncThunk(
  "hotelRoomTypeMaster/fetchItems",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/hotel-room-type-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/hotel-room-type-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch hotel room types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.ROOM_TYPE_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch hotel room types");
    }
  }
);

export const addItem = createAsyncThunk(
  "hotelRoomTypeMaster/addItem",
  async (item: HotelRoomTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/hotel-room-type-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add hotel room type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add hotel room type");
    }
  }
);

export const updateItem = createAsyncThunk(
  "hotelRoomTypeMaster/updateItem",
  async (item: HotelRoomTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, ROOM_TYPE_ID: Number(item.id) || item.ROOM_TYPE_ID };
      const response = await fetch(`${API_URL}/hotel-room-type-master/${payload.ROOM_TYPE_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update hotel room type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update hotel room type");
    }
  }
);

export const deleteItem = createAsyncThunk(
  "hotelRoomTypeMaster/deleteItem",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/hotel-room-type-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete hotel room type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete hotel room type");
    }
  }
);

const hotelRoomTypeMasterSlice = createSlice({
  name: "hotelRoomTypeMaster",
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

export const { clearError } = hotelRoomTypeMasterSlice.actions;
export default hotelRoomTypeMasterSlice.reducer;