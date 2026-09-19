import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

// ── Types ──────────────────────────────────────────────────────────────────

export interface NavLink {
  link_id: string | number;
  link_name: string;
  page_action: string;
  link_Location: string;
  link_seq_id: number;
  style_css: string;
}

export interface NavSubMenu {
  sub_menu_id: string | number;
  sub_menu_name: string;
  sub_menu_seq_id: number;
  style_css: string;
  page_action: string;
  links: NavLink[];
}

export interface NavMainMenu {
  main_menu_id: string | number;
  main_menu_name: string;
  main_menu_seq_id: number;
  style_css: string;
  page_action: string;
  subMenus: NavSubMenu[];
}

interface NavigationState {
  menus: NavMainMenu[];
  loading: boolean;
  error: string | null;
  lastRole: string | null;
}

const initialState: NavigationState = {
  menus: [],
  loading: false,
  error: null,
  lastRole: null,
};

// ── Thunk ──────────────────────────────────────────────────────────────────

export const fetchNavigation = createAsyncThunk(
  "navigation/fetchNavigation",
  async (roleName: string, { rejectWithValue }) => {
    try {
      const res = await fetch(`${API_URL}/navigation?roleName=${encodeURIComponent(roleName)}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return rejectWithValue(err.message || "Failed to fetch navigation");
      }
      const json = await res.json();
      return { menus: json.data || [], roleName };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch navigation");
    }
  }
);

export function refreshNavigationForUser(user: any) {
  const role = String(user?.role ?? user?.ROLE ?? "Admin");
  return fetchNavigation(role);
}

// ── Slice ──────────────────────────────────────────────────────────────────

const navigationSlice = createSlice({
  name: "navigation",
  initialState,
  reducers: {
    clearNavigation(state) {
      state.menus = [];
      state.lastRole = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNavigation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNavigation.fulfilled, (state, action) => {
        state.loading = false;
        state.menus = action.payload.menus;
        state.lastRole = action.payload.roleName;
      })
      .addCase(fetchNavigation.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch navigation";
      });
  },
});

export const { clearNavigation } = navigationSlice.actions;
export default navigationSlice.reducer;
