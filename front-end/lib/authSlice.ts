import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { API_URL, BASE_PATH } from "./config";
import { isTokenExpired } from "./auth";

export interface UserCompanyInfo {
  companyId: number;
  companyName: string;
  shortCode: string;
  yearCode: string;
  /* Branch this company is mapped to. null when the company has no active
     mapping - the backend sends null rather than omitting it, so a missing
     mapping and a stale response are never confused for each other. */
  branchId?: number | null;
  branchName?: string | null;
}

export interface UserEmployeeInfo {
  /* Null when the login has no employee row, or its EMP_ID points at a row that
     does not exist. Never treat a raw EMP_ID as valid without this check. */
  empId?: number | null;
  /* Employee full name, falling back to the login name. Never empty. */
  empName?: string | null;
  /* The employee's own company/camp/store defaults, used to stamp new documents.
     Distinct from the session company/branch above, which come from the login's
     company mapping rather than the employee record. */
  companyId?: number | null;
  /* Branch mapped to companyId above. Kept as a pair with companyId so a screen
     never shows one company's id next to another company's branch. */
  branchId?: number | null;
  campId?: number | null;
  storeId?: number | null;
}

/**
 * The company / branch / camp / store the user picked on the login screen.
 *
 * The backend re-validated this against the user's mapping before minting the
 * token, so unlike `companies` (everything the user *could* switch to) this is
 * the one they actually chose, and it is what screens should stamp.
 *
 * Every id but companyId may be null: a mapping row can carry only a company,
 * and a company with no active branch mapping is a normal state, not an error.
 */
export interface SessionContext {
  companyId: number;
  companyName: string;
  branchId?: number | null;
  branchName?: string | null;
  campId?: number | null;
  campName?: string | null;
  storeId?: number | null;
  storeName?: string | null;
}

export interface UserData {
  id: number | string;
  loginName: string;
  role: string;
  roleId?: number;
  mailId: string;
  stockShowStatus?: string;
  outsideAccessYn?: string;
  monthProcess?: string;
  yearProcess?: string;
  companies?: UserCompanyInfo[];
  companyName?: string;
  /* Branch of the active company, hoisted by the backend from companies[0]. */
  branchId?: number | null;
  branchName?: string | null;
  /* The pick made on the login screen. Null only for a session whose token was
     minted before the dropdowns existed - derive it from companies[0] then. */
  context?: SessionContext | null;
  /* Employee behind this login, resolved by the backend at login time. */
  employee?: UserEmployeeInfo | null;
  LOGIN_NAME?: string;
  LOGIN_ID?: string;
  ROLE?: string;
  ROLE_ID?: number;
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
}

/**
 * The company/branch/camp/store chosen on the login screen.
 *
 * Optional as a whole: a client that posts bare credentials gets the backend's
 * default (the login's first mapped company) instead. When a company IS sent,
 * the backend validates the whole set against the user's mapping and rejects
 * the login outright on a mismatch - so these are never trusted as-is.
 */
export interface LoginContextSelection {
  COMPANY_ID?: number | null;
  CAMP_ID?: number | null;
  STORE_ID?: number | null;
  BRANCH_ID?: number | null;
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
  { LOGIN_NAME: string; PASSWORD: string } & LoginContextSelection,
  { rejectValue: string }
>("auth/loginUser", async ({ LOGIN_NAME, PASSWORD, COMPANY_ID, CAMP_ID, STORE_ID, BRANCH_ID }, { rejectWithValue }) => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include", // required so the backend's Set-Cookie (access_token) sticks
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      LOGIN_NAME,
      PASSWORD,
      /* Sent only when a company was actually picked. A camp/store/branch on
         its own cannot be validated, so the backend ignores them without a
         company rather than trusting them. */
      ...(COMPANY_ID != null
        ? {
            COMPANY_ID,
            CAMP_ID: CAMP_ID ?? null,
            STORE_ID: STORE_ID ?? null,
            BRANCH_ID: BRANCH_ID ?? null,
          }
        : {}),
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    return rejectWithValue(data.message || "Login failed");
  }

  if (!data.accessToken || !data.refreshToken) {
    return rejectWithValue("Login response is missing authentication tokens");
  }

  return data as LoginApiResponse;
});

