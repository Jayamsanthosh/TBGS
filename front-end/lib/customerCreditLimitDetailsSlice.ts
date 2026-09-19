import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CustomerCreditLimitGridData {
  id?: string | number;
  SNO?: number;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  BP_ID?: number;
  CREDIT_LIMIT_DAYS?: number;
  CREDIT_LIMIT_AMOUNT?: number;
  PAYMENT_MODE_ID?: number;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  VALID_TYPE?: string;
  CURRENCY_ID?: number;
  EXPECTED_NEXT_PAYMENT_DATE?: string;
  EXPECTED_NEXT_PAYMENT_AMOUNT?: number;
  REQUEST_FOR?: string;
  SINGLE_INVOICE_REQUEST_AMOUNT?: number;
  CREDIT_LIMIT_BUFFER_DAYS?: number;
  TOTAL_OUTSTANDING_AMOUNT?: number;
  OVER_DUE_OUTSTANDING_AMOUNT?: number;
  REQUESTED_BY?: string;
  REQUESTED_DATE?: string;
  SECTION_HEAD_RESPONSE_PERSON?: string;
  SECTION_HEAD_RESPONSE_DATE?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;
  RESPONSE_1_PERSON?: string;
  RESPONSE_1_DATE?: string;
  RESPONSE_1_STATUS?: string;
  RESPONSE_1_REMARKS?: string;
  RESPONSE_2_PERSON?: string;
  RESPONSE_2_DATE?: string;
  RESPONSE_2_STATUS?: string;
  RESPONSE_2_REMARKS?: string;
  FINAL_RESPONSE_PERSON?: string;
  FINAL_RESPONSE_DATE?: string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface CustomerCreditLimitState {
  items: CustomerCreditLimitGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CustomerCreditLimitState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCustomerCreditLimits = createAsyncThunk(
  "customerCreditLimit/fetchCustomerCreditLimits",
  async (params: { companyId: string | number; status?: string }, { rejectWithValue }) => {
    try {
      const status = params.status || "ALL";
      const response = await fetch(
        `${API_URL}/customer-credit-limit-details?companyId=${encodeURIComponent(String(params.companyId))}&status=${encodeURIComponent(status)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch customer credit limit details");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch customer credit limit details");
    }
  }
);

export const getCustomerCreditLimitById = createAsyncThunk(
  "customerCreditLimit/getCustomerCreditLimitById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customer-credit-limit-details/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch customer credit limit details");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch customer credit limit details");
    }
  }
);

export const addCustomerCreditLimit = createAsyncThunk(
  "customerCreditLimit/addCustomerCreditLimit",
  async (item: CustomerCreditLimitGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/customer-credit-limit-details`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add customer credit limit details");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add customer credit limit details");
    }
  }
);

export const updateCustomerCreditLimit = createAsyncThunk(
  "customerCreditLimit/updateCustomerCreditLimit",
  async (item: CustomerCreditLimitGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.id) || item.SNO };
      const response = await fetch(`${API_URL}/customer-credit-limit-details/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update customer credit limit details");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update customer credit limit details");
    }
  }
);

export const deleteCustomerCreditLimit = createAsyncThunk(
  "customerCreditLimit/deleteCustomerCreditLimit",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/customer-credit-limit-details/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete customer credit limit details");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete customer credit limit details");
    }
  }
);

const customerCreditLimitSlice = createSlice({
  name: "customerCreditLimit",
  initialState,
  reducers: {
    clearCustomerCreditLimitError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCustomerCreditLimits.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomerCreditLimits.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCustomerCreditLimits.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch customer credit limit details";
      })
      .addCase(addCustomerCreditLimit.pending, (state) => { state.error = null; })
      .addCase(addCustomerCreditLimit.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add customer credit limit details";
      })
      .addCase(updateCustomerCreditLimit.pending, (state) => { state.error = null; })
      .addCase(updateCustomerCreditLimit.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update customer credit limit details";
      })
      .addCase(deleteCustomerCreditLimit.pending, (state) => { state.error = null; })
      .addCase(deleteCustomerCreditLimit.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete customer credit limit details";
      });
  },
});

export const { clearCustomerCreditLimitError } = customerCreditLimitSlice.actions;
export default customerCreditLimitSlice.reducer;
