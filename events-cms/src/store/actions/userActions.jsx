import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { USER_LIST, USER_LOADING, USER_ERROR, CREATE_USER, UPDATE_USER, DELETE_USER, USER_BY_ID } from '../constants/actionTypes';

// Helper function to dispatch loading state
const setLoading = (dispatch, loading) => {
    dispatch({
        type: USER_LOADING,
        payload: loading
    });
};

export const userList = (roleFilter = null) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        // Build the URL with role filter if provided
        let url = '/users';
        if (roleFilter && (roleFilter === 'user' || roleFilter === 'exhibitor')) {
            url += `?role=${roleFilter}`;
        }

        const response = await axiosInstance.get(url);
        dispatch({
            type: USER_LIST,
            payload: response.data?.data
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch users';
        toast.error(errorMessage);
        return false;
    } finally {
        setLoading(dispatch, false);
    }
};

export const userById = (id) => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        const response = await axiosInstance.get(`/users/get/${id}`);
        dispatch({
            type: USER_BY_ID,
            payload: response.data?.data
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch user details';
        toast.error(errorMessage);

        return null;
    } finally {
        setLoading(dispatch, false);
    }
};

export const createUser = (userData) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/auth/register-admin', userData);
        dispatch({
            type: CREATE_USER,
            payload: response.data?.data
        });
        toast.success('User created successfully');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to create user';
        toast.error(errorMessage);
        return false;
    }
};

export const editUser = (id, userData) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/users/update/${id}`, userData);
        dispatch({
            type: UPDATE_USER,
            payload: response.data?.data
        });
        toast.success('User updated successfully');
        return response?.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update user';
        toast.error(errorMessage);
        return false;
    }
};

export const removeProfilePicture = () => async (dispatch) => {
    try {
        const response = await axiosInstance.delete('/users/profile/picture');
        dispatch({
            type: UPDATE_USER,
            payload: response.data?.data
        });
        toast.success('Profile picture removed successfully');
        return response?.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to remove profile picture';
        toast.error(errorMessage);
        return false;
    }
};

export const deleteUser = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/users/delete/${id}`);
        dispatch({
            type: DELETE_USER,
            payload: id
        });
        toast.success('User deleted successfully');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to delete user';
        toast.error(errorMessage);

        return false;
    }
};

// CSV Upload functionality
export const uploadCsvUsers = (csvData, options = {}) => async (dispatch) => {
    try {
        setLoading(dispatch, true);

        const resolvedOptions = typeof options === 'string' ? { eventId: options } : options || {};
        const { eventId, fileName } = resolvedOptions;

        if (!eventId) {
            const message = 'Event selection is required before uploading the CSV.';
            toast.error(message);
            return { success: false, message };
        }
        
        let response;
        
        // Check if csvData is a file or array of user data
        if (csvData instanceof File) {
            // Handle file upload
            const formData = new FormData();
            formData.append('csvFile', csvData);
            formData.append('eventId', eventId);
            if (fileName) {
                formData.append('fileName', fileName);
            } else if (csvData?.name) {
                formData.append('fileName', csvData.name);
            }

            response = await axiosInstance.post('/auth/upload-csv-users', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
        } else if (Array.isArray(csvData)) {
            // Handle JSON data - send as regular JSON request body
            response = await axiosInstance.post('/auth/upload-csv-users', {
                users: csvData,
                eventId,
                fileName: fileName || undefined,
            }, {
                headers: {
                    'Content-Type': 'application/json',
                }
            });
        } else {
            throw new Error('Invalid data format. Expected File or Array.');
        }

        const result = {
            success: response.data.success,
            message: response.data.message,
            data: response.data.data
        };

        if (result.success) {
            if (result?.data?.eventAssociation?.eventName) {
                toast.success(`${result.message} (${result.data.eventAssociation.eventName})`);
            } else {
                toast.success(result.message);
            }
            // Refresh user list after successful upload
            await dispatch(userList());
        } else {
            toast.error(result.message);
        }

        return result;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to upload CSV file';
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
    } finally {
        setLoading(dispatch, false);
    }
};

// Download Sample CSV
export const downloadSampleCsv = () => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        
        // Create sample data with headers and example values
        const sampleFields = [
            {
                header: 'salutation',
                values: ['Mr', 'Ms', 'Prof']
            },
            {
                header: 'firstName',
                values: ['John', 'Jane', 'Mike']
            },
            {
                header: 'lastName', 
                values: ['Doe', 'Smith', 'Johnson']
            },
            {
                header: 'email',
                values: ['john.doe@example.com', 'jane.smith@example.com', 'mike.johnson@example.com']
            },
            {
                header: 'mobile',
                values: ['81234567', '91234567', '82345678']
            },
            {
                header: 'company',
                values: ['Tech Corp', 'Design Studio', 'Marketing Agency']
            },
            {
                header: 'designation',
                values: ['Software Engineer', 'UI/UX Designer', 'Marketing Manager']
            }
        ];

        const response = await axiosInstance.post('/auth/download-csv', { fields: sampleFields }, {
            responseType: 'blob'
        });

        // Create blob and trigger download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'sample_users.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Sample CSV downloaded successfully');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to download sample CSV';
        toast.error(errorMessage);
        return false;
    } finally {
        setLoading(dispatch, false);
    }
};

// Export Users to CSV (only users with role "user", no exhibitors/speakers)
export const exportUsers = () => async (dispatch) => {
    try {
        setLoading(dispatch, true);
        
        const response = await axiosInstance.get('/users/export', {
            responseType: 'blob'
        });

        // Create blob and trigger download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url2 = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url2;
        const fileName = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url2);

        toast.success('Users exported successfully');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to export users';
        toast.error(errorMessage);
        return false;
    } finally {
        setLoading(dispatch, false);
    }
};