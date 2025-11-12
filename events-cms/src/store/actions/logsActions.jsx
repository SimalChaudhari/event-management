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
    setLoading(dispatch, true);
    try {
        const queryParams = new URLSearchParams();

        if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
        if (params.dateTo) queryParams.append('dateTo', params.dateTo);
        if (params.status) queryParams.append('status', params.status);
        if (params.adminId) queryParams.append('adminId', params.adminId);
        if (params.fileName) queryParams.append('fileName', params.fileName);

        const queryString = queryParams.toString();
        const url = queryString ? `/logs/csv-upload?${queryString}` : '/logs/csv-upload';

        const response = await axiosInstance.get(url);

        const data = response?.data;
        const logsData = Array.isArray(data) ? data : data?.logs || [];
        const total = Array.isArray(data) ? logsData.length : data?.total || logsData.length;
        const resolvedLimit = logsData.length || 1;
        const page = 1;
        const totalPages = 1;

        dispatch({
            type: LOGS_LIST,
            payload: {
                logs: logsData,
                total,
                page,
                limit: resolvedLimit,
                totalPages
            }
        });
        
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch logs';
        setError(dispatch, errorMessage);
        toast.error(errorMessage);
        return false;
    } finally {
        setLoading(dispatch, false);
    }
};

// Get specific log by session ID
export const getLogById = (sessionId) => async (dispatch) => {
    setLoading(dispatch, true);
    try {

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
    } finally {
        setLoading(dispatch, false);
    }
};

// Get logs by admin ID
export const getLogsByAdmin = (adminId) => async (dispatch) => {
    setLoading(dispatch, true);
    try {
        const response = await axiosInstance.get(`/logs/csv-upload/admin/${adminId}`);

        const data = response?.data;
        const logsData = Array.isArray(data) ? data : data?.logs || [];
        const total = Array.isArray(data) ? logsData.length : data?.total || logsData.length;
        const resolvedLimit = logsData.length || 1;
        const page = 1;
        const totalPages = 1;

        dispatch({
            type: LOGS_LIST,
            payload: {
                logs: logsData,
                total,
                page,
                limit: resolvedLimit,
                totalPages
            }
        });
        
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch admin logs';
        setError(dispatch, errorMessage);
        toast.error(errorMessage);
        return false;
    } finally {
        setLoading(dispatch, false);
    }
};

// Get logs statistics
export const getLogsStatistics = () => async (dispatch) => {
    setLoading(dispatch, true);
    try {

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
    } finally {
        setLoading(dispatch, false);
    }
};

// Create sample logs for testing
export const createSampleLogs = () => async (dispatch) => {
    setLoading(dispatch, true);
    try {

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
    } finally {
        setLoading(dispatch, false);
    }
};

// Export logs to CSV
export const exportLogs = (filters = {}) => async (dispatch) => {
    setLoading(dispatch, true);
    try {

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
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to export logs';
        setError(dispatch, errorMessage);
        toast.error(errorMessage);
        return false;
    } finally {
        setLoading(dispatch, false);
    }
};

// Export recipients for a specific log
export const exportLogRecipients = (sessionId) => async (dispatch) => {
  if (!sessionId) {
    toast.error('Session ID is required to export recipients');
    return false;
  }

  try {
    const response = await axiosInstance.get(
      `/logs/csv-upload/session/${sessionId}/recipients/export`,
      {
        responseType: 'blob',
      },
    );

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `csv-upload-recipients-${sessionId}-${new Date()
        .toISOString()
        .split('T')[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);

    toast.success('Recipient email report exported successfully');
    return true;
  } catch (error) {
    const errorMessage =
      error?.response?.data?.message ||
      'Failed to export email recipients for this session';
    toast.error(errorMessage);
    return false;
  }
};

// Cleanup old logs
export const cleanupOldLogs = (days = 30) => async (dispatch) => {
    setLoading(dispatch, true);
    try {

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
    } finally {
        setLoading(dispatch, false);
    }
};

// Clear logs error
export const clearLogsError = () => (dispatch) => {
    dispatch({
        type: CLEAR_LOGS_ERROR
    });
};

