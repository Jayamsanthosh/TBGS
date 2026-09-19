import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface SubMenuGridData {
  id?: string | number;
  SUB_MENU_ID?: number;
  MAIN_MENU_ID?: number;
  MAIN_MENU_NAME?: string;
  SUB_MENU_NAME: string;
  SUB_MENU_LOCATION: string;
  SUB_MENU_SEQ_ID: number;
  STYLE_CSS: string;
  PAGE_ACTION: string;
  IS_PARENT: string;
  STATUS_MASTER: string;
  USER?: string;
}

interface SubMenusState {
  subMenus: SubMenuGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: SubMenusState = {
  subMenus: [],
  loading: false,
  error: null,
};

const toDisplayStatus = (val: string) => {
  const u = (val || "").toUpperCase();
  return u === "AC" || u === "ACTIVE" ? "ACTIVE" : "INACTIVE";
};

export const fetchSubMenus = createAsyncThunk(
  "subMenus/fetchSubMenus",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sub-menu`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch sub menus");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => {
        const rawStatus = u.STATUS_MASTER || u.STATUS;
        const displayStatus = toDisplayStatus(rawStatus);
        return {
          ...u,
          id: u.SUB_MENU_ID ?? u.subMenuId,
          STATUS_MASTER: displayStatus,
          status: displayStatus,
        };
      });
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch sub menus");
    }
  }
);

export const addSubMenu = createAsyncThunk(
  "subMenus/addSubMenu",
  async (item: SubMenuGridData, { rejectWithValue }) => {
    try {
      // STATUS_MASTER arrives from form as 'AC'/'IN' or 'ACTIVE'/'INACTIVE'; backend normalizes to 'AC'/'IN'
      const body = { ...item };
      const response = await fetch(`${API_URL}/sub-menu`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add sub menu");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add sub menu");
    }
  }
);

export const updateSubMenu = createAsyncThunk(
  "subMenus/updateSubMenu",
  async (item: SubMenuGridData, { rejectWithValue }) => {
    try {
      const menuId = Number(item.id) || item.SUB_MENU_ID!;
      const payload = {
        ...item,
        SUB_MENU_ID: menuId,
        // STATUS_MASTER arrives from form as 'AC'/'IN' or 'ACTIVE'/'INACTIVE'; backend normalizes to 'AC'/'IN'
      };
      const response = await fetch(`${API_URL}/sub-menu/${menuId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update sub menu");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update sub menu");
    }
  }
);

export const deleteSubMenu = createAsyncThunk(
  "subMenus/deleteSubMenu",
  async (id: string | number, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/sub-menu/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete sub menu");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete sub menu");
    }
  }
);

const subMenuSlice = createSlice({
  name: "subMenus",
  initialState,
  reducers: {
    clearSubMenusError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSubMenus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSubMenus.fulfilled, (state, action) => {
        state.loading = false;
        state.subMenus = action.payload;
      })
      .addCase(fetchSubMenus.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch sub menus";
      })
      .addCase(addSubMenu.pending, (state) => { state.error = null; })
      .addCase(addSubMenu.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add sub menu";
      })
      .addCase(updateSubMenu.pending, (state) => { state.error = null; })
      .addCase(updateSubMenu.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update sub menu";
      })
      .addCase(deleteSubMenu.pending, (state) => { state.error = null; })
      .addCase(deleteSubMenu.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete sub menu";
      });
  },
});

export const { clearSubMenusError } = subMenuSlice.actions;
export default subMenuSlice.reducer;
