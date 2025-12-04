import { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Unified filter hook for managing filter logic across all pages
 * Handles URL parameters, state management, and filter operations
 * 
 * @param {Object} config - Configuration object
 * @param {Function} config.filterAction - Redux action to dispatch for filtering
 * @param {Function} config.loadUsersAction - Action to load users for dropdown (optional)
 * @param {Function} config.loadEventsAction - Action to load events for dropdown (optional)
 * @param {Function} config.dispatch - Redux dispatch function
 * @param {Object} config.initialFilters - Initial filter values
 * @param {Array} config.initialUsers - Initial users data (from backend filter response)
 * @param {Array} config.initialEvents - Initial events data (from backend filter response)
 * @param {String} config.filterMode - Filter mode: 'registered' (userFilter/eventFilter) or 'event' (eventName) - default: 'registered'
 */
const useFilterLogic = ({
    filterAction, // Redux action to dispatch for filtering (e.g., participatedEvents, eventList, upcomingEventList) - can be null to skip API calls
    loadUsersAction, // Action to load users for dropdown (e.g., getAllUsersForFilter) - optional
    loadEventsAction, // Action to load events for dropdown (e.g., getAllEventsForFilter) - optional
    dispatch,
    initialFilters = {}, // Initial filter values
    initialUsers = [], // Initial users data (from backend filter response)
    initialEvents = [], // Initial events data (from backend filter response)
    filterMode = 'registered' // 'registered' uses userFilter/eventFilter, 'event' uses eventName
}) => {
    // State management
    const [selectedUserId, setSelectedUserId] = useState('');
    const [selectedEventId, setSelectedEventId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [users, setUsers] = useState(initialUsers);
    const [events, setEvents] = useState(initialEvents);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});

    const location = useLocation();
    const navigate = useNavigate();
    
    // Refs to track if filters have been applied to prevent infinite loops
    const filtersAppliedRef = useRef(false);
    const lastUrlParamsRef = useRef('');
    const hasInitializedRef = useRef(false);
    const isApplyingFiltersRef = useRef(false); // Track when applyFilters is actively running
    const eventsLengthRef = useRef(initialEvents.length); // Track events array length to detect when events actually load
    const previousEventsRef = useRef(initialEvents); // Track previous events to detect actual changes
    
    // Refs to preserve the full lists for dropdown (not filtered results)
    const fullEventsListRef = useRef(initialEvents);
    const fullUsersListRef = useRef(initialUsers);
    
    // Keep refs in sync with state (without causing re-renders)
    useEffect(() => {
        if (events.length > 0 && (fullEventsListRef.current.length === 0 || events.length > fullEventsListRef.current.length)) {
            fullEventsListRef.current = events;
        }
    }, [events]);

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
                const loadedEvents = results[eventIndex];
                
                if (loadedEvents) {
                    // CRITICAL: Only update events if loaded events have more items than current events
                    // This preserves initialEvents (from filterData) if they have more events
                    // Compare with current events state, not initialEvents (which might be stale)
                    setEvents(prevEvents => {
                        const currentCount = prevEvents?.length || 0;
                        const loadedCount = Array.isArray(loadedEvents) ? loadedEvents.length : 0;
                        
                        // Only update if loaded events have more items, or if we have no events
                        if (loadedCount > currentCount || currentCount === 0) {
                            return loadedEvents;
                        }
                        // Keep existing events if they have more or equal items
                        return prevEvents;
                    });
                }
            }
        } catch (error) {
            console.error('Error loading dropdown data:', error);
        } finally {
            setLoadingDropdowns(false);
        }
    }, [dispatch, loadUsersAction, loadEventsAction]);

    /**
     * Apply filters with URL parameter updates - IMMEDIATE API CALL
     */
    const applyFilters = useCallback(async (filterOverrides = {}) => {
        // CRITICAL: Start with empty object, don't use initialFilters to avoid carrying over old values
        // Only add filters that are explicitly selected/active
        const filters = {};
        
        // Preserve page-level filters from initialFilters (e.g., upcoming: true)
        if (initialFilters) {
            Object.keys(initialFilters).forEach(key => {
                // Only preserve non-filter keys (like 'upcoming', 'filter', etc.)
                if (key !== 'userId' && key !== 'userFilter' && 
                    key !== 'eventId' && key !== 'eventFilter' && key !== 'eventName' &&
                    key !== 'startDate' && key !== 'endDate') {
                    filters[key] = initialFilters[key];
                }
            });
        }
        
        // Handle user filter (only for registered events mode)
        // CRITICAL: Always use filterOverrides first (from FilterComponent) - these are the latest values
        const userIdToUse = filterOverrides.userId !== undefined ? filterOverrides.userId : selectedUserId;
        
        // Only add user filter if a user is actually selected (not empty)
        if (userIdToUse && filterMode === 'registered') {
            // Prefer userId for exact matching (backend supports it)
            filters.userId = userIdToUse;
        }
        
        // Handle event filter - different format based on mode
        // CRITICAL: Always use filterOverrides first (from FilterComponent) - these are the latest values
        const eventIdToUse = filterOverrides.eventId !== undefined ? filterOverrides.eventId : selectedEventId;
        
        // CRITICAL: If FilterComponent passed eventName directly, use it (most reliable)
        // This avoids lookup issues when events array isn't populated yet
        const eventNameFromOverride = filterOverrides.eventName;
        
        // Declare eventNameToUse outside the if block so it's accessible when building URL parameters
        let eventNameToUse = null;
        
        // Only add event filter if an event is actually selected (not empty)
        if (eventIdToUse) {
            // Priority 1: Use eventName from filterOverrides (passed directly from FilterComponent)
            if (eventNameFromOverride) {
                eventNameToUse = eventNameFromOverride;
            } else {
                // Priority 2: Look up event name from events state or initialEvents
                const eventsToSearch = events.length > 0 ? events : (initialEvents.length > 0 ? initialEvents : []);
                
                if (eventsToSearch.length > 0) {
                    // Try to find event by ID - handle both string and number IDs
                    const selectedEvent = eventsToSearch.find(event => {
                        const eventId = String(event.id || event.eventId || '');
                        const searchId = String(eventIdToUse);
                        return eventId === searchId;
                    });
                    
                    if (selectedEvent) {
                        // Get event name - handle different property names
                        eventNameToUse = selectedEvent.name || selectedEvent.eventName || selectedEvent.event_name || null;
                    }
                }
            }
            
            // Apply the event filter if we have the name (or use eventId for registered mode)
            if (eventNameToUse) {
                if (filterMode === 'registered') {
                    // For registered events: use eventFilter with name
                    filters.eventFilter = eventNameToUse;
                } else {
                    // For event listing pages: use eventName
                    filters.eventName = eventNameToUse;
                }
            } else {
                // Event name not available - use eventId for registered mode, skip for event mode
                if (filterMode === 'registered') {
                    filters.eventId = eventIdToUse;
                } else {
                    // For event mode, we need event name - log for debugging
                    console.warn('Event name not available for ID:', eventIdToUse, 'Events state:', events.length, 'Initial events:', initialEvents.length);
                }
            }
        }

        // Get date filters - only add if they have values
        // CRITICAL: Always use filterOverrides first (from FilterComponent) - these are the latest values
        const startDateToUse = filterOverrides.startDate !== undefined ? filterOverrides.startDate : startDate;
        const endDateToUse = filterOverrides.endDate !== undefined ? filterOverrides.endDate : endDate;
        
        // CRITICAL: Only add date filters if they have actual values (not empty strings)
        if (startDateToUse && startDateToUse.trim() !== '') {
            filters.startDate = startDateToUse;
        }
        if (endDateToUse && endDateToUse.trim() !== '') {
            filters.endDate = endDateToUse;
        }

        // Build URL parameters - use IDs directly if available
        // Only add parameters that are actually selected (not empty)
        const queryParams = new URLSearchParams();
        
        if (userIdToUse) {
            queryParams.append('userId', userIdToUse);
        }
        
        // For event mode: add both eventName (for DataTable API) and eventId (for state management)
        // For registered mode: add eventId to URL
        if (eventIdToUse) {
            if (filterMode === 'event' && eventNameToUse) {
                // For event listing pages: add both eventName (for API) and eventId (for state)
                queryParams.append('eventName', eventNameToUse);
                queryParams.append('eventId', eventIdToUse); // Keep eventId in URL to maintain dropdown selection
            } else {
                // For registered mode or if eventName not available: use eventId
                queryParams.append('eventId', eventIdToUse);
            }
        }

        if (startDateToUse) {
            queryParams.append('startDate', startDateToUse);
        }

        if (endDateToUse) {
            queryParams.append('endDate', endDateToUse);
        }

        // Update URL for bookmarking/sharing
        const newUrl = queryParams.toString() 
            ? `${location.pathname}?${queryParams.toString()}`
            : location.pathname;
        
        const newUrlSearch = queryParams.toString();
        
        // Update active filters state - only include filters that are actually selected
        const active = {};
        if (userIdToUse) active.user = userIdToUse;
        if (eventIdToUse) active.event = eventIdToUse;
        if (startDateToUse) active.startDate = startDateToUse;
        if (endDateToUse) active.endDate = endDateToUse;
        
        setActiveFilters(active);
        
        // Debug: Log filters being sent
        console.log('🔍 Applying filters:', {
            filters,
            eventIdToUse,
            startDateToUse,
            endDateToUse,
            eventsAvailable: events.length > 0 || initialEvents.length > 0,
            eventsCount: events.length,
            initialEventsCount: initialEvents.length
        });
        
        // CRITICAL: Set flag to indicate we're applying filters
        // This prevents useEffect from running while we're applying filters
        isApplyingFiltersRef.current = true;
        
        // CRITICAL: Update refs BEFORE dispatch and navigation to prevent useEffect from interfering
        // Set the NEW URL params so useEffect knows this URL was already handled
        // Normalize the URL params string (always start with ? if it has params)
        const newUrlParamsString = newUrlSearch ? `?${newUrlSearch}` : '';
        lastUrlParamsRef.current = newUrlParamsString;
        filtersAppliedRef.current = true;
        
        // IMMEDIATELY dispatch the action with filters - single API call
        if (filterAction) {
            try {
                // Dispatch the action
                await dispatch(filterAction(filters));
                
                // Navigate to new URL AFTER dispatch completes (for bookmarking/sharing)
                // The refs are already set, so useEffect will skip when URL changes
                navigate(newUrl, { replace: true });
                
                // Reset flag after a short delay to allow navigation to complete
                // This ensures useEffect sees the flag and skips
                setTimeout(() => {
                    isApplyingFiltersRef.current = false;
                }, 100);
                
                return true;
            } catch (error) {
                console.error('Error applying filters:', error);
                // Reset refs on error so user can retry
                filtersAppliedRef.current = false;
                lastUrlParamsRef.current = location.search; // Reset to current URL
                isApplyingFiltersRef.current = false;
                return false;
            }
        } else {
            // If no filterAction, just update URL
            navigate(newUrl, { replace: true });
            setTimeout(() => {
                isApplyingFiltersRef.current = false;
            }, 100);
        }
        
        return true;
    }, [selectedUserId, selectedEventId, startDate, endDate, users, events, initialEvents, initialFilters, location.pathname, navigate, dispatch, filterAction, filterMode]);

    /**
     * Clear all filters
     */
    const clearFilters = useCallback(async () => {
        // Reset state
        setSelectedUserId('');
        setSelectedEventId('');
        setStartDate('');
        setEndDate('');
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
        const startDateFromUrl = urlParams.get('startDate') || '';
        const endDateFromUrl = urlParams.get('endDate') || '';

        // Only update if values actually changed
        setSelectedUserId(prev => prev !== userIdFromUrl ? userIdFromUrl : prev);
        setSelectedEventId(prev => prev !== eventIdFromUrl ? eventIdFromUrl : prev);
        setStartDate(prev => prev !== startDateFromUrl ? startDateFromUrl : prev);
        setEndDate(prev => prev !== endDateFromUrl ? endDateFromUrl : prev);

        // Build active filters from URL
        const active = {};
        if (userIdFromUrl) active.user = userIdFromUrl;
        if (eventIdFromUrl) active.event = eventIdFromUrl;
        if (startDateFromUrl) active.startDate = startDateFromUrl;
        if (endDateFromUrl) active.endDate = endDateFromUrl;
        
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

    /**
     * Handle user selection change - auto-apply only when "All Users" is selected
     * For specific user selection, wait for Apply button click
     * Only works in 'registered' mode
     */
    const handleUserChange = useCallback((userId) => {
        setSelectedUserId(userId);
        
        // Only handle user filter in registered mode
        if (filterMode !== 'registered') {
            return;
        }
        
        // If "All Users" is selected (empty value), automatically clear user filter and show all users
        if (!userId || userId === '') {
            // CRITICAL: Clear selectedUserId state immediately to ensure it's empty
            setSelectedUserId('');
            
            // Read current URL to get accurate state, but explicitly exclude userId
            const currentUrlParams = new URLSearchParams(location.search);
            // Get other filters from URL ONLY - don't use state values as they might be stale
            // This ensures we get the most up-to-date values from URL
            const currentEventId = currentUrlParams.get('eventId'); // Only from URL, not state
            const currentStartDate = currentUrlParams.get('startDate'); // Only from URL, not state
            const currentEndDate = currentUrlParams.get('endDate'); // Only from URL, not state
            
            // Build URL without userId - explicitly exclude it (don't append userId even if it exists in current URL)
            const queryParams = new URLSearchParams();
            if (currentEventId) {
                queryParams.append('eventId', currentEventId);
            }
            if (currentStartDate) {
                queryParams.append('startDate', currentStartDate);
            }
            if (currentEndDate) {
                queryParams.append('endDate', currentEndDate);
            }
            
            const newUrl = queryParams.toString() 
                ? `${location.pathname}?${queryParams.toString()}`
                : location.pathname;
            
            // Build filters object without ANY user-related filters - start completely fresh
            // CRITICAL: Explicitly ensure userId and userFilter are NOT included
            const filters = {};
            
            // Preserve page-level filters from initialFilters (e.g., upcoming: true for upcoming events page)
            // These are not user-selectable filters, so they should be preserved
            if (initialFilters) {
                Object.keys(initialFilters).forEach(key => {
                    // Only preserve non-filter keys (like 'upcoming', 'filter', etc.)
                    // Don't preserve user/event filter keys as they might be stale
                    if (key !== 'userId' && key !== 'userFilter' && 
                        key !== 'eventId' && key !== 'eventFilter' && key !== 'eventName' &&
                        key !== 'startDate' && key !== 'endDate') {
                        filters[key] = initialFilters[key];
                    }
                });
            }
            
            // Explicitly ensure no user-related filters (even though object is empty, be explicit)
            // This ensures backend receives a clean filters object
            if (filters.userId !== undefined) delete filters.userId;
            if (filters.userFilter !== undefined) delete filters.userFilter;
            
            // Only add event filter if event is actually selected
            if (currentEventId) {
                if (events.length > 0) {
                    const selectedEvent = events.find(event => event.id === currentEventId);
                    if (selectedEvent) {
                        filters.eventFilter = selectedEvent.name;
                    } else {
                        // Event not found in array, use eventId directly
                        filters.eventId = currentEventId;
                    }
                } else {
                    // Events not loaded yet - use eventId directly
                    filters.eventId = currentEventId;
                }
            }
            
            // Add date filters if they exist
            if (currentStartDate) {
                filters.startDate = currentStartDate;
            }
            if (currentEndDate) {
                filters.endDate = currentEndDate;
            }
            
            // CRITICAL: Verify filters object doesn't have userId before dispatching
            // Double-check to ensure no user filter is being sent
            if (filters.userId) {
                console.warn('⚠️ userId found in filters when clearing - removing it');
                delete filters.userId;
            }
            if (filters.userFilter) {
                console.warn('⚠️ userFilter found in filters when clearing - removing it');
                delete filters.userFilter;
            }
            
            // Final verification - ensure filters object is clean
            const finalFilters = JSON.parse(JSON.stringify(filters)); // Deep clone to ensure no references
            if (finalFilters.userId) delete finalFilters.userId;
            if (finalFilters.userFilter) delete finalFilters.userFilter;
            
            // Update active filters - explicitly don't include user
            const active = {};
            if (currentEventId) active.event = currentEventId;
            if (currentStartDate) active.startDate = currentStartDate;
            if (currentEndDate) active.endDate = currentEndDate;
            setActiveFilters(active);
            
            // Store old URL before navigation
            const oldUrl = location.search;
            const newUrlSearch = newUrl.includes('?') ? newUrl.split('?')[1] : '';
            
            // Update refs BEFORE navigation and dispatch to prevent useEffect from interfering
            lastUrlParamsRef.current = newUrlSearch ? `?${newUrlSearch}` : '';
            filtersAppliedRef.current = true;
            
            // Navigate to new URL (without userId) - do this after setting refs
            navigate(newUrl, { replace: true });
            
            // Log for debugging
            console.log('🔄 Dispatching "All Users" - filters:', finalFilters, 'URL:', newUrl);
            
            // Dispatch with clean filters (no userId/userFilter) - do this immediately
            // The refs are already set, so useEffect won't interfere
            // Skip if filterAction is null (server-side DataTable handles API calls)
            if (filterAction) {
                dispatch(filterAction(finalFilters));
            }
        }
        // For specific user selection, just update state - Apply button will handle it
    }, [selectedEventId, startDate, endDate, events, location.pathname, navigate, dispatch, filterAction, initialFilters, filterMode]);

    /**
     * Handle event selection change - auto-apply only when "All Events" is selected
     * For specific event selection, wait for Apply button click
     */
    const handleEventChange = useCallback((eventId) => {
        setSelectedEventId(eventId);
        
        // If "All Events" is selected (empty value), automatically clear event filter and show all events
        if (!eventId || eventId === '') {
            // CRITICAL: Clear selectedEventId state immediately to ensure it's empty
            setSelectedEventId('');
            
            // Read current URL to get accurate state, but explicitly exclude eventId
            const currentUrlParams = new URLSearchParams(location.search);
            // Get other filters from URL ONLY - don't use state values as they might be stale
            // This ensures we get the most up-to-date values from URL
            const currentUserId = currentUrlParams.get('userId'); // Only from URL, not state
            const currentStartDate = currentUrlParams.get('startDate'); // Only from URL, not state
            const currentEndDate = currentUrlParams.get('endDate'); // Only from URL, not state
            
            // Build URL without eventId - explicitly exclude it
            const queryParams = new URLSearchParams();
            if (filterMode === 'registered' && currentUserId) {
                queryParams.append('userId', currentUserId);
            }
            if (currentStartDate) {
                queryParams.append('startDate', currentStartDate);
            }
            if (currentEndDate) {
                queryParams.append('endDate', currentEndDate);
            }
            
            const newUrl = queryParams.toString() 
                ? `${location.pathname}?${queryParams.toString()}`
                : location.pathname;
            
            // Build filters object without event filter - start completely fresh
            // IMPORTANT: Don't include eventId/eventFilter even if it exists in URL - we're clearing it
            const filters = {};
            
            // Preserve page-level filters from initialFilters (e.g., upcoming: true for upcoming events page)
            // These are not user-selectable filters, so they should be preserved
            if (initialFilters) {
                Object.keys(initialFilters).forEach(key => {
                    // Only preserve non-filter keys (like 'upcoming', 'filter', etc.)
                    // Don't preserve user/event filter keys as they might be stale
                    if (key !== 'userId' && key !== 'userFilter' && 
                        key !== 'eventId' && key !== 'eventFilter' && key !== 'eventName' &&
                        key !== 'startDate' && key !== 'endDate') {
                        filters[key] = initialFilters[key];
                    }
                });
            }
            
            // Only add user filter if user is actually selected and in URL (only for registered mode)
            if (filterMode === 'registered' && currentUserId) {
                filters.userId = currentUserId;
            }
            
            // Add date filters if they exist
            if (currentStartDate) {
                filters.startDate = currentStartDate;
            }
            if (currentEndDate) {
                filters.endDate = currentEndDate;
            }
            
            // CRITICAL: Verify filters object doesn't have event-related filters
            if (filters.eventId) delete filters.eventId;
            if (filters.eventFilter) delete filters.eventFilter;
            if (filters.eventName) delete filters.eventName;
            
            // Final verification - ensure filters object is clean
            const finalFilters = JSON.parse(JSON.stringify(filters)); // Deep clone
            if (finalFilters.eventId) delete finalFilters.eventId;
            if (finalFilters.eventFilter) delete finalFilters.eventFilter;
            if (finalFilters.eventName) delete finalFilters.eventName;
            
            // Update active filters - explicitly don't include event
            const active = {};
            if (filterMode === 'registered' && currentUserId) active.user = currentUserId;
            if (currentStartDate) active.startDate = currentStartDate;
            if (currentEndDate) active.endDate = currentEndDate;
            setActiveFilters(active);
            
            // Store old URL before navigation
            const oldUrl = location.search;
            const newUrlSearch = newUrl.includes('?') ? newUrl.split('?')[1] : '';
            
            // Update refs BEFORE navigation and dispatch to prevent useEffect from interfering
            lastUrlParamsRef.current = newUrlSearch ? `?${newUrlSearch}` : '';
            filtersAppliedRef.current = true;
            
            // Navigate to new URL (without eventId) - do this after setting refs
            navigate(newUrl, { replace: true });
            
            // Log for debugging
            console.log('🔄 Dispatching "All Events" - filters:', finalFilters, 'URL:', newUrl);
            
            // Dispatch with clean filters (no eventId/eventFilter/eventName)
            // Skip if filterAction is null (server-side DataTable handles API calls)
            if (filterAction) {
                dispatch(filterAction(finalFilters));
            }
        }
        // For specific event selection, just update state - Apply button will handle it
    }, [selectedUserId, startDate, endDate, location.pathname, navigate, dispatch, filterAction, initialFilters, filterMode]);

    // Initialize on mount and URL changes
    useEffect(() => {
        initializeFromUrl();
    }, [initializeFromUrl]);

    // Set selectedUserId, selectedEventId, and dates from URL immediately on mount
    // CRITICAL: Also clear state when URL parameters are removed
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const userIdFromUrl = urlParams.get('userId');
        const eventIdFromUrl = urlParams.get('eventId');
        const startDateFromUrl = urlParams.get('startDate');
        const endDateFromUrl = urlParams.get('endDate');
        const currentUrlParams = location.search;
        
        // Only update if URL actually changed
        if (currentUrlParams !== lastUrlParamsRef.current) {
            lastUrlParamsRef.current = currentUrlParams;
            filtersAppliedRef.current = false; // Reset flag when URL changes
            
            // Update or clear userId based on URL
            if (userIdFromUrl) {
                if (selectedUserId !== userIdFromUrl) {
                    setSelectedUserId(userIdFromUrl);
                }
            } else {
                // URL doesn't have userId - clear state if it was set
                if (selectedUserId) {
                    setSelectedUserId('');
                }
            }
            
            // Update or clear eventId based on URL
            if (eventIdFromUrl) {
                if (selectedEventId !== eventIdFromUrl) {
                    setSelectedEventId(eventIdFromUrl);
                }
            } else {
                // URL doesn't have eventId - clear state if it was set
                if (selectedEventId) {
                    setSelectedEventId('');
                }
            }
            
            // Update or clear dates based on URL
            if (startDateFromUrl) {
                if (startDate !== startDateFromUrl) {
                    setStartDate(startDateFromUrl);
                }
            } else {
                // URL doesn't have startDate - clear state if it was set
                if (startDate) {
                    setStartDate('');
                }
            }
            
            if (endDateFromUrl) {
                if (endDate !== endDateFromUrl) {
                    setEndDate(endDateFromUrl);
                }
            } else {
                // URL doesn't have endDate - clear state if it was set
                if (endDate) {
                    setEndDate('');
                }
            }
        }
    }, [location.search, selectedUserId, selectedEventId, startDate, endDate]); // Run when URL changes

    // Update users and events when initial data changes (from backend filter response)
    // IMPORTANT: We only update if the new list is larger or equal to current list
    // This prevents replacing the full dropdown list with filtered results
    useEffect(() => {
        // Handle users list - preserve full list (e.g., all registered users)
        if (initialUsers.length > 0) {
            const currentStoredCount = fullUsersListRef.current.length;
            const newUsersCount = initialUsers.length;
            
            // If we have no stored users, or new list is larger, update it
            // This ensures we preserve the full list and don't replace it with filtered results
            if (currentStoredCount === 0 || newUsersCount > currentStoredCount) {
                setUsers(initialUsers);
                fullUsersListRef.current = initialUsers;
            } else if (newUsersCount === currentStoredCount) {
                // Same size - check if it's the same list or a superset
                const storedUserIds = new Set(fullUsersListRef.current.map(u => u.id));
                const newUserIds = new Set(initialUsers.map(u => u.id));
                const allStoredUsersInNew = Array.from(storedUserIds).every(id => newUserIds.has(id));
                
                if (allStoredUsersInNew) {
                    // New list contains all stored users - update it (might have new users)
                    setUsers(initialUsers);
                    fullUsersListRef.current = initialUsers;
                }
                // If new list doesn't contain all stored users, it's likely filtered - don't update
            }
            // If new list is smaller, it's definitely a filtered result - don't replace the dropdown list
        }
        
        // Handle events list - preserve full list (e.g., all upcoming events)
        // CRITICAL: Always update if we have no events yet (first load) - this ensures events are available immediately
        if (initialEvents.length > 0) {
            // Only update events if:
            // 1. We don't have any events yet (first load) - ALWAYS update in this case
            // 2. The new list is larger than the stored full list (complete list, not filtered)
            // 3. The new list contains all events from current stored list (complete list)
            const currentStoredCount = fullEventsListRef.current.length;
            const currentEventsCount = events.length;
            const newEventsCount = initialEvents.length;
            
            // CRITICAL: If we have no events in state yet, always update (first load)
            // This ensures events are available for filter application
            if (currentEventsCount === 0) {
                setEvents(initialEvents);
                fullEventsListRef.current = initialEvents;
            } else if (currentStoredCount === 0 || newEventsCount > currentStoredCount) {
                // If we have no stored events, or new list is larger, update it
                // This ensures we preserve the full list and don't replace it with filtered results
                setEvents(initialEvents);
                fullEventsListRef.current = initialEvents;
            } else if (newEventsCount === currentStoredCount) {
                // Same size - check if it's the same list or a superset
                const storedEventIds = new Set(fullEventsListRef.current.map(e => e.id));
                const newEventIds = new Set(initialEvents.map(e => e.id));
                const allStoredEventsInNew = Array.from(storedEventIds).every(id => newEventIds.has(id));
                
                if (allStoredEventsInNew) {
                    // New list contains all stored events - update it (might have new events)
                    setEvents(initialEvents);
                    fullEventsListRef.current = initialEvents;
                }
                // If new list doesn't contain all stored events, it's likely filtered - don't update
            }
            // If new list is smaller, it's definitely a filtered result - don't replace the dropdown list
        }
    }, [initialUsers, initialEvents]);

    // Load dropdown data and initial data once on mount ONLY
    // CRITICAL: This should NOT run when URL changes from filter application
    // URL changes are handled by the separate useEffect that watches location.search
    useEffect(() => {
        let mounted = true;
        
        const initializeData = async () => {
            // CRITICAL: Only run once on initial mount, not on URL changes
            if (!mounted || hasInitializedRef.current) return;
            hasInitializedRef.current = true;
            
            // Check URL parameters first (for initial page load with URL params)
            const urlParams = new URLSearchParams(location.search);
            const userIdFromUrl = urlParams.get('userId');
            const eventIdFromUrl = urlParams.get('eventId');
            const startDateFromUrl = urlParams.get('startDate');
            const endDateFromUrl = urlParams.get('endDate');
            const hasUrlFilters = userIdFromUrl || eventIdFromUrl || startDateFromUrl || endDateFromUrl;
            
            // Handle initial load based on filter mode and URL filters
            // Skip if filterAction is null (server-side DataTable handles API calls)
            if (filterAction) {
                if (hasUrlFilters) {
                    // Check if we have only date filters (no eventId, no userId)
                    const hasOnlyDateFilters = (startDateFromUrl || endDateFromUrl) && !eventIdFromUrl && !userIdFromUrl;
                    
                    if (hasOnlyDateFilters && filterMode === 'event') {
                        // For date-only filters in event mode, apply them immediately
                        // No need to wait for events to load since date filters don't need event data
                        const dateFilters = { ...initialFilters };
                        if (startDateFromUrl) dateFilters.startDate = startDateFromUrl;
                        if (endDateFromUrl) dateFilters.endDate = endDateFromUrl;
                        filtersAppliedRef.current = true;
                        lastUrlParamsRef.current = location.search;
                        if (filterAction) {
                            dispatch(filterAction(dateFilters));
                        }
                    } else if (filterMode === 'registered') {
                        // For registered mode: backend supports userId and eventId directly
                        // We can apply filters immediately without waiting for users/events arrays
                        const filters = { ...initialFilters };
                        if (userIdFromUrl) filters.userId = userIdFromUrl;
                        if (eventIdFromUrl) filters.eventId = eventIdFromUrl;
                        if (startDateFromUrl) filters.startDate = startDateFromUrl;
                        if (endDateFromUrl) filters.endDate = endDateFromUrl;
                        filtersAppliedRef.current = true;
                        lastUrlParamsRef.current = location.search;
                        if (filterAction) {
                            dispatch(filterAction(filters));
                        }
                    } else {
                        // For event mode with eventId: check if we already have events loaded
                        // If events are available, apply filter immediately
                        if (events.length > 0 || initialEvents.length > 0) {
                            const eventsToUse = events.length > 0 ? events : initialEvents;
                            const selectedEvent = eventsToUse.find(event => event.id === eventIdFromUrl);
                            if (selectedEvent) {
                                const filters = { ...initialFilters };
                                filters.eventName = selectedEvent.name;
                                if (startDateFromUrl) filters.startDate = startDateFromUrl;
                                if (endDateFromUrl) filters.endDate = endDateFromUrl;
                                filtersAppliedRef.current = true;
                                lastUrlParamsRef.current = location.search;
                                if (filterAction) {
                                    dispatch(filterAction(filters));
                                }
                            } else {
                                // Event not found - load all data first
                                filtersAppliedRef.current = false;
                                lastUrlParamsRef.current = '';
                                if (filterAction) {
                                    dispatch(filterAction({}));
                                }
                            }
                        } else {
                            // Events not loaded yet - load all data first to get filter dropdown options
                            // The filter application useEffect will handle applying filters when events are ready
                            filtersAppliedRef.current = false;
                            lastUrlParamsRef.current = '';
                            if (filterAction) {
                                dispatch(filterAction({}));
                            }
                        }
                    }
                } else {
                    // No URL filters, load all data
                    filtersAppliedRef.current = true;
                    lastUrlParamsRef.current = location.search;
                    // Skip if filterAction is null (server-side DataTable handles API calls)
                    if (filterAction) {
                        dispatch(filterAction({})); // Empty object = all data
                    }
                }
            }
            
            if (!mounted) return;
            
            // Load dropdown data if actions are provided
            // CRITICAL: Only load if initialEvents/initialUsers are empty
            // This preserves events from filterData?.events (backend response) which contains all available events
            // If initialEvents has data, it means we got events from the backend filter response - use those instead
            const shouldLoadEvents = loadEventsAction && initialEvents.length === 0;
            const shouldLoadUsers = loadUsersAction && initialUsers.length === 0;
            
            if (shouldLoadUsers || shouldLoadEvents) {
                await loadDropdownData();
            }
        };
        
        initializeData();
        
        return () => {
            mounted = false;
        };
        // CRITICAL: Remove location.search from dependencies - only run once on mount
        // URL changes are handled by the separate useEffect below
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty array = only run once on mount

    // Apply filters from URL on initial load or when URL changes externally (e.g., browser back/forward)
    // This only runs when URL changes externally, not when applyFilters is called (which handles its own dispatch)
    useEffect(() => {
        const currentUrlParams = location.search;
        
        // CRITICAL: Skip if applyFilters is currently running
        // This prevents duplicate API calls when applyFilters updates URL
        if (isApplyingFiltersRef.current) {
            return;
        }
        
        // CRITICAL: Skip if filters were already applied by applyFilters function
        // This prevents duplicate API calls when applyFilters updates URL
        if (filtersAppliedRef.current) {
            // Check if the current URL matches what we just set in applyFilters
            const expectedUrlParams = lastUrlParamsRef.current;
            
            // Normalize both URLs for comparison
            // location.search already includes the ? prefix, so normalize both
            const normalizedCurrent = currentUrlParams || '';
            const normalizedExpected = expectedUrlParams || '';
            
            // Compare the actual query strings (without ? prefix for comparison)
            const currentQuery = normalizedCurrent.replace(/^\?/, '');
            const expectedQuery = normalizedExpected.replace(/^\?/, '');
            
            // If query strings match (or both are empty), applyFilters already handled it - skip
            if (currentQuery === expectedQuery) {
                // URL matches what applyFilters set - skip to prevent duplicate call
                return;
            }
            // If URL doesn't match, it's an external change (browser back/forward) - proceed
        }
        
        // Only proceed if URL actually changed (external navigation like browser back/forward)
        if (currentUrlParams === lastUrlParamsRef.current) {
            return; // No change, skip
        }
        
        if (!filterAction) return;
        
        const urlParams = new URLSearchParams(location.search);
        const userIdFromUrl = urlParams.get('userId');
        const eventIdFromUrl = urlParams.get('eventId');
        const startDateFromUrl = urlParams.get('startDate');
        const endDateFromUrl = urlParams.get('endDate');
        
        // Build filters from URL - this handles initial page load or external URL changes
        const filters = {};
        
        // Preserve page-level filters from initialFilters (e.g., upcoming: true)
        if (initialFilters) {
            Object.keys(initialFilters).forEach(key => {
                if (key !== 'userId' && key !== 'userFilter' && 
                    key !== 'eventId' && key !== 'eventFilter' && key !== 'eventName' &&
                    key !== 'startDate' && key !== 'endDate') {
                    filters[key] = initialFilters[key];
                }
            });
        }
        
        // Handle user filter (only for registered mode)
        if (userIdFromUrl && filterMode === 'registered') {
            filters.userId = userIdFromUrl;
        }
        
        // Handle event filter - different based on mode
        // Note: Use ref to access events without causing dependency issues
        // A separate useEffect will handle re-applying filters when events load
        if (eventIdFromUrl) {
            if (filterMode === 'registered') {
                // For registered mode: backend supports eventId directly, but prefer eventFilter (name)
                // Use ref to access current events without causing dependency issues
                const currentEvents = fullEventsListRef.current.length > 0 ? fullEventsListRef.current : [];
                if (currentEvents.length > 0) {
                    const selectedEvent = currentEvents.find(event => event.id === eventIdFromUrl);
                    if (selectedEvent) {
                        filters.eventFilter = selectedEvent.name;
                    } else {
                        filters.eventId = eventIdFromUrl;
                    }
                } else {
                    filters.eventId = eventIdFromUrl;
                }
            } else {
                // For event mode: must convert eventId to eventName
                const currentEvents = fullEventsListRef.current.length > 0 ? fullEventsListRef.current : [];
                if (currentEvents.length > 0) {
                    const selectedEvent = currentEvents.find(event => event.id === eventIdFromUrl);
                    if (selectedEvent) {
                        filters.eventName = selectedEvent.name;
                    } else {
                        // Event not found - skip event filter for now
                        console.warn('Event not found for ID:', eventIdFromUrl);
                    }
                } else {
                    // Events not loaded yet - skip event filter, separate effect will handle it
                    // Don't return, just skip the event filter
                }
            }
        }

        // Add date filters
        if (startDateFromUrl) {
            filters.startDate = startDateFromUrl;
        }
        if (endDateFromUrl) {
            filters.endDate = endDateFromUrl;
        }
        
        // Mark as applied and update refs
        filtersAppliedRef.current = true;
        lastUrlParamsRef.current = currentUrlParams;
        
        // Dispatch the action - single API call
        // Skip if filterAction is null (server-side DataTable handles API calls)
        if (filterAction) {
            dispatch(filterAction(filters));
        }
    }, [location.search, filterAction, dispatch, initialFilters, filterMode]); // Removed events from dependencies to prevent infinite loop
    
    // Separate effect to handle when events load (for eventId to eventName conversion)
    useEffect(() => {
        // Only run if we have an eventId in URL but events weren't loaded before
        const urlParams = new URLSearchParams(location.search);
        const eventIdFromUrl = urlParams.get('eventId');
        
        if (!eventIdFromUrl) return;
        if (isApplyingFiltersRef.current) return;
        if (events.length === 0) return; // Still waiting for events
        
        // Check if events actually changed (not just a new array reference)
        const eventsChanged = events.length !== eventsLengthRef.current || 
                             JSON.stringify(events.map(e => e.id).sort()) !== JSON.stringify((previousEventsRef.current || []).map(e => e.id).sort());
        
        if (!eventsChanged) return; // Events haven't meaningfully changed
        
        // Update refs
        eventsLengthRef.current = events.length;
        previousEventsRef.current = events;
        
        // Check if we need to re-apply filters with event name
        const selectedEvent = events.find(event => event.id === eventIdFromUrl);
        if (!selectedEvent) return; // Event still not found
        
        // Re-apply filters with proper event name
        const filters = {};
        
        // Preserve page-level filters
        if (initialFilters) {
            Object.keys(initialFilters).forEach(key => {
                if (key !== 'userId' && key !== 'userFilter' && 
                    key !== 'eventId' && key !== 'eventFilter' && key !== 'eventName' &&
                    key !== 'startDate' && key !== 'endDate') {
                    filters[key] = initialFilters[key];
                }
            });
        }
        
        // Rebuild filters from URL
        const userIdFromUrl = urlParams.get('userId');
        const startDateFromUrl = urlParams.get('startDate');
        const endDateFromUrl = urlParams.get('endDate');
        
        if (userIdFromUrl && filterMode === 'registered') {
            filters.userId = userIdFromUrl;
        }
        
        if (filterMode === 'registered') {
            filters.eventFilter = selectedEvent.name;
        } else {
            filters.eventName = selectedEvent.name;
        }
        
        if (startDateFromUrl) filters.startDate = startDateFromUrl;
        if (endDateFromUrl) filters.endDate = endDateFromUrl;
        
        // Apply filters
        filtersAppliedRef.current = true;
        lastUrlParamsRef.current = location.search;
        // Skip if filterAction is null (server-side DataTable handles API calls)
        if (filterAction) {
            dispatch(filterAction(filters));
        }
    }, [events, location.search, filterAction, dispatch, initialFilters, filterMode]);

    return {
        // State
        selectedUserId,
        selectedEventId,
        startDate,
        endDate,
        users,
        events,
        loadingDropdowns,
        activeFilters,
        
        // Actions
        applyFilters,
        clearFilters,
        setSelectedUserId,
        setSelectedEventId,
        setStartDate,
        setEndDate,
        setFilters,
        loadDropdownData,
        handleUserChange,
        handleEventChange,
        
        // Utilities
        getFilterData,
        hasActiveFilters: Object.keys(activeFilters).length > 0
    };
};

export default useFilterLogic;
