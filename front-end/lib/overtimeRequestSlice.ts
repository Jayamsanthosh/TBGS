import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface OvertimeRequestGridData {
  id?: string | number;
  SNO?: number;
  OT_REQUEST_REF_NO?: string;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: number;

  EMP_ID?: number;
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;

  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DEPARTMENT_GROUP_ID?: number;
  DESIGNATION_GROUP_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  EMPLOYMENT_TYPE_ID?: number;
  CURRENCY_ID?: number;

  OT_FROM_DATE?: string;
  OT_TO_DATE?: string;
  OT_HOURS?: number;

  REQUEST_AMOUNT?: number;
  APPROVED_AMOUNT?: number;
  PAYMENT_REF_NO?: string;
  PAYMENT_MODE_ID?: number;
  BANK_ID?: number;
  ACCOUNT_NO?: string;
  PAID_STATUS?: string;

  REASON?: string;

  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;

  RESPONSE_1_EMP_ID?: number;
  RESPONSE_1_DATE?: string;
  RESPONSE_1_STATUS?: string;
  RESPONSE_1_REMARKS?: string;

  RESPONSE_2_EMP_ID?: number;
  RESPONSE_2_DATE?: string;
  RESPONSE_2_STATUS?: string;
  RESPONSE_2_REMARKS?: string;

  FINAL_RESPONSE_EMP_ID?: number;
  FINAL_RESPONSE_DATE?: string;
  FINAL_RESPONSE_STATUS?: string;
  FINAL_RESPONSE_REMARKS?: string;

  REMARKS?: string;
  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface OvertimeRequestState {
  items: OvertimeRequestGridData[];
  current: OvertimeRequestGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: OvertimeRequestState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchOvertimeRequests = createAsyncThunk(
  "overtimeRequest/fetchOvertimeRequests",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/overtime-request?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch overtime requests");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch overtime requests");
    }
  }
);

export const getOvertimeRequestById = createAsyncThunk(
  "overtimeRequest/getOvertimeRequestById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/overtime-request/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch overtime request");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch overtime request");
    }
  }
);

export const addOvertimeRequest = createAsyncThunk(
  "overtimeRequest/addOvertimeRequest",
  async (item: OvertimeRequestGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/overtime-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add overtime request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add overtime request");
    }
  }
);

export const updateOvertimeRequest = createAsyncThunk(
  "overtimeRequest/updateOvertimeRequest",
  async (item: OvertimeRequestGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const payload = {
        ...item,
        SNO: Number(item.id) || item.SNO,
        ROLE: authUser?.role || authUser?.ROLE || "Admin",
      };
      const response = await fetch(`${API_URL}/overtime-request/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update overtime request");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update overtime request");
    }
  }
);

export const deleteOvertimeRequest = createAsyncThunk(
  "overtimeRequest/deleteOvertimeRequest",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/overtime-request/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete overtime request");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete overtime request");
    }
  }
);

const overtimeRequestSlice = createSlice({
  name: "overtimeRequest",
  initialState,
  reducers: {
    clearOvertimeRequestError(state) {
      state.error = null;
    },
    clearCurrentOvertimeRequest(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOvertimeRequests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOvertimeRequests.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOvertimeRequests.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch overtime requests";
      })
      .addCase(getOvertimeRequestById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getOvertimeRequestById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getOvertimeRequestById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch overtime request";
      })
      .addCase(addOvertimeRequest.pending, (state) => { state.error = null; })
      .addCase(addOvertimeRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add overtime request";
      })
      .addCase(updateOvertimeRequest.pending, (state) => { state.error = null; })
      .addCase(updateOvertimeRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update overtime request";
      })
      .addCase(deleteOvertimeRequest.pending, (state) => { state.error = null; })
      .addCase(deleteOvertimeRequest.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete overtime request";
      });
  },
});

export const { clearOvertimeRequestError, clearCurrentOvertimeRequest } = overtimeRequestSlice.actions;
export default overtimeRequestSlice.reducer;
