import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CompanyBankAccountGridData {
  id?: string | number;
  ACCOUNT_ID?: number;
  COMPANY_NAME?: string;
  BANK_NAME?: string;
  ACCOUNT_NAME?: string;
  ACCOUNT_NUMBER?: string;
  CURRENCY_NAME?: string;
  SWIFT_CODE?: string;
  BRANCH_ADDRESS?: string;
  BANK_BRANCH_NAME?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  COMPANY_ID?: number;
  BANK_ID?: number;
  CURRENCY_ID?: number;
}

interface CompanyBankAccountState {
  accounts: CompanyBankAccountGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CompanyBankAccountState = {
  accounts: [],
  loading: false,
  error: null,
};

export const fetchCompanyBankAccounts = createAsyncThunk(
  "companyBankAccount/fetchCompanyBankAccounts",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/company-bank-account-master?status=${encodeURIComponent(status)}`
        : `${API_URL}/company-bank-account-master`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch accounts");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.ACCOUNT_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch accounts");
    }
  }
);

export const addCompanyBankAccount = createAsyncThunk(
  "companyBankAccount/addCompanyBankAccount",
  async (item: CompanyBankAccountGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/company-bank-account-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add account");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add account");
    }
  }
);

export const updateCompanyBankAccount = createAsyncThunk(
  "companyBankAccount/updateCompanyBankAccount",
  async (item: CompanyBankAccountGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, ACCOUNT_ID: Number(item.id) || item.ACCOUNT_ID };
      const response = await fetch(`${API_URL}/company-bank-account-master/${payload.ACCOUNT_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update account");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update account");
    }
  }
);

export const deleteCompanyBankAccount = createAsyncThunk(
  "companyBankAccount/deleteCompanyBankAccount",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/company-bank-account-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete account");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete account");
    }
  }
);

const companyBankAccountSlice = createSlice({
  name: "companyBankAccount",
  initialState,
  reducers: {
    clearCompanyBankAccountError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyBankAccounts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyBankAccounts.fulfilled, (state, action) => {
        state.loading = false;
        state.accounts = action.payload;
      })
      .addCase(fetchCompanyBankAccounts.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch accounts";
      })
      .addCase(addCompanyBankAccount.pending, (state) => { state.error = null; })
      .addCase(addCompanyBankAccount.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add account";
      })
      .addCase(updateCompanyBankAccount.pending, (state) => { state.error = null; })
      .addCase(updateCompanyBankAccount.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update account";
      })
      .addCase(deleteCompanyBankAccount.pending, (state) => { state.error = null; })
      .addCase(deleteCompanyBankAccount.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete account";
      });
  },
});

export const { clearCompanyBankAccountError } = companyBankAccountSlice.actions;
export default companyBankAccountSlice.reducer;
