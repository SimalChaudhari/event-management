import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { 
    LOGS_LIST, 
    LOGS_LOADING, 
    LOGS_ERROR, 
    LOG_BY_ID, 
    LOGS_STATISTICS, 
    CREATE_SAMPLE_LOGS,
    CLEAR_LOGS_ERROR 
} from '../constants/actionTypes';

// Helper function to dispatch loading state
const setLoading = (dispatch, loading) => {
    dispatch({
        type: LOGS_LOADING,
        payload: loading
    });
};

// Helper function to dispatch error state
const setError = (dispatch, error) => {
    dispatch({
        type: LOGS_ERROR,
        payload: error
    });
};

// Get all logs with pagination and filters
export const getLogs = (params = {}) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const queryParams = new URLSearchParams();
        
        // Add pagination
        queryParams.append('page', params.page || '1');
        queryParams.append('limit', params.limit || '20');
        
        // Add filters
        if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
        if (params.dateTo) queryParams.append('dateTo', params.dateTo);
        if (params.status) queryParams.append('status', params.status);
        if (params.adminId) queryParams.append('adminId', params.adminId);
        if (params.fileName) queryParams.append('fileName', params.fileName);

        const response = await axiosInstance.get(`/logs/csv-upload?${queryParams}`);
        
        dispatch({
            type: LOGS_LIST,
            payload: {
                logs: response.data.logs || [],
                total: response.data.total || 0,
                page: response.data.page || 1,
                limit: response.data.limit || 20,
                totalPages: response.data.totalPages || 1
            }
        });
        
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch logs';
        setError(dispatch, errorMessage);
        toast.error(errorMessage);
        return false;
    }
};

// Get specific log by session ID
export const getLogById = (sessionId) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.get(`/logs/csv-upload/session/${sessionId}`);
        
        dispatch({
            type: LOG_BY_ID,
            payload: response.data
        });
        
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch log details';
        setError(dispatch, errorMessage);
        toast.error(errorMessage);
        return null;
    }
};

// Get logs by admin ID
export const getLogsByAdmin = (adminId, params = {}) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const queryParams = new URLSearchParams();
        queryParams.append('page', params.page || '1');
        queryParams.append('limit', params.limit || '20');

        const response = await axiosInstance.get(`/logs/csv-upload/admin/${adminId}?${queryParams}`);
        
        dispatch({
            type: LOGS_LIST,
            payload: {
                logs: response.data.logs || [],
                total: response.data.total || 0,
                page: response.data.page || 1,
                limit: response.data.limit || 20,
                totalPages: response.data.totalPages || 1
            }
        });
        
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch admin logs';
        setError(dispatch, errorMessage);
        toast.error(errorMessage);
        return false;
    }
};

// Get logs statistics
export const getLogsStatistics = () => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.get('/logs/csv-upload/statistics');
        
        dispatch({
            type: LOGS_STATISTICS,
            payload: response.data
        });
        
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch statistics';
        setError(dispatch, errorMessage);
        toast.error(errorMessage);
        return null;
    }
};

// Create sample logs for testing
export const createSampleLogs = () => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.get('/logs/csv-upload/create-sample');
        
        dispatch({
            type: CREATE_SAMPLE_LOGS,
            payload: response.data
        });
        
        toast.success(response.data.message);
        
        // Refresh logs after creating samples
        dispatch(getLogs());
        
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create sample logs';
        setError(dispatch, errorMessage);
        toast.error(errorMessage);
        return false;
    }
};

// Export logs to CSV
export const exportLogs = (filters = {}) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const queryParams = new URLSearchParams();
        if (filters.dateFrom) queryParams.append('dateFrom', filters.dateFrom);
        if (filters.dateTo) queryParams.append('dateTo', filters.dateTo);
        if (filters.status) queryParams.append('status', filters.status);
        if (filters.adminId) queryParams.append('adminId', filters.adminId);

        const response = await axiosInstance.get(`/logs/csv-upload/export?${queryParams}`, {
            responseType: 'blob'
        });

        // Create download link
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `csv-upload-logs-${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);

        toast.success('Logs exported successfully');
        setLoading(dispatch, false);
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to export logs';
        setError(dispatch, errorMessage);
        toast.error(errorMessage);
        return false;
    }
};

// Cleanup old logs
export const cleanupOldLogs = (days = 30) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const response = await axiosInstance.get(`/logs/csv-upload/cleanup?days=${days}`);
        
        toast.success(response.data.message);
        
        // Refresh logs after cleanup
        dispatch(getLogs());
        
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to cleanup logs';
        setError(dispatch, errorMessage);
        toast.error(errorMessage);
        return false;
    }
};

// Clear logs error
export const clearLogsError = () => (dispatch) => {
    dispatch({
        type: CLEAR_LOGS_ERROR
    });
};