/**
 * Logout thunk.
 *
 * The `logoutUser` reducer below is intentionally pure. All side effects
 * (the server logout call and the redirect) live here instead, so that
 * dispatching logout can never re-trigger the API/observer loop that used
 * to keep the app firing `/auth/logout` + `/auth/permissions` forever.
 *
 * It also only calls the server when a session actually existed: POST
 * /auth/logout is itself authenticated, so calling it with a dead session
 * only produces a 401 (which the fetch interceptor would otherwise treat
 * as "session expired" again).
 */
export const logoutUserThunk = createAsyncThunk<void, void>(
  "auth/logoutUserThunk",
  async (_, { dispatch }) => {
    const hadSession =
      typeof window !== "undefined" &&
      Boolean(localStorage.getItem("accessToken") || localStorage.getItem("refreshToken"));

    dispatch(logoutUser());

    if (hadSession && typeof window !== "undefined") {
      // `keepalive` lets the request finish even though we navigate away.
      fetch(`${API_URL}/auth/logout`, {
        method: "POST",
        credentials: "include",
        keepalive: true,
      }).catch(() => {});
    }

    if (typeof window !== "undefined") {
      // Hard redirect guarantees a clean state and stops any in-flight loop.
      window.location.replace(`${BASE_PATH}/login`);
    }
  }
);

/* Branch ids are positive, so 0, "" and undefined all mean "not mapped" and
   collapse to null - otherwise a caller doing `branchId ? ...` would treat a
   0 from a sparse server payload as a real branch. */
const toBranchId = (v: unknown): number | null => {
  const n = Number(v);
  return v === "" || v === null || v === undefined || isNaN(n) || n <= 0 ? null : n;
};

/* Names are kept even when the id is null so the UI can still say "No branch
   mapped" rather than rendering a blank line. */
const toName = (v: unknown, fallback = ""): string => {
  const s = String(v ?? "").trim();
  return s || fallback;
};

/**
 * The pick made on the login screen, normalized.
 *
 * Null when the token carries no context - i.e. it was minted before the login
 * screen had these dropdowns. Callers must then fall back to companies[0] rather
 * than read a half-built object, which is why this returns null instead of an
 * object full of nulls.
 */
const normalizeContext = (raw: unknown): SessionContext | null => {
  if (!raw || typeof raw !== "object") return null;
  const src = raw as Record<string, unknown>;
  const companyId = toBranchId(src.companyId);
  /* Without a company there is nothing to scope a session to. Treat it as
     absent so the companies[0] fallback takes over. */
  if (companyId === null) return null;

  return {
    companyId,
    companyName: toName(src.companyName, `Company ${companyId}`),
    branchId: toBranchId(src.branchId),
    branchName: toName(src.branchName) || null,
    campId: toBranchId(src.campId),
    campName: toName(src.campName) || null,
    storeId: toBranchId(src.storeId),
    storeName: toName(src.storeName) || null,
  };
};

function normalizeUser(serverUser: Record<string, unknown>): UserData {
  const loginName = String(serverUser.loginName ?? serverUser.LOGIN_NAME ?? "");
  const companies = Array.isArray(serverUser.companies)
    ? (serverUser.companies as UserCompanyInfo[])
    : [];
  const context = normalizeContext(serverUser.context);

  /* The active company is the chosen one when there is a context, else the
     first one. Same for the session branch: prefer the explicit pick, then the
     hoisted top-level value, then the per-company value, so a hydrate from an
     older cached session still picks the branch up. */
  const activeCompany = context
    ? companies.find((c) => Number(c.companyId) === context.companyId) ?? companies[0]
    : companies[0];
  const branchId = context?.branchId ?? toBranchId(serverUser.branchId ?? activeCompany?.branchId);
  const branchName =
    context?.branchName ??
    ((serverUser.branchName === "" || serverUser.branchName === undefined
      ? activeCompany?.branchName
      : (serverUser.branchName as string)) ?? null);

  /* Employee identity of the login. Normalized so a sparse payload (an access token
     minted before this existed) yields null rather than a half-built object, and so
     empId collapses to null instead of a misleading 0. The name falls back to the
     login name, which is what the backend does too, so the two never disagree. */
  const rawEmployee = (serverUser.employee ?? null) as UserEmployeeInfo | null;
  const employee: UserEmployeeInfo | null = rawEmployee
    ? {
        empId: toBranchId(rawEmployee.empId),
        empName: String(rawEmployee.empName ?? "").trim() || loginName,
        companyId: toBranchId(rawEmployee.companyId),
        branchId: toBranchId(rawEmployee.branchId),
        campId: toBranchId(rawEmployee.campId),
        storeId: toBranchId(rawEmployee.storeId),
      }
    : null;

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
    context,
    companyName: context?.companyName ?? activeCompany?.companyName ?? "",
    branchId,
    branchName,
    employee,
  } as UserData;
}

