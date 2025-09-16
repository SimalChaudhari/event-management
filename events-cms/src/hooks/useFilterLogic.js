import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Custom hook for managing filter logic
 * Handles URL parameters, state management, and filter operations
 */
const useFilterLogic = ({
    filterAction, // Redux action to dispatch for filtering (e.g., participatedEvents)
    loadUsersAction, // Action to load users for dropdown (e.g., getAllUsersForFilter)
    loadEventsAction, // Action to load events for dropdown (e.g., getAllEventsForFilter)
    dispatch,
    initialFilters = {} // Initial filter values
}) => {
    // State management
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedEventId, setSelectedEventId] = useState('');
    const [users, setUsers] = useState([]);
    const [events, setEvents] = useState([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});

    const location = useLocation();
    const navigate = useNavigate();

    /**
     * Load dropdown data (users and events) - memoized to prevent re-creation
     */
    const loadDropdownData = useCallback(async () => {
        if (!loadUsersAction && !loadEventsAction) return;
        
        setLoadingDropdowns(true);
        try {
            const promises = [];
            
            if (loadUsersAction) {
                promises.push(dispatch(loadUsersAction()));
            }
            
            if (loadEventsAction) {
                promises.push(dispatch(loadEventsAction()));
            }
            
            const results = await Promise.all(promises);
            
            if (loadUsersAction && results[0]) {
               
                setUsers(results[0]);
            }
            
            if (loadEventsAction) {
                const eventIndex = loadUsersAction ? 1 : 0;
                if (results[eventIndex]) {
                
                    setEvents(results[eventIndex]);
                }
            }
        } catch (error) {
            console.error('Error loading dropdown data:', error);
        } finally {
            setLoadingDropdowns(false);
        }
    }, [dispatch, loadUsersAction, loadEventsAction]);

    /**
     * Apply filters with URL parameter updates
     */
    const applyFilters = useCallback(async (filterOverrides = {}) => {
         
        const filters = { ...initialFilters };
        
        // Convert user ID to email for userFilter
        const userIdToUse = filterOverrides.userId || selectedUserId;
        if (userIdToUse && users.length > 0) {
            const selectedUser = users.find(user => user.id === userIdToUse);
            if (selectedUser) {
                filters.userFilter = selectedUser.email;
            } else {
                console.log('❌ User not found for ID:', userIdToUse);
            }
        }
        
        // Convert event ID to name for eventFilter
        const eventIdToUse = filterOverrides.eventId || selectedEventId;
        if (eventIdToUse && events.length > 0) {
            const selectedEvent = events.find(event => event.id === eventIdToUse);
            if (selectedEvent) {
                filters.eventFilter = selectedEvent.name;
            } else {
                console.log('❌ Event not found for ID:', eventIdToUse);
            }
        }

        // Build URL parameters
        const queryParams = new URLSearchParams();
        
        if (userIdToUse) {
            queryParams.append('userId', userIdToUse);
        }
        
        if (eventIdToUse) {
            queryParams.append('eventId', eventIdToUse);
        }

        // Add any additional initial filters to URL
        Object.keys(initialFilters).forEach(key => {
            if (initialFilters[key] && key !== 'userFilter' && key !== 'eventFilter') {
                queryParams.append(key, initialFilters[key]);
            }
        });

        // Update URL without page refresh
        const newUrl = queryParams.toString() 
            ? `${location.pathname}?${queryParams.toString()}`
            : location.pathname;
        
        navigate(newUrl, { replace: true });

        // Update active filters state
        const active = {};
        if (userIdToUse) active.user = userIdToUse;
        if (eventIdToUse) active.event = eventIdToUse;
        Object.keys(initialFilters).forEach(key => {
            if (initialFilters[key]) active[key] = initialFilters[key];
        });
        
        setActiveFilters(active);

        // Dispatch the filter action if provided
        if (filterAction) {
            try {
               
                await dispatch(filterAction(filters));
                return true;
            } catch (error) {
               
                return false;
            }
        }
        
        return true;
    }, [selectedUserId, selectedEventId, users, events, initialFilters, location.pathname, navigate, dispatch, filterAction]);

    /**
     * Clear all filters
     */
    const clearFilters = useCallback(async () => {
        // Reset state
        setSelectedUserId('');
        setSelectedEventId('');
        setActiveFilters({});

        // Clear URL parameters
        navigate(location.pathname, { replace: true });

        // Apply empty filters
        if (filterAction) {
            try {
                await dispatch(filterAction({}));
                return true;
            } catch (error) {
                console.error('Error clearing filters:', error);
                return false;
            }
        }
        
        return true;
    }, [location.pathname, navigate, dispatch, filterAction]);

    /**
     * Read URL parameters and set initial filter state - optimized
     */
    const initializeFromUrl = useCallback(() => {
        const urlParams = new URLSearchParams(location.search);
        const userIdFromUrl = urlParams.get('userId') || '';
        const eventIdFromUrl = urlParams.get('eventId') || '';

        // Only update if values actually changed
        setSelectedUserId(prev => prev !== userIdFromUrl ? userIdFromUrl : prev);
        setSelectedEventId(prev => prev !== eventIdFromUrl ? eventIdFromUrl : prev);

        // Build active filters from URL
        const active = {};
        if (userIdFromUrl) active.user = userIdFromUrl;
        if (eventIdFromUrl) active.event = eventIdFromUrl;
        
        setActiveFilters(prev => {
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(active);
            return hasChanged ? active : prev;
        });
    }, [location.search]);

    /**
     * Get filter data for external use
     */
    const getFilterData = useCallback(() => {
        return {
            selectedUserId,
            selectedEventId,
            users,
            events,
            loadingDropdowns,
            activeFilters,
            hasActiveFilters: Object.keys(activeFilters).length > 0
        };
    }, [selectedUserId, selectedEventId, users, events, loadingDropdowns, activeFilters]);

    /**
     * Manual filter setters (for external control)
     */
    const setFilters = useCallback((filters) => {
        if (filters.userId !== undefined) setSelectedUserId(filters.userId);
        if (filters.eventId !== undefined) setSelectedEventId(filters.eventId);
    }, []);

    // Initialize on mount and URL changes
    useEffect(() => {
        initializeFromUrl();
    }, [initializeFromUrl]);

    // Load dropdown data and initial data once on mount
    useEffect(() => {
        let mounted = true;
        
        const initializeData = async () => {
            if (!mounted) return;
            
            // Load dropdown data
            await loadDropdownData();
            
            if (!mounted) return;
            
            // Load initial data (all events) if no URL parameters
            const urlParams = new URLSearchParams(location.search);
            const hasUrlFilters = urlParams.get('userId') || urlParams.get('eventId');
            
            if (!hasUrlFilters && filterAction) {
              
                dispatch(filterAction({})); // Empty object = all data
            }
        };
        
        initializeData();
        
        return () => {
            mounted = false;
        };
    }, []); // Empty dependency - run only once

    // Apply filters from URL when data is ready (optimized to avoid re-renders)
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const userIdFromUrl = urlParams.get('userId');
        const eventIdFromUrl = urlParams.get('eventId');
        
        // Only proceed if we have URL filters and necessary data is loaded
        if (!(userIdFromUrl || eventIdFromUrl)) return;
        if (!filterAction) return;
        if (userIdFromUrl && users.length === 0) return;
        if (eventIdFromUrl && events.length === 0) return;
        
        const filters = { ...initialFilters };
        let hasValidFilters = false;
        
        if (userIdFromUrl && users.length > 0) {
            const selectedUser = users.find(user => user.id === userIdFromUrl);
            if (selectedUser) {
                filters.userFilter = selectedUser.email;
                hasValidFilters = true;
             
            }
        }
        
        if (eventIdFromUrl && events.length > 0) {
            const selectedEvent = events.find(event => event.id === eventIdFromUrl);
            if (selectedEvent) {
                filters.eventFilter = selectedEvent.name;
                hasValidFilters = true;
               
            }
        }
        
        if (hasValidFilters) {
           
            dispatch(filterAction(filters));
        }
    }, [users.length, events.length, location.search]); // Only re-run when data length changes or URL changes

    return {
        // State
        selectedUserId,
        selectedEventId,
        users,
        events,
        loadingDropdowns,
        activeFilters,
        
        // Actions
        applyFilters,
        clearFilters,
        setSelectedUserId,
        setSelectedEventId,
        setFilters,
        loadDropdownData,
        
        // Utilities
        getFilterData,
        hasActiveFilters: Object.keys(activeFilters).length > 0
    };
};

export default useFilterLogic;
