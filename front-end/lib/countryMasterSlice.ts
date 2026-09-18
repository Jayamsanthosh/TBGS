import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { API_URL } from "./config";

export interface CountryGridData {
  id?: string | number;
  Country_Id?: number;
  Country_Name: string;
  nicename?: string;
  iso3?: string;
  numcode?: number;
  phonecode?: number;
  Batch_No?: string;
  Remarks?: string;
  Status_Master?: string;
}

interface CountriesState {
  countries: CountryGridData[];
  loading: boolean;
  error: string | null;
}

const initialState: CountriesState = {
  countries: [],
  loading: false,
  error: null,
};

export const fetchCountries = createAsyncThunk(
  "countries/fetchCountries",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/country-master`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to fetch countries");
      }
      const json = await response.json();
      return (json.data || []).map((u: any) => ({ ...u, id: u.Country_Id }));
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch countries");
    }
  }
);

export const addCountry = createAsyncThunk(
  "countries/addCountry",
  async (item: CountryGridData, { rejectWithValue }) => {
    try {
      const response = await fetch(`${API_URL}/country-master`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to add country");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to add country");
    }
  }
);

export const updateCountry = createAsyncThunk(
  "countries/updateCountry",
  async (item: CountryGridData, { rejectWithValue }) => {
    try {
      const payload = { ...item, Country_Id: Number(item.id) || item.Country_Id };
      const response = await fetch(`${API_URL}/country-master/${payload.Country_Id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to update country");
      }
      return await response.json();
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to update country");
    }
  }
);

export const deleteCountry = createAsyncThunk(
  "countries/deleteCountry",
  async (id: string | number, { rejectWithValue, getState }) => {
    try {
      const state: any = getState();
      const authUser = state.auth?.user;
      const USER = authUser?.loginName || authUser?.LOGIN_NAME || "Admin";
      const ROLE = authUser?.role || authUser?.ROLE || "Admin";

      const response = await fetch(
        `${API_URL}/country-master/${id}?USER=${encodeURIComponent(USER)}&ROLE=${encodeURIComponent(ROLE)}&MAC_ADDRESS=WEB`,
        { method: "DELETE" }
      );
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return rejectWithValue(errorData.message || "Failed to delete country");
      }
      return await response.json(); } catch (error: any) {
      return rejectWithValue(error.message || "Failed to delete country");
    }
  }
);

const countriesSlice = createSlice({
  name: "countries",
  initialState,
  reducers: {
    clearCountriesError(state) {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCountries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCountries.fulfilled, (state, action) => {
        state.loading = false;
        state.countries = action.payload;
      })
      .addCase(fetchCountries.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || action.error.message || "Failed to fetch countries";
      })
      .addCase(addCountry.pending, (state) => { state.error = null; })
      .addCase(addCountry.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to add country";
      })
      .addCase(updateCountry.pending, (state) => { state.error = null; })
      .addCase(updateCountry.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to update country";
      })
      .addCase(deleteCountry.pending, (state) => { state.error = null; })
      .addCase(deleteCountry.rejected, (state, action) => {
        state.error = (action.payload as string) || action.error.message || "Failed to delete country";
      });
  },
});

export const { clearCountriesError } = countriesSlice.actions;
export default countriesSlice.reducer;
