import { toast } from 'react-toastify';
import axiosInstance from '../../configs/axiosInstance';
import { EVENT_BY_ID, EVENT_LIST, EVENT_DELETE, EVENT_FILTER_LIST, EXHIBITOR_LIST, GALLERY_LIST, PARTICIPATED_EVENTS, UPCOMING_EVENT_LIST, UPDATE_EVENT_TAB_VISIBILITY, EVENT_LOADING, COUNTRY_LIST, SPEAKER_LIST, CATEGORY_LIST, CREATE_EVENT, UPDATE_EVENT, ATTENDANCE_LOADING, ATTENDANCE_ERROR, REGISTERED_PARTICIPANTS_WITH_ATTENDANCE, EVENT_BOOTH_LIST } from '../constants/actionTypes';
import { buildUrlWithParams } from '../../utils/buildQueryParams';

// Helper function to dispatch loading state
const setEventLoading = (dispatch, loading) => {
    dispatch({
        type: EVENT_LOADING,
        payload: loading
    });
};

export const eventList = (filters = {}) => async (dispatch, getState) => {
    try {
        setEventLoading(dispatch, true);
        
        // Ensure pagination parameters are always included (defaults for server-side DataTable)
        const filtersWithPagination = {
            page: filters.page || 1,
            limit: filters.limit || 10,
            sortBy: filters.sortBy || 'startDate',
            sortOrder: filters.sortOrder || 'DESC',
            ...filters // Override with any provided filters
        };
        
        // Build query parameters using reusable utility
        const { buildUrlWithParams } = require('../../utils/buildQueryParams');
        const url = buildUrlWithParams('/events', filtersWithPagination, {});
        
        const response = await axiosInstance.get(url);
        const eventsData = response.data;
        
        dispatch({
            type: EVENT_LIST,
            payload: eventsData // Assuming response contains the customers data
        });
        
        // CRITICAL: Always store filter.events when available - it contains ALL events for dropdown (not paginated)
        // filter.events is provided by backend for admin users and contains all available events
        if (eventsData?.filter?.events && Array.isArray(eventsData.filter.events)) {
            // Always update eventFilterList with filter.events as it contains ALL events for dropdown
            dispatch({
                type: EVENT_FILTER_LIST,
                payload: eventsData.filter.events
            });
        } else {
            // Fallback: Only store events array if eventFilterList is empty
            // This prevents overwriting with paginated results
            const state = getState();
            if (!state.event?.eventFilterList || state.event.eventFilterList.length === 0) {
                const filterEvents = eventsData?.events || [];
                if (Array.isArray(filterEvents) && filterEvents.length > 0) {
                    dispatch({
                        type: EVENT_FILTER_LIST,
                        payload: filterEvents
                    });
                }
            }
        }
        
        return eventsData; // Return full response including filter data
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
    return false; // Return false for any errors
};

export const eventById = (id) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get(`/events/${id}`);
        dispatch({
            type: EVENT_BY_ID,
            payload: response.data
        });
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
};

