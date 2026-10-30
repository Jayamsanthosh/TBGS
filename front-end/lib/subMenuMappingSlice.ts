import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface SubMenuMappingGridData {
  id?: string | number;
  MAP_ID?: number;
  SUB_MENU_PARENT_ID?: number | null;
  PARENT_SUB_MENU_NAME?: string | null;
  CHILD_ID?: number | null;
  CHILD_SUB_MENU_NAME?: string | null;
  MAP_LOCATION?: string | null;
  LINK_ID?: number | null;
  LINK_NAME?: string | null;
  LINK_LOCATION?: string | null;
  STATUS_MASTER?: string;
  CREATED_BY?: string;
}

interface SubMenuMappingState {
  records: SubMenuMappingGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: SubMenuMappingState = {
  records: [],
  loading: false,
  error: null,
};

export const fetchSubMenuMappings = createAsyncThunk(
  "subMenuMapping/fetchAll",
  async (status: string = "ALL", { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_URL}/sub-menu-mapping?status=${encodeURIComponent(status)}`
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch sub menu mappings");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.MAP_ID }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sub menu mappings");
    }
  }
);

export const fetchSubMenuMappingById = createAsyncThunk(
  "subMenuMapping/fetchById",
  async (id: number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sub-menu-mapping/${id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch sub menu mapping");
      }
      const json = await response.json();
      return json.data || null;
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sub menu mapping");
    }
  }
);

export const addSubMenuMapping = createAsyncThunk(
  "subMenuMapping/add",
  async (item: SubMenuMappingGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sub-menu-mapping`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add sub menu mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add sub menu mapping");
    }
  }
);

export const updateSubMenuMapping = createAsyncThunk(
  "subMenuMapping/update",
  async (item: SubMenuMappingGridData, { rejectWithValue }) => {
    try {
      const payload = {
        ...item,
        MAP_ID: Number(item.id) || item.MAP_ID,
      };
      const response = await fetch(`${API_URL}/sub-menu-mapping/${payload.MAP_ID}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update sub menu mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update sub menu mapping");
    }
  }
);

export const deleteSubMenuMapping = createAsyncThunk(
  "subMenuMapping/delete",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sub-menu-mapping/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete sub menu mapping");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete sub menu mapping");
    }
  }
);

const subMenuMappingSlice = createSlice({
  name: "subMenuMapping",
  initialState,
  reducers: {
    clearSubMenuMappingError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubMenuMappings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubMenuMappings.fulfilled, (state, action) => {
        state.loading = false;
        state.records = action.payload;
      })
      .addCase(fetchSubMenuMappings.rejected, (state, action) => {
        state.loading = false;
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to fetch sub menu mappings";
      })
      .addCase(addSubMenuMapping.pending, (state) => {
        state.error = null;
      })
      .addCase(addSubMenuMapping.rejected, (state, action) => {
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to add sub menu mapping";
      })
      .addCase(updateSubMenuMapping.pending, (state) => {
        state.error = null;
      })
      .addCase(updateSubMenuMapping.rejected, (state, action) => {
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to update sub menu mapping";
      })
      .addCase(deleteSubMenuMapping.pending, (state) => {
        state.error = null;
      })
      .addCase(deleteSubMenuMapping.rejected, (state, action) => {
        state.error =
          (action.payload as string) ||
          action.error.message ||
          "Failed to delete sub menu mapping";
      });
  },
});

export const { clearSubMenuMappingError } = subMenuMappingSlice.actions;
export default subMenuMappingSlice.reducer;
