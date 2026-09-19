import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PermitAuthorityGridData {
  id?: string | number;
  PERMIT_AUTHORITY_ID?: number;
  PERMIT_AUTHORITY_NAME: string;
  COUNTRY_ID?: number;
  COUNTRY_NAME?: string;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  EMAIL?: string;
  WEBSITE?: string;
  ADDRESS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface PermitAuthoritiesState {
  items: PermitAuthorityGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: PermitAuthoritiesState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchPermitAuthorities = createAsyncThunk(
  "permitAuthorities/fetchPermitAuthorities",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/permit-authority-master?status=ALL`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch permit authorities");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.PERMIT_AUTHORITY_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch permit authorities");
    }
  }
);

export const addPermitAuthority = createAsyncThunk(
  "permitAuthorities/addPermitAuthority",
  async (item: PermitAuthorityGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/permit-authority-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add permit authority");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add permit authority");
    }
  }
);

export const updatePermitAuthority = createAsyncThunk(
  "permitAuthorities/updatePermitAuthority",
  async (item: PermitAuthorityGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, PERMIT_AUTHORITY_ID: Number(item.id) || item.PERMIT_AUTHORITY_ID };
      const response = await fetch(`${API_URL}/permit-authority-master/${payload.PERMIT_AUTHORITY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update permit authority");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update permit authority");
    }
  }
);

export const deletePermitAuthority = createAsyncThunk(
  "permitAuthorities/deletePermitAuthority",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/permit-authority-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete permit authority");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete permit authority");
    }
  }
);

const permitAuthoritiesSlice = createSlice({
  name: "permitAuthorities",
  initialState,
  reducers: {
    clearPermitAuthoritiesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPermitAuthorities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPermitAuthorities.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPermitAuthorities.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch permit authorities";
      })
      .addCase(addPermitAuthority.pending, (state) => { state.error = null; })
      .addCase(addPermitAuthority.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add permit authority";
      })
      .addCase(updatePermitAuthority.pending, (state) => { state.error = null; })
      .addCase(updatePermitAuthority.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update permit authority";
      })
      .addCase(deletePermitAuthority.pending, (state) => { state.error = null; })
      .addCase(deletePermitAuthority.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete permit authority";
      });
  },
});

export const { clearPermitAuthoritiesError } = permitAuthoritiesSlice.actions;
export default permitAuthoritiesSlice.reducer;