export const upcomingEventList = (filters = {}) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        // Build query parameters, always include upcoming=true
        const queryParams = new URLSearchParams();
        queryParams.append('upcoming', 'true');
        
        if (filters.eventName) {
            queryParams.append('eventName', filters.eventName);
        }
        
        if (filters.keyword) {
            queryParams.append('keyword', filters.keyword);
        }
        
        if (filters.startDate) {
            queryParams.append('startDate', filters.startDate);
        }
        
        if (filters.endDate) {
            queryParams.append('endDate', filters.endDate);
        }
        
        if (filters.type) {
            queryParams.append('type', filters.type);
        }
        
        if (filters.location) {
            queryParams.append('location', filters.location);
        }
        
        if (filters.category) {
            queryParams.append('category', filters.category);
        }
        
        if (filters.globalSearch) {
            queryParams.append('globalSearch', filters.globalSearch);
        }
        
        const queryString = queryParams.toString();
        const url = `/events?${queryString}`;
        
        const response = await axiosInstance.get(url);
        dispatch({
            type: UPCOMING_EVENT_LIST,
            payload: response.data // Assuming response contains the customers data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
    return false; // Return false for any errors
};

export const createEvent = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/events/create', data);
       
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Event registered successfully!');
            
            // Get the created event data from response or fetch full details
            let createdEvent = response.data?.data;
            
            // If response doesn't have full event details, fetch it
            if (createdEvent?.id && (!createdEvent.speakers && !createdEvent.categories)) {
                const eventId = createdEvent.id;
                const eventResponse = await axiosInstance.get(`/events/${eventId}`);
                createdEvent = eventResponse.data?.data || eventResponse.data;
            }
            
            // Update Redux store directly with the new event
            if (createdEvent?.id) {
                dispatch({
                    type: CREATE_EVENT,
                    payload: createdEvent
                });
                
                return { success: true, event: createdEvent };
            }
            
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
        return { success: false };
    }
};

// Track ongoing update requests to prevent duplicate calls
const ongoingUpdates = new Map();

export const editEvent = (id, data) => async (dispatch) => {
    // Prevent duplicate update calls for the same event
    if (ongoingUpdates.has(id)) {
        console.warn(`Update already in progress for event ${id}`);
        return { success: false, message: 'Update already in progress' };
    }
    
    ongoingUpdates.set(id, true);
    
    try {
        const response = await axiosInstance.put(`/events/update/${id}`, data);

        // Check if the response is successful
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Event updated successfully!');
            
            // Get the updated event data from response
            let updatedEvent = response.data?.data;
            
            // Only fetch full event details if response doesn't have event data at all
            // Don't check for speakers/categories as they might not be in the update response
            if (!updatedEvent || !updatedEvent.id) {
                // Only fetch if we don't have basic event data
                const eventResponse = await axiosInstance.get(`/events/${id}`);
                updatedEvent = eventResponse.data?.data || eventResponse.data;
            }
            
            // Update Redux store directly with the updated event
            if (updatedEvent?.id) {
                dispatch({
                    type: UPDATE_EVENT,
                    payload: updatedEvent
                });
                
                return { success: true, data: updatedEvent, event: updatedEvent };
            }
            
            return { success: true };
        }
        return { success: false };
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
        return { success: false };
    } finally {
        // Remove from ongoing updates map
        ongoingUpdates.delete(id);
    }
};

export const participatedEvents = (filters = {}) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        // Build query parameters
        const queryParams = new URLSearchParams();
        
        // Support both ID-based and name-based filtering
        if (filters.userId) {
            queryParams.append('userId', filters.userId);
        } else if (filters.userFilter) {
            queryParams.append('user', filters.userFilter);
        }
        
        if (filters.eventId) {
            queryParams.append('eventId', filters.eventId);
        } else if (filters.eventFilter) {
            queryParams.append('event', filters.eventFilter);
        }
        
        if (filters.startDate) {
            queryParams.append('startDate', filters.startDate);
        }
        
        if (filters.endDate) {
            queryParams.append('endDate', filters.endDate);
        }
        
        if (filters.filter) {
            queryParams.append('filter', filters.filter);
        }
        
        const queryString = queryParams.toString();
        const url = queryString ? `/register-events/all?${queryString}` : '/register-events/all';
        
        const response = await axiosInstance.get(url);
        dispatch({
            type: PARTICIPATED_EVENTS,
            payload: response.data
        });
        return true;
    } catch (error) {
        // Check if error response exists and handle error message
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
    return false; // Return false for any errors
};

export const registerEventById = (id) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get(`/register-events/${id}`);
        return response.data;
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
    return false; // Return false for any errors or unsuccessful attempts

};

// All Filter Delete Events

