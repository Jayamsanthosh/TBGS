import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface EmployeeBenefitMasterGridData {
  id?: string | number;
  EMP_BENEFIT_REF_NO?: string;
  BENEFIT_DATE?: string;
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
  TOTAL_GROSS_AMOUNT?: number;
  PAID_STATUS?: string;
  REASON?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
  HDR_PAID_STATUS?: string;
  HDR_REASON?: string;
  HDR_REMARKS?: string;
  HDR_STATUS?: string;
  DTL_PAID_STATUS?: string;
  DTL_REASON?: string;
  DTL_REMARKS?: string;
  DTL_STATUS?: string;
  BENEFIT_TYPE_NAME?: string;
  COMPANY_NAME?: string;
  CURRENCY_NAME?: string;
  SNO?: number;
  BENEFIT_TYPE_ID?: number;
  GROSS_AMOUNT?: number;
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
  dtls?: any[];
  deletedIds?: number[];
}

interface EmployeeBenefitMasterState {
  items: EmployeeBenefitMasterGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: EmployeeBenefitMasterState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchEmployeeBenefitMaster = createAsyncThunk(
  "employeeBenefitMaster/fetchEmployeeBenefitMaster",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-benefit-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch employee benefit data");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO ?? u.EMP_BENEFIT_REF_NO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch employee benefit data");
    }
  }
);

export const fetchEmployeeBenefitHdr = createAsyncThunk(
  "employeeBenefitMaster/fetchEmployeeBenefitHdr",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-benefit-master/hdr/${encodeURIComponent(refNo)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch employee benefit header");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch employee benefit header");
    }
  }
);

export const fetchEmployeeBenefitDtl = createAsyncThunk(
  "employeeBenefitMaster/fetchEmployeeBenefitDtl",
  async (sno: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-benefit-master/dtl/${sno}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch employee benefit detail");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch employee benefit detail");
    }
  }
);

export const addEmployeeBenefitMaster = createAsyncThunk(
  "employeeBenefitMaster/addEmployeeBenefitMaster",
  async (item: EmployeeBenefitMasterGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-benefit-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add employee benefit");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add employee benefit");
    }
  }
);

export const updateEmployeeBenefitMaster = createAsyncThunk(
  "employeeBenefitMaster/updateEmployeeBenefitMaster",
  async (item: EmployeeBenefitMasterGridData, { rejectWithValue }) => {
    try {
      const refNo = item.EMP_BENEFIT_REF_NO || "";
      const response = await fetch(`${API_URL}/employee-benefit-master/${encodeURIComponent(refNo)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update employee benefit");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update employee benefit");
    }
  }
);

export const deleteEmployeeBenefitMaster = createAsyncThunk(
  "employeeBenefitMaster/deleteEmployeeBenefitMaster",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/employee-benefit-master/dtl/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER: "Admin", ROLE: "Admin", MAC_ADDRESS: "WEB" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete employee benefit");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete employee benefit");
    }
  }
);

const employeeBenefitMasterCombinedSlice = createSlice({
  name: "employeeBenefitMaster",
  initialState,
  reducers: {
    clearEmployeeBenefitMasterError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEmployeeBenefitMaster.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEmployeeBenefitMaster.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchEmployeeBenefitMaster.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch employee benefit data";
      })
      .addCase(addEmployeeBenefitMaster.pending, (state) => { state.error = null; })
      .addCase(addEmployeeBenefitMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add employee benefit";
      })
      .addCase(updateEmployeeBenefitMaster.pending, (state) => { state.error = null; })
      .addCase(updateEmployeeBenefitMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update employee benefit";
      })
      .addCase(deleteEmployeeBenefitMaster.pending, (state) => { state.error = null; })
      .addCase(deleteEmployeeBenefitMaster.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete employee benefit";
      });
  },
});

export const { clearEmployeeBenefitMasterError } = employeeBenefitMasterCombinedSlice.actions;
export default employeeBenefitMasterCombinedSlice.reducer;
