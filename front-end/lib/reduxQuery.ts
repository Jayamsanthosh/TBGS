import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { useCallback, useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "./hooks";

// --- Slice ---

interface ApiCacheEntry {
  data: any;
  loading: boolean;
  error: string | null;
}

interface ApiState {
  cache: Record<string, ApiCacheEntry>;
}

const initialState: ApiState = { cache: {} };

export const fetchAndCache = createAsyncThunk(
  "api/fetchAndCache",
  async ({
    key,
    fetcher,
  }: {
    key: string;
    fetcher: () => Promise<any>;
  }) => {
    const data = await fetcher();
    return { key, data };
  }
);

const apiSlice = createSlice({
  name: "api",
  initialState,
  reducers: {
    clearCacheKey(state, action) {
      delete state.cache[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAndCache.pending, (state, action) => {
        state.cache[action.meta.arg.key] = {
          data: state.cache[action.meta.arg.key]?.data,
          loading: true,
          error: null,
        };
      })
      .addCase(fetchAndCache.fulfilled, (state, action) => {
        state.cache[action.payload.key] = {
          data: action.payload.data,
          loading: false,
          error: null,
        };
      })
      .addCase(fetchAndCache.rejected, (state, action) => {
        state.cache[action.meta.arg.key] = {
          data: state.cache[action.meta.arg.key]?.data,
          loading: false,
          error: action.error.message || "Unknown error",
        };
      });
  },
});

export const { clearCacheKey } = apiSlice.actions;
export default apiSlice.reducer;

// --- Hooks ---

export function useApiQuery(
  key: string | string[],
  fetcher: () => Promise<any>,
  options?: { enabled?: boolean }
) {
  const normalizedKey = Array.isArray(key) ? key.join("-") : key;
  const dispatch = useAppDispatch();
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const entry = useAppSelector((s) => s.api.cache[normalizedKey]);
  const enabled = options?.enabled !== false;

  useEffect(() => {
    if (enabled && !entry) {
      dispatch(fetchAndCache({ key: normalizedKey, fetcher: fetcherRef.current }));
    }
  }, [normalizedKey, entry, dispatch, enabled]);

  const refetch = useCallback(() => {
    dispatch(fetchAndCache({ key: normalizedKey, fetcher: fetcherRef.current }));
  }, [normalizedKey, dispatch]);

  return {
    data: entry?.data,
    loading: entry?.loading ?? (enabled ? true : false),
    error: entry?.error ?? null,
    refetch,
  };
}

export function useApiMutation(invalidateKeys: string[]) {
  const dispatch = useAppDispatch();

  const mutateAsync = useCallback(
    async (mutationFn: () => Promise<any>) => {
      const result = await mutationFn();
      invalidateKeys.forEach((key) => {
        dispatch(clearCacheKey(key));
      });
      return result;
    },
    [invalidateKeys, dispatch]
  );

  return { mutateAsync };
}