export const eventDelete = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/events/delete/${id}`);
        // Update Redux state directly without refetching
        dispatch({
            type: EVENT_DELETE,
            payload: id
        });
        toast.success('Event deleted successfully!');
        return true;
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors or unsuccessful attempts
};

export const registrationDelete = (id) => async (dispatch) => {
    try {
        await axiosInstance.delete(`/register-events/delete/${id}`);
        return true;
    } catch (error) {
        // Handle errors appropriately
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false; // Return false for any errors or unsuccessful attempts
};


export const createRegisterEvent = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/register-events/admin/create', data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success(response.data.message || 'Register event created successfully!');
            await dispatch(participatedEvents());
            return true;
        }
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

export const removeEventImage = (eventId, imagePath) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/images/${eventId}`, {
            data: { imagePath }
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Image removed successfully!');
            // Return the updated images array from response
            return response.data.data.images;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage || 'Error removing image');
    }
    return false;
};

export const removeEventDocument = (eventId, documentPath) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/documents/${eventId}`, {
            data: { documentPath }
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Document removed successfully!');
            // Return the updated documents array from response
            return response.data.data.documents;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage || 'Error removing document');
    }
    return false;
};

export const galleryList = () => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get('/gallery');
        dispatch({
            type: GALLERY_LIST,
            payload: response.data
        });
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
    return false;
};

export const exhibitorGet = () => async (dispatch) => {
    try {
        // setEventLoading(dispatch, true);
        const response = await axiosInstance.get('/exhibitors');
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        // setEventLoading(dispatch, false);
    }
};

export const createEventStamp = (data) => async (dispatch) => {
    try {
        const response = await axiosInstance.post('/events/event-stamps/create-or-update', data);
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
};

export const eventGetStamp = () => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get('/events/event-stamps');
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    } finally {
        setEventLoading(dispatch, false);
    }
};

export const removeEventStampImage = (eventId, imagePath) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/event-stamps/images/${eventId}`, {
            data: { imagePath }
        });

        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Image removed successfully!');
            // Return the updated images array from response
            return response.data.data.eventStampImages;
        }
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
};
export const removeEventFloorPlan = (eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/floor-plan/${eventId}`);
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
};

export const removeEventBackgroundImage = (eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/events/background-image/${eventId}`);
        return response.data;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
};

export const adminUpdateRegisterEvent = (id, data) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/register-events/admin/update/${id}`, data);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Registration updated successfully!');
            // Refresh the data after update
            await dispatch(participatedEvents());
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

export const adminDeleteRegisterEvent = (id) => async (dispatch) => {
    try {
        const response = await axiosInstance.delete(`/register-events/admin/delete/${id}`);
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Registration deleted successfully!');
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message;
        toast.error(errorMessage);
    }
    return false;
};

// Get all users for dropdown filter
export const getAllUsersForFilter = () => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        const response = await axiosInstance.get('/users');
        return response.data?.data || [];
    } catch (error) {
        console.error('Error fetching users for filter:', error);
        return [];
    } finally {
        setEventLoading(dispatch, false);
    }
};

// Get all events for dropdown filter
export const getAllEventsForFilter = () => async (dispatch, getState) => {
    try {
        // Check if events already exist in Redux
        const state = getState();
        const existingEvents = state.event?.eventFilterList;
        
        if (existingEvents && existingEvents.length > 0) {
            // Return existing events from Redux
            return existingEvents;
        }

        setEventLoading(dispatch, true);
        // CRITICAL: Request ALL events for filter dropdown (not paginated)
        // Use a very high limit to get all events, or fetch from filter response if available
        const response = await axiosInstance.get('/events', {
            params: {
                limit: 10000, // High limit to get all events
                page: 1
            }
        });
        
        // Try to get events from filter.events first (contains all events for dropdown)
        // Otherwise use events array (might be paginated)
        const events = response.data?.filter?.events || response.data?.events || [];
        
        // Store in Redux for future use
        dispatch({
            type: EVENT_FILTER_LIST,
            payload: events
        });
        
        return events;
    } catch (error) {
        console.error('Error fetching events for filter:', error);
        return [];
    } finally {
        setEventLoading(dispatch, false);
    }
};

// Update event tab visibility
export const exportRegisteredUsersByEvent = (eventId) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        
        const response = await axiosInstance.get(`/register-events/export/event/${eventId}`, {
            responseType: 'blob'
        });

        // Create blob and trigger download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        const fileName = `event-registrations-${eventId}-${new Date().toISOString().split('T')[0]}.csv`;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success('Registered users exported successfully');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to export registered users';
        toast.error(errorMessage);
        return false;
    } finally {
        setEventLoading(dispatch, false);
    }
};

export const updateEventTabVisibility = (eventId, tabVisibilitySettings) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/events/${eventId}/tab-visibility`, tabVisibilitySettings);
        
        if (response && response.status >= 200 && response.status < 300) {
            toast.success('Tab visibility updated successfully!');
            
            // Dispatch action to update the event data in Redux store
            dispatch({
                type: UPDATE_EVENT_TAB_VISIBILITY,
                payload: {
                    eventId,
                    tabVisibility: tabVisibilitySettings
                }
            });
            
            return true;
        }
        return false;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update tab visibility';
        toast.error(errorMessage);
        return false;
    }
};

