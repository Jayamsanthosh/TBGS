import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { API_URL } from "@/lib/config";

export interface UserCompanyInfo {
  companyId: number;
  companyName: string;
  shortCode: string;
  yearCode: string;
}

export interface Permission {
  linkId: number;
  linkName: string;
  pageAction: string;
  linkLocation: string;
  redirectionType: string;
}

export interface UserData {
  id: number | string;
  loginName: string;
  role: string;
  mailId: string;
  stockShowStatus?: string;
  outsideAccessYn?: string;
  monthProcess?: string;
  yearProcess?: string;
  companies?: UserCompanyInfo[];
  companyName?: string;
  permissions?: Permission[];
  LOGIN_NAME?: string;
  LOGIN_ID?: string;
  ROLE?: string;
  MAIL_ID?: string;
  STOCK_SHOW_STATUS?: string;
  OUTSIDE_ACCESS_Y_N?: string;
  MONTH_PROCESS?: string;
  YEAR_PROCESS?: string;
}

interface LoginApiResponse {
  success: boolean;
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
  permissions?: Permission[];
}

interface AuthState {
  user: UserData | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  loading: false,
  error: null,
};

export const loginUser = createAsyncThunk<
  LoginApiResponse,
  { LOGIN_NAME: string; PASSWORD: string },
  { rejectValue: string }
>("auth/loginUser", async ({ LOGIN_NAME, PASSWORD }, { rejectWithValue }) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ LOGIN_NAME, PASSWORD }),
  });

  const data = await response.json();

  if (!response.ok) {
    return rejectWithValue(data.message || "Login failed");
  }

  if (!data.accessToken || !data.refreshToken) {
    return rejectWithValue("Login response is missing authentication tokens");
  }

  let permissions: Permission[] = [];
  try {
    const permResponse = await fetch(`${API_URL}/auth/permissions`, {
      headers: { Authorization: `Bearer ${data.accessToken}` },
    });
    const permData = await permResponse.json();
    if (permData.success && Array.isArray(permData.data)) {
      permissions = permData.data;
    }
  } catch {
    // permissions fetch failed — proceed without them
  }

  return { ...data, permissions } as LoginApiResponse;
});

function normalizeUser(serverUser: Record<string, unknown>, permissions?: Permission[]): UserData {
  const loginName = String(serverUser.loginName ?? serverUser.LOGIN_NAME ?? "");
  const companies = Array.isArray(serverUser.companies)
    ? (serverUser.companies as UserCompanyInfo[])
    : [];
  return {
    ...serverUser,
    id: String(serverUser.id ?? serverUser.LOGIN_ID ?? ""),
    loginName,
    LOGIN_NAME: loginName,
    role: String(serverUser.role ?? serverUser.ROLE ?? "User"),
    mailId: String(serverUser.mailId ?? serverUser.MAIL_ID ?? ""),
    stockShowStatus: String(serverUser.stockShowStatus ?? serverUser.STOCK_SHOW_STATUS ?? "N"),
    outsideAccessYn: String(serverUser.outsideAccessYn ?? serverUser.OUTSIDE_ACCESS_Y_N ?? "N"),
    monthProcess: String(serverUser.monthProcess ?? serverUser.MONTH_PROCESS ?? ""),
    yearProcess: String(serverUser.yearProcess ?? serverUser.YEAR_PROCESS ?? ""),
    companies,
    companyName: companies[0]?.companyName ?? "",
    permissions: permissions || [],
  } as UserData;
}

function persistAuth(accessToken: string, refreshToken: string, user: UserData) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
  if (user.permissions) {
    localStorage.setItem("permissions", JSON.stringify(user.permissions));
  }
}

function clearPersistedAuth() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("user");
  localStorage.removeItem("permissions");
}

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser(state) {
      state.user = null;
      state.accessToken = null;
      state.refreshToken = null;
      state.loading = false;
      state.error = null;
      clearPersistedAuth();
      // Fire-and-forget: clears the httpOnly access_token/refresh_token
      // cookies server-side. Local UI state above is already cleared,
      // so we don't block on the network response.
      fetch(`${API_URL}/auth/logout`, { method: "POST", credentials: "include" }).catch(() => {});
      window.dispatchEvent(new Event("user-data-updated"));
    },
    hydrateFromStorage(state) {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const userJson = localStorage.getItem("user");
      if (accessToken && refreshToken && userJson) {
        try {
          const user = JSON.parse(userJson);
          const permissionsJson = localStorage.getItem("permissions");
          if (permissionsJson) {
            user.permissions = JSON.parse(permissionsJson);
          }
          state.user = user;
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
        } catch {
          clearPersistedAuth();
        }
      }
    },
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        const { accessToken, refreshToken, user: serverUser, permissions } = action.payload;
        const normalized = normalizeUser(serverUser, permissions);
        state.accessToken = accessToken;
        state.refreshToken = refreshToken;
        state.user = normalized;
        state.loading = false;
        state.error = null;
        persistAuth(accessToken, refreshToken, normalized);
        window.dispatchEvent(new Event("user-data-updated"));
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || action.error.message || "Login failed";
      });
  },
});

export const { logoutUser, hydrateFromStorage, clearAuthError } = authSlice.actions;
export default authSlice.reducer;