import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface LicensePermitTypeGridData {
  id?: string | number;
  LICENSE_PERMIT_ID?: number;
  LICENSE_PERMIT_NAME: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface LicensePermitTypesState {
  items: LicensePermitTypeGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: LicensePermitTypesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchLicensePermitTypes = createAsyncThunk(
  "licensePermitTypes/fetchLicensePermitTypes",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/license-permit-type`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch license permit types");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.LICENSE_PERMIT_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch license permit types");
    }
  }
);

export const addLicensePermitType = createAsyncThunk(
  "licensePermitTypes/addLicensePermitType",
  async (item: LicensePermitTypeGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/license-permit-type`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add license permit type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add license permit type");
    }
  }
);

export const updateLicensePermitType = createAsyncThunk(
  "licensePermitTypes/updateLicensePermitType",
  async (item: LicensePermitTypeGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, LICENSE_PERMIT_ID: Number(item.id) || item.LICENSE_PERMIT_ID };
      const response = await fetch(`${API_URL}/license-permit-type/${payload.LICENSE_PERMIT_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update license permit type");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update license permit type");
    }
  }
);

export const deleteLicensePermitType = createAsyncThunk(
  "licensePermitTypes/deleteLicensePermitType",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/license-permit-type/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete license permit type");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete license permit type");
    }
  }
);

const licensePermitTypesSlice = createSlice({
  name: "licensePermitTypes",
  initialState,
  reducers: {
    clearLicensePermitTypesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLicensePermitTypes.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchLicensePermitTypes.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchLicensePermitTypes.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch license permit types";
      })
      .addCase(addLicensePermitType.pending, (state) => { state.error = null; })
      .addCase(addLicensePermitType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add license permit type";
      })
      .addCase(updateLicensePermitType.pending, (state) => { state.error = null; })
      .addCase(updateLicensePermitType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update license permit type";
      })
      .addCase(deleteLicensePermitType.pending, (state) => { state.error = null; })
      .addCase(deleteLicensePermitType.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete license permit type";
      });
  },
});

export const { clearLicensePermitTypesError } = licensePermitTypesSlice.actions;
export default licensePermitTypesSlice.reducer;
