import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from '@/lib/axios';

interface ApprovalState {
    records: any[];
    currentRecord: any | null;
    conversations: any[];
    loading: boolean;
    error: string | null;
}

const initialState: ApprovalState = {
    records: [],
    currentRecord: null,
    conversations: [],
    loading: false,
    error: null,
};

export const fetchApprovalRecords = createAsyncThunk(
    'approval/fetchRecords',
    async (approvalType: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/approvals/${approvalType}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch records');
        }
    }
);

export const fetchApprovalDetail = createAsyncThunk(
    'approval/fetchDetail',
    async ({ type, id }: { type: string, id: string }, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/approvals/${type}/${id}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch detail');
        }
    }
);

export const fetchConversation = createAsyncThunk(
    'approval/fetchConversation',
    async (poRefNo: string, { rejectWithValue }) => {
        try {
            const response = await axios.get(`/api/approvals/conversation?poRefNo=${poRefNo}`);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversation');
        }
    }
);

export const updateApprovalStatus = createAsyncThunk(
    'approval/updateStatus',
    async (payload: any, { rejectWithValue }) => {
        try {
            const response = await axios.post('/api/approvals/status', payload);
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update status');
        }
    }
);

export const updateApprovalStatusByType = createAsyncThunk(
    'approval/updateStatusByType',
    async ({ type, ids, status, remarks }: { type: string, ids: number[], status: string, remarks: string }, { rejectWithValue }) => {
        try {
            const response = await axios.patch(`/api/approvals/${type}`, { ids, status, remarks });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Failed to update status');
        }
    }
);

const approvalSlice = createSlice({
    name: 'approval',
    initialState,
    reducers: {
        clearCurrentRecord: (state) => {
            state.currentRecord = null;
            state.conversations = [];
        }
    },
    extraReducers: (builder) => {
        builder
            // Records List
            .addCase(fetchApprovalRecords.pending, (state) => {
                state.loading = true;
                state.error = null;
                state.records = []; // Clear stale records
            })
            .addCase(fetchApprovalRecords.fulfilled, (state, action) => {
                state.loading = false;
                state.records = action.payload;
            })
            .addCase(fetchApprovalRecords.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Individual Detail
            .addCase(fetchApprovalDetail.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchApprovalDetail.fulfilled, (state, action) => {
                state.loading = false;
                state.currentRecord = action.payload;
            })
            .addCase(fetchApprovalDetail.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Conversation Thread
            .addCase(fetchConversation.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchConversation.fulfilled, (state, action) => {
                state.loading = false;
                state.conversations = action.payload;
            })
            .addCase(fetchConversation.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Status Update (by type)
            .addCase(updateApprovalStatusByType.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateApprovalStatusByType.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(updateApprovalStatusByType.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCurrentRecord } = approvalSlice.actions;
export default approvalSlice.reducer;
