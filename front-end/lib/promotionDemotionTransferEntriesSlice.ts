import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface PromotionDemotionTransferEntriesGridData {
  id?: string | number;
  SNO?: number;
  TRANSFER_REQUEST_REF_NO?: string;
  MONTH_ENTERED?: string;
  YEAR_ENTERED?: number;
  TRANSFER_TYPE?: string;
  EMP_ID?: number;
  FIRST_NAME?: string;
  MIDDLE_NAME?: string;
  LAST_NAME?: string;
  EMPLOYMENT_TYPE_ID?: number;
  CURRENCY_ID?: number;

  OLD_COMPANY_ID?: number;
  OLD_DEPARTMENT_ID?: number;
  OLD_DESIGNATION_ID?: number;
  OLD_DEPARTMENT_GROUP_ID?: number;
  OLD_DESIGNATION_GROUP_ID?: number;
  OLD_CAMP_ID?: number;
  OLD_STORE_ID?: number;
  OLD_SALARY_SCALE_ID?: number;
  OLD_BASIC_SALARY?: number;
  OLD_FOT_ALLOWANCE?: number;
  OLD_ATTENDANCE_ALLOWANCE?: number;
  OLD_ONE_1YP_ALLOWANCE?: number;
  OLD_TECHNICAL?: number;
  OLD_POLYVALENT?: number;
  OLD_RESPONSIBILITY?: number;
  OLD_LOYALTY?: number;
  OLD_PRODUCTIVITY?: number;
  OLD_CAPACITY?: number;
  OLD_DISCIPLINARY?: number;
  OLD_HOUSE_ALLOW?: number;
  OLD_MEDICIAL?: number;
  OLD_EDUCATION?: number;
  OLD_MISCELLANIES?: number;
  OLD_NIGHT_ALLOWANCE?: number;
  OLD_EXTRA1?: number;
  OLD_EXTRA2?: number;
  OLD_EXTRA3?: number;
  OLD_EXTRA4?: number;
  OLD_EXTRA5?: number;
  OLD_EXTRA6?: number;
  OLD_GROSS_AMOUNT?: number;

  NEW_COMPANY_ID?: number;
  NEW_DEPARTMENT_ID?: number;
  NEW_DESIGNATION_ID?: number;
  NEW_DEPARTMENT_GROUP_ID?: number;
  NEW_DESIGNATION_GROUP_ID?: number;
  NEW_CAMP_ID?: number;
  NEW_STORE_ID?: number;
  NEW_SALARY_SCALE_ID?: number;
  NEW_BASIC_SALARY?: number;
  NEW_FOT_ALLOWANCE?: number;
  NEW_ATTENDANCE_ALLOWANCE?: number;
  NEW_ONE_1YP_ALLOWANCE?: number;
  NEW_TECHNICAL?: number;
  NEW_POLYVALENT?: number;
  NEW_RESPONSIBILITY?: number;
  NEW_LOYALTY?: number;
  NEW_PRODUCTIVITY?: number;
  NEW_CAPACITY?: number;
  NEW_DISCIPLINARY?: number;
  NEW_HOUSE_ALLOW?: number;
  NEW_MEDICIAL?: number;
  NEW_EDUCATION?: number;
  NEW_MISCELLANIES?: number;
  NEW_NIGHT_ALLOWANCE?: number;
  NEW_EXTRA1?: number;
  NEW_EXTRA2?: number;
  NEW_EXTRA3?: number;
  NEW_EXTRA4?: number;
  NEW_EXTRA5?: number;
  NEW_EXTRA6?: number;
  NEW_GROSS_AMOUNT?: number;

  NEW_APPROVED_MAN_POWER?: number;
  NEW_CURRENT_MAN_POWER?: number;
  NEW_PENDING_MAN_POWER?: number;
  NEW_BALANCE_MAN_POWER?: number;

  REPORTING_MANAGER_ID?: number;
  REPORTING_MANAGER_COMMENTS?: string;
  MANAGER_RECOMMENDED_YN?: string;
  REASON?: string;

  SECTION_HEAD_RESPONSE_PERSON_EMP_ID?: number;
  SECTION_HEAD_RESPONSE_DATE?: string;
  SECTION_HEAD_RESPONSE_STATUS?: string;
  SECTION_HEAD_RESPONSE_REMARKS?: string;

  REMARKS?: string;
  STATUS_MASTER?: string;

  USER?: string;
  MAC_ADDRESS?: string;
  ROLE?: string;
}

