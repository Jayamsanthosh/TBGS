import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface VatPercentageSettingGridData {
  id?: string | number;
  SNO?: number;
  VAT_PERCENTAGE?: number;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface VatPercentageSettingState {
  records: VatPercentageSettingGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: VatPercentageSettingState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchVatPercentageSettings = createAsyncThunk(
  "vatPercentageSetting/fetchAll",
  async (status: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/vat-percentage-setting?status=${status}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch VAT settings");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch VAT settings");
    }
  }
);

export const fetchVatPercentageSettingById = createAsyncThunk(
  "vatPercentageSetting/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/vat-percentage-setting/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch VAT setting");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch VAT setting");
    }
  }
);

export const addVatPercentageSetting = createAsyncThunk(
  "vatPercentageSetting/add",
  async (item: any, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/vat-percentage-setting`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add VAT setting");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add VAT setting");
    }
  }
);

export const updateVatPercentageSetting = createAsyncThunk(
  "vatPercentageSetting/update",
  async (item: any, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/vat-percentage-setting/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update VAT setting");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update VAT setting");
    }
  }
);

export const deleteVatPercentageSetting = createAsyncThunk(
  "vatPercentageSetting/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/vat-percentage-setting/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER: "Admin", ROLE: "Admin", MAC_ADDRESS: "WEB" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete VAT setting");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete VAT setting");
    }
  }
);

const vatPercentageSettingSlice = createSlice({
  name: "vatPercentageSetting",
  initialState,
  reducers: {
    clearVatPercentageSettingError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVatPercentageSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVatPercentageSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchVatPercentageSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch VAT settings";
      })
      .addCase(addVatPercentageSetting.pending, (state) => { state.error = null; })
      .addCase(addVatPercentageSetting.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add VAT setting";
      })
      .addCase(updateVatPercentageSetting.pending, (state) => { state.error = null; })
      .addCase(updateVatPercentageSetting.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update VAT setting";
      })
      .addCase(deleteVatPercentageSetting.pending, (state) => { state.error = null; })
      .addCase(deleteVatPercentageSetting.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete VAT setting";
      });
  },
});

export const { clearVatPercentageSettingError } = vatPercentageSettingSlice.actions;
export default vatPercentageSettingSlice.reducer;
