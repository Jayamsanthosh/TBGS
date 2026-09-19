import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface BusinessPartnerGridData {
  id?: string | number;
  BP_ID?: number;
  BP_TYPE?: string;
  BP_NAME?: string;
  BP_SHORT_CODE?: string;
  TIN_NUMBER?: string;
  VAT_NUMBER?: string;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  ADDRESS?: string;
  EMAIL_ADDRESS?: string;
  PHONE_NUMBER_2?: string;
  COUNTRY_ID?: number;
  COUNTRY_NAME?: string;
  REGION_ID?: number;
  REGION_NAME?: string;
  DISTRICT_ID?: number;
  DISTRICT_NAME?: string;
  LOCATION?: string;
  NATURE_OF_BUSINESS?: string;
  CREDIT_ALLOWED?: string;
  COMPANY_HEAD_CONTACT_PERSON?: string;
  COMPANY_HEAD_PHONE_NO?: string;
  COMPANY_HEAD_EMAIL?: string;
  ACCOUNTS_CONTACT_PERSON?: string;
  ACCOUNTS_PHONE_NO?: string;
  ACCOUNTS_EMAIL?: string;
  CURRENCY_ID?: number;
  CURRENCY_NAME?: string;
  PAYMENT_TERMS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface BusinessPartnerState {
  businessPartners: BusinessPartnerGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: BusinessPartnerState = {
  businessPartners: [],
  loading: false,
  error: null,
};

export const fetchBusinessPartners = createAsyncThunk(
  "businessPartner/fetchBusinessPartners",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/business-partner-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch business partners");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.BP_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch business partners");
    }
  }
);

export const addBusinessPartner = createAsyncThunk(
  "businessPartner/addBusinessPartner",
  async (item: BusinessPartnerGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/business-partner-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add business partner");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add business partner");
    }
  }
);

export const updateBusinessPartner = createAsyncThunk(
  "businessPartner/updateBusinessPartner",
  async (item: BusinessPartnerGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, BP_ID: Number(item.id) || item.BP_ID };
      const response = await fetch(`${API_URL}/business-partner-master/${payload.BP_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update business partner");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update business partner");
    }
  }
);

export const deleteBusinessPartner = createAsyncThunk(
  "businessPartner/deleteBusinessPartner",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/business-partner-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete business partner");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete business partner");
    }
  }
);

const businessPartnerSlice = createSlice({
  name: "businessPartner",
  initialState,
  reducers: {
    clearBusinessPartnerError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBusinessPartners.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchBusinessPartners.fulfilled, (state, action) => {
        state.loading = false;
        state.businessPartners = action.payload;
      })
      .addCase(fetchBusinessPartners.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch business partners";
      })
      .addCase(addBusinessPartner.pending, (state) => { state.error = null; })
      .addCase(addBusinessPartner.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add business partner";
      })
      .addCase(updateBusinessPartner.pending, (state) => { state.error = null; })
      .addCase(updateBusinessPartner.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update business partner";
      })
      .addCase(deleteBusinessPartner.pending, (state) => { state.error = null; })
      .addCase(deleteBusinessPartner.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete business partner";
      });
  },
});

export const { clearBusinessPartnerError } = businessPartnerSlice.actions;
export default businessPartnerSlice.reducer;
