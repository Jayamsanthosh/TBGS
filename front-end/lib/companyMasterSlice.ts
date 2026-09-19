import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CompanyGridData {
  id?: string | number;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  COMPANY_FULL_NAME?: string;
  TIN_NUMBER?: string;
  VRN_NUMBER?: string;
  ADDRESS?: string;
  CONTACT_PERSON?: string;
  CONTACT_NUMBER?: string;
  EMAIL?: string;
  SHORT_CODE?: string;
  FINANCE_START_MONTH?: string;
  FINANCE_END_MONTH?: string;
  YEAR_CODE?: string;
  DEFAULT_CURRENCY_ID?: number;
  TIMEZONE?: string;
  NO_OF_USER?: number;
  WEBSITE?: string;
  COMP_BIG_LOGO?: string | null;
  COMP_SMALL_LOGO?: string | null;
  COMP_LETTER_HEAD?: string | null;
  COMP_STAMP_LOGO?: string | null;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface CompanyState {
  companies: CompanyGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CompanyState = {
  companies: [],
  loading: false,
  error: null,
};

export const fetchCompanies = createAsyncThunk(
  "company/fetchCompanies",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/company-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to fetch companies");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.COMPANY_ID }));
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to fetch companies");
    }
  }
);

export const addCompany = createAsyncThunk(
  "company/addCompany",
  async (item: CompanyGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/company-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to add company");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to add company");
    }
  }
);

export const updateCompany = createAsyncThunk(
  "company/updateCompany",
  async (item: CompanyGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, COMPANY_ID: Number(item.id) || item.COMPANY_ID };
      const response = await fetch(`${API_URL}/company-master/${payload.COMPANY_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to update company");
      }
      return await response.json();
    } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to update company");
    }
  }
);

export const deleteCompany = createAsyncThunk(
  "company/deleteCompany",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/company-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to delete company");
      }
      return await response.json(); } catch (error: any) {
      if (error?.name === "AbortError") throw error;
      return rejectWithValue(error?.message || "Failed to delete company");
    }
  }
);

const companySlice = createSlice({
  name: "company",
  initialState,
  reducers: {
    clearCompanyError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch companies";
      })
      .addCase(addCompany.pending, (state) => { state.error = null; })
      .addCase(addCompany.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add company";
      })
      .addCase(updateCompany.pending, (state) => { state.error = null; })
      .addCase(updateCompany.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update company";
      })
      .addCase(deleteCompany.pending, (state) => { state.error = null; })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete company";
      });
  },
});

export const { clearCompanyError } = companySlice.actions;
export default companySlice.reducer;
