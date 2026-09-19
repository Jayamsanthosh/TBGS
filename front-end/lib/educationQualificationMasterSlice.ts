import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface EducationQualificationGridData {
  id?: string | number;
  EDUCATION_QUALIFICATION_ID?: number;
  EDUCATION_QUALIFICATION_NAME: string;
  SKILL_TYPE?: string;
  REMARKS?: string;
  STATUS_MASTER?: string;
}

interface EducationQualificationState {
  educationQualifications: EducationQualificationGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: EducationQualificationState = {
  educationQualifications: [],
  loading: false,
  error: null,
};

export const fetchEducationQualifications = createAsyncThunk(
  "educationQualification/fetchEducationQualifications",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/education-qualification-master?status=${encodeURIComponent(status)}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch education qualifications");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.EDUCATION_QUALIFICATION_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch education qualifications");
    }
  }
);

export const addEducationQualification = createAsyncThunk(
  "educationQualification/addEducationQualification",
  async (item: EducationQualificationGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/education-qualification-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add education qualification");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add education qualification");
    }
  }
);

export const updateEducationQualification = createAsyncThunk(
  "educationQualification/updateEducationQualification",
  async (item: EducationQualificationGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, EDUCATION_QUALIFICATION_ID: Number(item.id) || item.EDUCATION_QUALIFICATION_ID };
      const response = await fetch(`${API_URL}/education-qualification-master/${payload.EDUCATION_QUALIFICATION_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update education qualification");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update education qualification");
    }
  }
);

export const deleteEducationQualification = createAsyncThunk(
  "educationQualification/deleteEducationQualification",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/education-qualification-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete education qualification");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete education qualification");
    }
  }
);

const educationQualificationSlice = createSlice({
  name: "educationQualification",
  initialState,
  reducers: {
    clearEducationQualificationError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEducationQualifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchEducationQualifications.fulfilled, (state, action) => {
        state.loading = false;
        state.educationQualifications = action.payload;
      })
      .addCase(fetchEducationQualifications.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch education qualifications";
      })
      .addCase(addEducationQualification.pending, (state) => { state.error = null; })
      .addCase(addEducationQualification.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add education qualification";
      })
      .addCase(updateEducationQualification.pending, (state) => { state.error = null; })
      .addCase(updateEducationQualification.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update education qualification";
      })
      .addCase(deleteEducationQualification.pending, (state) => { state.error = null; })
      .addCase(deleteEducationQualification.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete education qualification";
      });
  },
});

export const { clearEducationQualificationError } = educationQualificationSlice.actions;
export default educationQualificationSlice.reducer;
