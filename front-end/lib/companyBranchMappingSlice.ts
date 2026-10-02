import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CompanyBranchMappingData {
  id?: string | number;
  MAPPING_ID?: number;
  COMPANY_ID?: number;
  COMPANY_NAME?: string;
  BRANCH_ID?: number;
  BRANCH_NAME?: string;
  STATUS_MASTER?: string;
  STATUS_CODE?: string;
  CREATED_BY?: string | null;
  CREATED_DATE?: string | null;
  CREATED_MAC_ADDRESS?: string | null;
  MODIFIED_BY?: string | null;
  MODIFIED_DATE?: string | null;
  MODIFIED_MAC_ADDRESS?: string | null;
}

interface MappingState {
  items: CompanyBranchMappingData[];
  loading: boolean;
  error: string | null;
}

const initialState: MappingState = {
  items: [],
  loading: false,
  error: null,
};

const base = `${API_URL}/company-branch-mapping`;

/** Surfaces the backend's `message` field, which carries the procedure level
 *  validation text (duplicate pair, unknown company, no delete rights, ...). */
const failMessage = async (response: Response, fallback: string): Promise<string> => {
  const data = await response.json().catch(() => null);
  return (data && (data.message || data.error)) || fallback;
};

export const fetchMappings = createAsyncThunk(
  "companyBranchMapping/fetchMappings",
  async (status: string | undefined, { rejectWithValue }) => {
    try {
      const url = status ? `${base}?status=${encodeURIComponent(status)}` : base;
      const response = await fetch(url);
      if (!response.ok) {
        return rejectWithValue(await failMessage(response, "Failed to fetch mappings"));
      }
      const json = await response.json();
      return (json.data || []) as CompanyBranchMappingData[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch mappings");
    }
  }
);

/** Filtered list used by the "already mapped" check on the form. */
export const loadMappings = createAsyncThunk(
  "companyBranchMapping/loadMappings",
  async (params: { companyId?: number; branchId?: number; status?: string }, { rejectWithValue }) => {
    try {
      const q = new URLSearchParams();
      if (params.companyId != null) q.set("companyId", String(params.companyId));
      if (params.branchId != null) q.set("branchId", String(params.branchId));
      q.set("status", params.status || "ALL");
      const response = await fetch(`${base}/load?${q.toString()}`);
      if (!response.ok) {
        return rejectWithValue(await failMessage(response, "Failed to load mappings"));
      }
      const json = await response.json();
      return (json.data || []) as CompanyBranchMappingData[];
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to load mappings");
    }
  }
);

export const addMapping = createAsyncThunk(
  "companyBranchMapping/addMapping",
  async (item: CompanyBranchMappingData, { rejectWithValue }) => {
    try {
      const response = await fetch(base, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        return rejectWithValue(await failMessage(response, "Failed to add mapping"));
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add mapping");
    }
  }
);

export const updateMapping = createAsyncThunk(
  "companyBranchMapping/updateMapping",
  async (item: CompanyBranchMappingData, { rejectWithValue }) => {
    try {
      const mappingId = Number(item.MAPPING_ID ?? item.id);
      const payload = { ...item, MAPPING_ID: mappingId };
      const response = await fetch(`${base}/${mappingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        return rejectWithValue(await failMessage(response, "Failed to update mapping"));
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update mapping");
    }
  }
);

export const deleteMapping = createAsyncThunk(
  "companyBranchMapping/deleteMapping",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${base}/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        return rejectWithValue(await failMessage(response, "Failed to delete mapping"));
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete mapping");
    }
  }
);

const mappingSlice = createSlice({
  name: "companyBranchMapping",
  initialState,
  reducers: {
    clearMappingError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMappings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMappings.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload as CompanyBranchMappingData[];
      })
      .addCase(fetchMappings.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch mappings";
      })
      .addCase(addMapping.pending, (state) => {
        state.error = null;
      })
      .addCase(addMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add mapping";
      })
      .addCase(updateMapping.pending, (state) => {
        state.error = null;
      })
      .addCase(updateMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update mapping";
      })
      .addCase(deleteMapping.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteMapping.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete mapping";
      });
  },
});

export const { clearMappingError } = mappingSlice.actions;
export default mappingSlice.reducer;
