import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface ClientAdditionalServicesGridData {
  id?: string | number;
  SERVICES_ID?: number;
  SERVICES_NAME: string;
  UOM?: string;
  UNIT_PRICE?: number;
  CURRENCY_ID?: number;
  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface ClientAdditionalServicesState {
  services: ClientAdditionalServicesGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: ClientAdditionalServicesState = {
  services: [],
  loading: false,
  error: null,
};

export const fetchClientAdditionalServices = createAsyncThunk(
  "clientAdditionalServices/fetchClientAdditionalServices",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/client-additional-services-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch client additional services");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SERVICES_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch client additional services");
    }
  }
);

export const addClientAdditionalService = createAsyncThunk(
  "clientAdditionalServices/addClientAdditionalService",
  async (item: ClientAdditionalServicesGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/client-additional-services-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add client additional service");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add client additional service");
    }
  }
);

export const updateClientAdditionalService = createAsyncThunk(
  "clientAdditionalServices/updateClientAdditionalService",
  async (item: ClientAdditionalServicesGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SERVICES_ID: Number(item.id) || item.SERVICES_ID };
      const response = await fetch(`${API_URL}/client-additional-services-master/${payload.SERVICES_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update client additional service");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update client additional service");
    }
  }
);

export const deleteClientAdditionalService = createAsyncThunk(
  "clientAdditionalServices/deleteClientAdditionalService",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/client-additional-services-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete client additional service");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete client additional service");
    }
  }
);

const clientAdditionalServicesSlice = createSlice({
  name: "clientAdditionalServices",
  initialState,
  reducers: {
    clearClientAdditionalServicesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClientAdditionalServices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClientAdditionalServices.fulfilled, (state, action) => {
        state.loading = false;
        state.services = action.payload;
      })
      .addCase(fetchClientAdditionalServices.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch client additional services";
      })
      .addCase(addClientAdditionalService.pending, (state) => { state.error = null; })
      .addCase(addClientAdditionalService.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add client additional service";
      })
      .addCase(updateClientAdditionalService.pending, (state) => { state.error = null; })
      .addCase(updateClientAdditionalService.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update client additional service";
      })
      .addCase(deleteClientAdditionalService.pending, (state) => { state.error = null; })
      .addCase(deleteClientAdditionalService.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete client additional service";
      });
  },
});

export const { clearClientAdditionalServicesError } = clientAdditionalServicesSlice.actions;
export default clientAdditionalServicesSlice.reducer;