// Get countries list
export const getCountries = () => async (dispatch) => {
    try {
        // setEventLoading(dispatch, true);
        const response = await axiosInstance.get('countries');
        return response.data || [];
    } catch (error) {
        console.error('Error fetching countries:', error);
        toast.error('Failed to fetch countries');
        return [];
    } finally {
        // setEventLoading(dispatch, false);
    }
};

// Get speakers list for event form
export const getSpeakersForEvent = () => async (dispatch) => {
    try {
        // setEventLoading(dispatch, true);
        const response = await axiosInstance.get('users/speakers/get');
        // console.log(response.data);
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching speakers:', error);
        toast.error('Failed to fetch speakers');
        return [];
    } finally {
        // setEventLoading(dispatch, false);
    }
};

// Get speakers assigned to a specific event
// Note: Speakers are included in event data, so we fetch event and extract speakers
export const getEventSpeakers = (eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/events/${eventId}`);
        if (response.data?.success) {
            // Extract speakers from event data
            const eventData = response.data.data;
            const speakers = eventData?.speakers || eventData?.speakersData || [];
            
            // Transform speakers to match expected format if needed
            const formattedSpeakers = Array.isArray(speakers) ? speakers.map(speaker => {
                // Handle different speaker data structures
                if (speaker.speaker) {
                    return speaker.speaker; // If nested in eventSpeaker
                }
                return speaker; // If direct speaker object
            }).filter(Boolean) : [];
            
            return { success: true, data: formattedSpeakers };
        }
        return { success: false, data: [] };
    } catch (error) {
        console.error('Error fetching event speakers:', error);
        // Don't show toast error here, let caller handle it
        return { success: false, data: [] };
    }
};

// Get event booths with search filter and pagination
export const getEventBooths = (eventId, filters = {}) => async (dispatch) => {
    try {
        setEventLoading(dispatch, true);
        
        // Build URL with query parameters
        const url = buildUrlWithParams(`/events/${eventId}/booths`, filters);
        
        const response = await axiosInstance.get(url);
        
        dispatch({
            type: EVENT_BOOTH_LIST,
            payload: {
                data: response.data?.data || [],
                pagination: response.data?.metadata || {}
            }
        });
        
        return {
            success: true,
            data: response.data?.data || [],
            pagination: response.data?.metadata || {}
        };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch event booths';
        toast.error(errorMessage);
        return {
            success: false,
            data: [],
            pagination: {}
        };
    } finally {
        setEventLoading(dispatch, false);
    }
};

// Get categories list for event form
export const getCategoriesForEvent = () => async (dispatch) => {
    try {
        // setEventLoading(dispatch, true);
        const response = await axiosInstance.get('categories/get');
        if (response.data.success) {
            return response.data.data || [];
        }
        return [];
    } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to fetch categories');
        return [];
    } finally {
        // setEventLoading(dispatch, false);
    }
};

// Get registered participants with attendance status for an event
export const getRegisteredParticipantsWithAttendance = (eventId) => async (dispatch) => {
    try {
        dispatch({
            type: ATTENDANCE_LOADING,
            payload: true
        });

        const response = await axiosInstance.get(`/attendance/event/${eventId}/registered-participants`);
        
        if (response.data.success) {
            dispatch({
                type: REGISTERED_PARTICIPANTS_WITH_ATTENDANCE,
                payload: response.data.data
            });
            
            return {
                success: true,
                data: response.data.data
            };
        }
        
        return {
            success: false,
            data: null
        };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch attendance data';
        dispatch({
            type: ATTENDANCE_ERROR,
            payload: errorMessage
        });
        toast.error(errorMessage);
        return {
            success: false,
            data: null
        };
    } finally {
        dispatch({
            type: ATTENDANCE_LOADING,
            payload: false
        });
    }
};

// Download CSV template for admin info
export const downloadAdminInfoCsvTemplate = () => async (dispatch) => {
    try {
        const response = await axiosInstance.get('/admin-info/csv-template', {
            responseType: 'blob',
        });
        
        // Create blob and download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'admin-info-template.csv');
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        
        toast.success('CSV template downloaded successfully');
        return true;
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to download CSV template';
        toast.error(errorMessage);
        return false;
    }
};

// Upload CSV file for admin info
export const uploadAdminInfoCsv = (file, eventId) => async (dispatch) => {
    try {
        if (!file) {
            toast.error('Please select a CSV file');
            return { success: false, message: 'No file selected' };
        }

        if (!eventId) {
            toast.error('Please select an event');
            return { success: false, message: 'No event selected' };
        }

        const formData = new FormData();
        formData.append('csvFile', file);
        formData.append('eventId', eventId);

        const response = await axiosInstance.post('/admin-info/upload-csv', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });

        if (response.data.success) {
            const result = response.data.data;
            const message = result.message || 'CSV uploaded successfully';
            toast.success(message);
            
            // Show detailed results if available
            if (result.successfulUpdates > 0 || result.failedUpdates > 0) {
                const details = `Successful: ${result.successfulUpdates}, Failed: ${result.failedUpdates}`;
                if (result.errors && result.errors.length > 0) {
                    console.error('CSV Upload Errors:', result.errors);
                }
            }
            
            return { 
                success: true, 
                data: result,
                message 
            };
        }
        
        return { success: false, message: response.data.message || 'Upload failed' };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to upload CSV file';
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
    }
};

// Update event-level admin info (luckyDrawDateTime and additionalInformation)
export const updateEventAdminInfo = (eventId, data) => async (dispatch) => {
    try {
        const response = await axiosInstance.put(`/admin-info/event/${eventId}`, data);
        
        if (response.data.success) {
            toast.success(response.data.message || 'Admin information updated successfully');
            return { success: true, data: response.data.data };
        }
        
        return { success: false, message: response.data.message || 'Update failed' };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to update admin information';
        toast.error(errorMessage);
        return { success: false, message: errorMessage };
    }
};

// Get event-level admin info
export const getEventAdminInfo = (eventId) => async (dispatch) => {
    try {
        const response = await axiosInstance.get(`/admin-info/event/${eventId}`);
        
        if (response.data.success && response.data.data && response.data.data.length > 0) {
            // Get the first adminInfo record to extract common values
            const firstRecord = response.data.data[0];
            return {
                success: true,
                data: {
                    luckyDrawDateTime: firstRecord.luckyDrawDateTime,
                    additionalInformation: firstRecord.additionalInformation
                }
            };
        }
        
        return { success: true, data: null };
    } catch (error) {
        const errorMessage = error?.response?.data?.message || 'Failed to fetch admin information';
        return { success: false, message: errorMessage };
    }
};