interface PromotionDemotionTransferEntriesState {
  items: PromotionDemotionTransferEntriesGridData[];
  current: PromotionDemotionTransferEntriesGridData | null;
  loading: boolean;
  error: string | null;
}

const initialState: PromotionDemotionTransferEntriesState = {
  items: [],
  current: null,
  loading: false,
  error: null,
};

export const fetchPromotionDemotionTransferEntries = createAsyncThunk(
  "promotionDemotionTransferEntries/fetchPromotionDemotionTransferEntries",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/promotion-demotion-transfer-entries?status=${encodeURIComponent(status)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch promotion / demotion / transfer entries");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.SNO }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch promotion / demotion / transfer entries");
    }
  }
);

export const getPromotionDemotionTransferEntryByRefNo = createAsyncThunk(
  "promotionDemotionTransferEntries/getPromotionDemotionTransferEntryByRefNo",
  async (refNo: string, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/promotion-demotion-transfer-entries/${encodeURIComponent(refNo)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch promotion / demotion / transfer entry");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch promotion / demotion / transfer entry");
    }
  }
);

export const addPromotionDemotionTransferEntry = createAsyncThunk(
  "promotionDemotionTransferEntries/addPromotionDemotionTransferEntry",
  async (item: PromotionDemotionTransferEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const MAC_ADDRESS = item.MAC_ADDRESS || "WEB";
      const response = await fetch(`${API_URL}/promotion-demotion-transfer-entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...item, USER, MAC_ADDRESS }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add promotion / demotion / transfer entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add promotion / demotion / transfer entry");
    }
  }
);

export const updatePromotionDemotionTransferEntry = createAsyncThunk(
  "promotionDemotionTransferEntries/updatePromotionDemotionTransferEntry",
  async (item: PromotionDemotionTransferEntriesGridData, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const payload = {
        ...item,
        SNO: Number(item.id) || item.SNO,
        USER: item.USER || authUser?.loginName || authUser?.LOGIN_NAME || "Admin",
        MAC_ADDRESS: item.MAC_ADDRESS || "WEB",
      };
      const response = await fetch(
        `${API_URL}/promotion-demotion-transfer-entries/${payload.SNO}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update promotion / demotion / transfer entry");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update promotion / demotion / transfer entry");
    }
  }
);

export const deletePromotionDemotionTransferEntry = createAsyncThunk(
  "promotionDemotionTransferEntries/deletePromotionDemotionTransferEntry",
  async (refNo: string, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/promotion-demotion-transfer-entries/${encodeURIComponent(refNo)}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete promotion / demotion / transfer entry");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete promotion / demotion / transfer entry");
    }
  }
);

const promotionDemotionTransferEntriesSlice = createSlice({
  name: "promotionDemotionTransferEntries",
  initialState,
  reducers: {
    clearPromotionDemotionTransferEntriesError(state) {
      state.error = null;
    },
    clearCurrentPromotionDemotionTransferEntry(state) {
      state.current = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPromotionDemotionTransferEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchPromotionDemotionTransferEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchPromotionDemotionTransferEntries.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch promotion / demotion / transfer entries";
      })
      .addCase(getPromotionDemotionTransferEntryByRefNo.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPromotionDemotionTransferEntryByRefNo.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(getPromotionDemotionTransferEntryByRefNo.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) || action.error.message || "Failed to fetch promotion / demotion / transfer entry";
      })
      .addCase(addPromotionDemotionTransferEntry.pending, (state) => { state.error = null; })
      .addCase(addPromotionDemotionTransferEntry.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add promotion / demotion / transfer entry";
      })
      .addCase(updatePromotionDemotionTransferEntry.pending, (state) => { state.error = null; })
      .addCase(updatePromotionDemotionTransferEntry.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update promotion / demotion / transfer entry";
      })
      .addCase(deletePromotionDemotionTransferEntry.pending, (state) => { state.error = null; })
      .addCase(deletePromotionDemotionTransferEntry.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete promotion / demotion / transfer entry";
      });
  },
});

export const {
  clearPromotionDemotionTransferEntriesError,
  clearCurrentPromotionDemotionTransferEntry,
} = promotionDemotionTransferEntriesSlice.actions;
export default promotionDemotionTransferEntriesSlice.reducer;
