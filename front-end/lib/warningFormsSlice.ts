import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface WarningFormGridData {
  id?: string | number;
  SNO?: number;
  WARNING_REQUEST_REF_NO?: string;
  WARNING_FORM_NO?: number;
  DATE_OF_ISSUE?: string;
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

  FINE_REQUIRED_STATUS?: string;
  FINE_AMOUNT?: number;
  DEDUCTION_FROM_DATE?: string;
  DEDUCTION_TO_DATE?: string;
  NO_OF_MONTHS?: number;
  MONTHLY_DEDUCTION_AMOUNT?: number;

  EMPLOYEE_COMMENTS?: string;
  REPORTING_MANAGER_ID?: number;
  MANAGER_COMMENTS?: string;
  COMMITTEE_MEMBER_NAME?: string;
  COMMITTEE_MEMBER_COMMENTS?: string;
  HR_MANAGER_NAME?: string;
  HR_COMMENTS?: string;
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

  REQUEST_STATUS?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface WarningFormState {
  items: WarningFormGridData[];
  current: WarningFormGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: WarningFormState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchWarningForms = createAsyncThunk(
  "warningForms/fetchWarningForms",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/warning-forms?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch warning forms");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch warning forms");
    }
  }
);

export const getWarningFormById = createAsyncThunk(
  "warningForms/getWarningFormById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/warning-forms/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch warning form");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch warning form");
    }
  }
);

export const addWarningForm = createAsyncThunk(
  "warningForms/addWarningForm",
  async (item: WarningFormGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/warning-forms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add warning form");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add warning form");
    }
  }
);

export const updateWarningForm = createAsyncThunk(
  "warningForms/updateWarningForm",
  async (item: WarningFormGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const payload = {
        ...item,
        SNO: Number(item.id) || item.SNO,
        ROLE: authUser?.role || authUser?.ROLE || "Admin",
      };
      const response = await fetch(`${API_URL}/warning-forms/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update warning form");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update warning form");
    }
  }
);

export const deleteWarningForm = createAsyncThunk(
  "warningForms/deleteWarningForm",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/warning-forms/${encodeURIComponent(String(id))}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete warning form");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete warning form");
    }
  }
);

const warningFormsSlice = createSlice({
  name: "warningForms",
  initialState,
  reducers: {
    clearWarningFormsError(state) {
      state.error = null;
    },
    clearCurrentWarningForm(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarningForms.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWarningForms.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWarningForms.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch warning forms";
      })
      .addCase(getWarningFormById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getWarningFormById.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getWarningFormById.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch warning form";
      })
      .addCase(addWarningForm.pending, (state) => { state.error = null; })
      .addCase(addWarningForm.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add warning form";
      })
      .addCase(updateWarningForm.pending, (state) => { state.error = null; })
      .addCase(updateWarningForm.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update warning form";
      })
      .addCase(deleteWarningForm.pending, (state) => { state.error = null; })
      .addCase(deleteWarningForm.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete warning form";
      });
  },
});

export const { clearWarningFormsError, clearCurrentWarningForm } = warningFormsSlice.actions;
export default warningFormsSlice.reducer;