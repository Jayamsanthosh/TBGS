import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface EmployeeDatabaseGridData {
  id?: string | number;
  SNO?: number;
  EMP_ID?: number;
  INT_TITLES?: string;
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;
  DATE_OF_BIRTH?: string;
  AGE?: string;
  GENDER?: string;
  TRIAL_PERIOD_VALID_FROM?: string;
  TRIAL_PERIOD_VALID_TO?: string;
  DATE_OF_JOINING?: string;
  RELAVANT_EXPERIENCE?: string;
  MARITAL_STATUS?: string;
  BLOOD_GROUP_ID?: number;
  EMPLOYEE_SKILL_STATUS?: string;
  COMPANY_ID?: number;
  DEPARTMENT_ID?: number;
  DESIGNATION_ID?: number;
  DEPARTMENT_GROUP_ID?: number;
  DESIGNATION_GROUP_ID?: number;
  CAMP_ID?: number;
  STORE_ID?: number;
  EMPLOYMENT_TYPE_ID?: number;
  SALARY_SCALE_ID?: number;
  BASIC_SALARY?: number;
  GROSS?: number;
  CURRENCY_ID?: number;
  COUNTRY_ID?: number;
  REGION_ID?: number;
  DISTRICT_ID?: number;
  LOCATION_ID?: number;
  ADDRESS_STREET?: string;
  PAYMENT_MODE_ID?: number;
  BANK_ID?: number;
  ACCOUNT_NO?: string;
  EMP_PH_NO?: string;
  EMP_MAILID?: string;
  APPROVED_BY?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface EmployeeDatabaseState {
  employees: EmployeeDatabaseGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeDatabaseState = {
  employees: [],
  loading: false,
  error: null,
};

export const fetchEmployees = createAsyncThunk(
  "employeeDatabase/fetchEmployees",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status
        ? `${API_URL}/employee-database?status=${encodeURIComponent(status)}`
        : `${API_URL}/employee-database`;
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch employees");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.EMP_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch employees");
    }
  }
);

export const fetchEmployeeById = createAsyncThunk(
  "employeeDatabase/fetchEmployeeById",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-database/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch employee");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch employee");
    }
  }
);

export const addEmployee = createAsyncThunk(
  "employeeDatabase/addEmployee",
  async (item: EmployeeDatabaseGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-database`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add employee");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add employee");
    }
  }
);

export const updateEmployee = createAsyncThunk(
  "employeeDatabase/updateEmployee",
  async (item: EmployeeDatabaseGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, SNO: Number(item.SNO) || Number(item.id) };
      const response = await fetch(`${API_URL}/employee-database/${payload.SNO}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update employee");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update employee");
    }
  }
);

export const deleteEmployee = createAsyncThunk(
  "employeeDatabase/deleteEmployee",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/employee-database/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete employee");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete employee");
    }
  }
);

const employeeDatabaseSlice = createSlice({
  name: "employeeDatabase",
  initialState,
  reducers: {
    clearEmployeeDatabaseError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployees.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployees.fulfilled, (state, action) => {
        state.loading = false;
        state.employees = action.payload;
      })
      .addCase(fetchEmployees.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch employees";
      })
      .addCase(addEmployee.pending, (state) => { state.error = null; })
      .addCase(addEmployee.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add employee";
      })
      .addCase(updateEmployee.pending, (state) => { state.error = null; })
      .addCase(updateEmployee.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update employee";
      })
      .addCase(deleteEmployee.pending, (state) => { state.error = null; })
      .addCase(deleteEmployee.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete employee";
      });
  },
});

export const { clearEmployeeDatabaseError } = employeeDatabaseSlice.actions;
export default employeeDatabaseSlice.reducer;
