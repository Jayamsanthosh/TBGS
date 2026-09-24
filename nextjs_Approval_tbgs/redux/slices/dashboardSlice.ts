import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/lib/axios';
import { apiUrl } from '@/lib/config';

interface DashboardState {
    counts: Record<string, number>;
    cards: any[];
    loading: boolean;
    countsLoading: boolean;
    cardsLoading: boolean;
    error: string | null;
}

const initialState: DashboardState = {
    counts: {},
    cards: [],
    loading: false,
    countsLoading: false,
    cardsLoading: false,
    error: null,
};

export const fetchApprovalCounts = createAsyncThunk(
    'dashboard/fetchCounts',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(apiUrl('/dashboard/counts'));
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch counts');
        }
    }
);

export const fetchDashboardCards = createAsyncThunk(
    'dashboard/fetchCards',
    async (_, { rejectWithValue }) => {
        try {
            const response = await axios.get(apiUrl('/dashboard/cards'));
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch cards');
        }
    }
);

const dashboardSlice = createSlice({
    name: 'dashboard',
    initialState,
    reducers: {
        setCounts: (state, action) => {
            state.counts = action.payload;
        },
        setCards: (state, action) => {
            state.cards = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            // Counts
            .addCase(fetchApprovalCounts.pending, (state) => {
                state.countsLoading = true;
                state.loading = state.countsLoading || state.cardsLoading;
            })
            .addCase(fetchApprovalCounts.fulfilled, (state, action) => {
                state.countsLoading = false;
                state.loading = state.countsLoading || state.cardsLoading;
                state.counts = action.payload;
            })
            .addCase(fetchApprovalCounts.rejected, (state, action) => {
                state.countsLoading = false;
                state.loading = state.countsLoading || state.cardsLoading;
                state.error = action.payload as string;
            })
            // Cards
            .addCase(fetchDashboardCards.pending, (state) => {
                state.cardsLoading = true;
                state.loading = state.countsLoading || state.cardsLoading;
            })
            .addCase(fetchDashboardCards.fulfilled, (state, action) => {
                state.cardsLoading = false;
                state.loading = state.countsLoading || state.cardsLoading;
                state.cards = action.payload;
            })
            .addCase(fetchDashboardCards.rejected, (state, action) => {
                state.cardsLoading = false;
                state.loading = state.countsLoading || state.cardsLoading;
                state.error = action.payload as string;
            });
    },
});

export const { setCounts, setCards } = dashboardSlice.actions;
export default dashboardSlice.reducer;
