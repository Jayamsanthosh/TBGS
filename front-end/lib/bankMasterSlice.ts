import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BankMasterGridData {
  id?: string | number;
  BANK_ID?: number;
  BANK_NAME?: string;
  ADDRESS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BankMasterState {
  banks: BankMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BankMasterState = {
  banks: [],
  loading: false,
  error: null,
};

export const fetchBanks = createAsyncThunk(
  "bankMaster/fetchBanks",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/bank-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/bank-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch banks");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BANK_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch banks");
    }
  }
);

export const addBank = createAsyncThunk(
  "bankMaster/addBank",
  async (item: BankMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/bank-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add bank");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add bank");
    }
  }
);

export const updateBank = createAsyncThunk(
  "bankMaster/updateBank",
  async (item: BankMasterGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BANK_ID: Number(item.id) || item.BANK_ID };
      const response = await fetch(`${API_URL}/bank-master/${payload.BANK_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update bank");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update bank");
    }
  }
);

export const deleteBank = createAsyncThunk(
  "bankMaster/deleteBank",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/bank-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete bank");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete bank");
    }
  }
);

const bankMasterSlice = createSlice({
  name: "bankMaster",
  initialState,
  reducers: {
    clearBankMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBanks.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBanks.fulfilled, (state, action) => {
        state.loading = false;
        state.banks = action.payload;
      })
      .addCase(fetchBanks.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch banks";
      })
      .addCase(addBank.pending, (state) => { state.error = null; })
      .addCase(addBank.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add bank";
      })
      .addCase(updateBank.pending, (state) => { state.error = null; })
      .addCase(updateBank.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update bank";
      })
      .addCase(deleteBank.pending, (state) => { state.error = null; })
      .addCase(deleteBank.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete bank";
      });
  },
});

export const { clearBankMasterError } = bankMasterSlice.actions;
export default bankMasterSlice.reducer;