function persistAuth(accessToken: string, refreshToken: string, user: UserData) {
  localStorage.setItem("accessToken", accessToken);
  localStorage.setItem("refreshToken", refreshToken);
  localStorage.setItem("user", JSON.stringify(user));
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
    },
    hydrateFromStorage(state) {
      const accessToken = localStorage.getItem("accessToken");
      const refreshToken = localStorage.getItem("refreshToken");
      const userJson = localStorage.getItem("user");
      // Never restore an expired/garbage token as a live session - otherwise
      // the UI reports "authenticated" while every API call 401s.
      if (accessToken && refreshToken && userJson && !isTokenExpired(accessToken)) {
        try {
          state.user = normalizeUser(JSON.parse(userJson));
          state.accessToken = accessToken;
          state.refreshToken = refreshToken;
          return;
        } catch {
          // fall through to clear below
        }
      }
      clearPersistedAuth();
    },
    /**
     * Replaces the list of companies the login may switch between.
     *
     * Refreshing this list must NOT reset an explicit login-screen choice back
     * to companies[0] - the whole point of the dropdowns is that the user's pick
     * survives. So when a context is present the active company is located
     * inside the new list and the context is re-based onto it; only a session
     * with no context at all (an older token) falls back to the first company.
     */
    updateUserCompany(state, action: PayloadAction<UserCompanyInfo[]>) {
      if (!state.user) return;
      const companies = Array.isArray(action.payload) ? action.payload : [];
      if (companies.length === 0) return;

      const context = state.user.context ?? null;
      const activeCompany = context
        ? companies.find((c) => Number(c.companyId) === context.companyId)
        : companies[0];

      /* The chosen company is no longer in the list - the mapping was revoked
         while the session is alive. Fall back to the first company rather than
         keeping a context that points at nothing. */
      if (context && !activeCompany) {
        const fallback = companies[0];
        state.user = {
          ...state.user,
          companies,
          context: null,
          companyName: fallback?.companyName ?? "",
          branchId: toBranchId(fallback?.branchId),
          branchName: fallback?.branchName ?? null,
        };
      } else if (activeCompany) {
        /* Switching the active company switches the branch with it - the branch
           is per company, so keeping the old one would show a branch that does
           not belong to the newly selected company. */
        state.user = {
          ...state.user,
          companies,
          companyName: context?.companyName ?? activeCompany.companyName ?? "",
          branchId: context?.branchId ?? toBranchId(activeCompany.branchId),
          branchName: context?.branchName ?? activeCompany.branchName ?? null,
        };
      } else {
        state.user = { ...state.user, companies };
      }

      try {
        localStorage.setItem("user", JSON.stringify(state.user));
      } catch {}
    },
    /** Replaces the active company/branch/camp/store, e.g. after a re-login. */
    setSessionContext(state, action: PayloadAction<SessionContext | null>) {
      if (!state.user) return;
      const context = normalizeContext(action.payload);
      const activeCompany = context
        ? state.user.companies?.find((c) => Number(c.companyId) === context.companyId)
        : state.user.companies?.[0];

      state.user = {
        ...state.user,
        context,
        companyName: context?.companyName ?? activeCompany?.companyName ?? state.user.companyName ?? "",
        branchId: context?.branchId ?? toBranchId(activeCompany?.branchId),
        branchName: context?.branchName ?? activeCompany?.branchName ?? null,
      };
      try {
        localStorage.setItem("user", JSON.stringify(state.user));
      } catch {}
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
        const { accessToken, refreshToken, user: serverUser } = action.payload;
        const normalized = normalizeUser(serverUser);
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

export const {
  logoutUser,
  hydrateFromStorage,
  clearAuthError,
  updateUserCompany,
  setSessionContext,
} = authSlice.actions;
export default authSlice.reducer;
