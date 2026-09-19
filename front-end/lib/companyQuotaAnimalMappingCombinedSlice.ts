import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CompanyQuotaAnimalMappingDtl {
  SNO?: number;
  ANIMAL_ID?: number;
  OLD_APPROVED_QTY?: number;
  ADD_REMOVE_QTY?: number;
  NEW_APPROVED_QTY?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

export interface CompanyQuotaAnimalMappingGridData {
  id?: string | number;
  QUOTA_ID?: number;
  SNO?: number;
  COMPANY_ID?: number;
  CAMP_ID?: number;
  EFFECTIVE_YEAR?: string;
  NEW_REVISION?: string;
  OLD_QUOTA_ID?: number;
  ISSUING_AUTHORITY?: string;
  APPROVAL_REFERENCE_NO?: string;
  APPROVAL_DATE?: string;
  LAST_AMENDMENT_DATE?: string;
  EFFECTIVE_FROM?: string;
  EFFECTIVE_TO?: string;
  QUOTA_AMOUNT?: number;
  VAT_AMOUNT?: number;
  FINAL_QUOTA_AMOUNT?: number;
  CURRENCY_ID?: number;
  ANIMAL_ID?: number;
  OLD_APPROVED_QTY?: number;
  ADD_REMOVE_QTY?: number;
  NEW_APPROVED_QTY?: number;
  REMARKS?: string;
  STATUS_MASTER?: string;
  REMARKS_HDR?: string;
  STATUS_HDR?: string;
  REMARKS_DTL?: string;
  STATUS_DTL?: string;
  COMPANY_NAME?: string;
  CAMP_NAME?: string;
  CURRENCY_NAME?: string;
  ANIMAL_NAME?: string;
  REMARKS_QUOTA_HDR?: string;
  STATUS_QUOTA_HDR?: string;
  REMARKS_QUOTA_DTL?: string;
  STATUS_QUOTA_DTL?: string;
  dtls?: CompanyQuotaAnimalMappingDtl[];
  deletedIds?: number[];
  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface CompanyQuotaAnimalMappingState {
  items: CompanyQuotaAnimalMappingGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CompanyQuotaAnimalMappingState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchCompanyQuotaAnimalMapping = createAsyncThunk(
  "companyQuotaAnimalMapping/fetchCompanyQuotaAnimalMapping",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/company-quota-animal-mapping`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch company quota animal mapping data");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch company quota animal mapping data");
    }
  }
);

export const fetchCompanyQuotaHdr = createAsyncThunk(
  "companyQuotaAnimalMapping/fetchCompanyQuotaHdr",
  async (quotaId: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/company-quota-animal-mapping/hdr/${quotaId}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch quota header");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch quota header");
    }
  }
);

export const fetchCompanyQuotaDtl = createAsyncThunk(
  "companyQuotaAnimalMapping/fetchCompanyQuotaDtl",
  async (sno: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/company-quota-animal-mapping/dtl/${sno}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch quota animal detail");
      }
      const json = await response.json();
      return json.data;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch quota animal detail");
    }
  }
);

export const addCompanyQuotaAnimalMapping = createAsyncThunk(
  "companyQuotaAnimalMapping/addCompanyQuotaAnimalMapping",
  async (item: CompanyQuotaAnimalMappingGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/company-quota-animal-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add company quota animal mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add company quota animal mapping");
    }
  }
);

export const updateCompanyQuotaAnimalMapping = createAsyncThunk(
  "companyQuotaAnimalMapping/updateCompanyQuotaAnimalMapping",
  async (item: CompanyQuotaAnimalMappingGridData, { rejectWithValue }) => {
    try {
      const quotaId = item.QUOTA_ID;
      const response = await fetch(`${API_URL}/company-quota-animal-mapping/${quotaId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update company quota animal mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update company quota animal mapping");
    }
  }
);

export const deleteCompanyQuotaAnimalMapping = createAsyncThunk(
  "companyQuotaAnimalMapping/deleteCompanyQuotaAnimalMapping",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/company-quota-animal-mapping/dtl/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ USER: "Admin", ROLE: "Admin", MAC_ADDRESS: "WEB" }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete company quota animal mapping");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete company quota animal mapping");
    }
  }
);

const companyQuotaAnimalMappingCombinedSlice = createSlice({
  name: "companyQuotaAnimalMapping",
  initialState,
  reducers: {
    clearCompanyQuotaAnimalMappingError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCompanyQuotaAnimalMapping.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCompanyQuotaAnimalMapping.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCompanyQuotaAnimalMapping.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch company quota animal mapping data";
      })
      .addCase(addCompanyQuotaAnimalMapping.pending, (state) => { state.error = null; })
      .addCase(addCompanyQuotaAnimalMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add company quota animal mapping";
      })
      .addCase(updateCompanyQuotaAnimalMapping.pending, (state) => { state.error = null; })
      .addCase(updateCompanyQuotaAnimalMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update company quota animal mapping";
      })
      .addCase(deleteCompanyQuotaAnimalMapping.pending, (state) => { state.error = null; })
      .addCase(deleteCompanyQuotaAnimalMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete company quota animal mapping";
      });
  },
});

export const { clearCompanyQuotaAnimalMappingError } = companyQuotaAnimalMappingCombinedSlice.actions;
export default companyQuotaAnimalMappingCombinedSlice.reducer;
