import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { eventList, upcomingEventList } from '../store/actions/eventActions';

/**
 * Reusable hook for event name filtering
 * Can be used with different event list actions (all events, upcoming events, etc.)
 * 
 * @param {Function} eventAction - The action to call for loading events (eventList, upcomingEventList, etc.)
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Filter state and methods
 */
const useEventFilter = (eventAction = eventList, initialFilters = {}, initialEvents = []) => {
    const dispatch = useDispatch();
    const location = useLocation();
    const navigate = useNavigate();
    
    // Get events from Redux store - use main events list for filter dropdown
    // For eventList: use state.event?.event?.events
    // For upcomingEventList: use state.event?.upcomingEvents
    const isUpcoming = eventAction === upcomingEventList;
    
    // Use a stable selector - get raw events from Redux
    const eventsFromReduxRaw = useSelector((state) => {
        if (isUpcoming) {
            return state.event?.upcomingEvents?.events || state.event?.upcomingEvents || [];
        }
        return state.event?.event?.events || [];
    });
    
    // Create a stable string representation of event IDs for comparison
    const eventsIdString = useMemo(() => {
        if (!Array.isArray(eventsFromReduxRaw)) {
            return '';
        }
        return eventsFromReduxRaw.map(e => e?.id).filter(Boolean).sort().join(',');
    }, [eventsFromReduxRaw]);
    
    // Memoize initial filters to prevent unnecessary re-renders
    const memoizedInitialFilters = useMemo(() => initialFilters, [JSON.stringify(initialFilters)]);
    
    // Use ref to store eventAction to prevent dependency issues
    const eventActionRef = useRef(eventAction);
    eventActionRef.current = eventAction;
    
    // Refs to track if filters have been applied to prevent infinite loops
    const filtersAppliedRef = useRef(false);
    const lastUrlParamsRef = useRef('');
    const hasInitializedRef = useRef(false);
    
    // Filter states
    const [selectedEventId, setSelectedEventId] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [allEvents, setAllEvents] = useState(Array.isArray(initialEvents) && initialEvents.length > 0 ? initialEvents : (Array.isArray(eventsFromReduxRaw) ? eventsFromReduxRaw : []));
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    
    // Store current allEvents in ref (initialized after allEvents state)
    const allEventsRef = useRef(Array.isArray(initialEvents) && initialEvents.length > 0 ? initialEvents : (Array.isArray(eventsFromReduxRaw) ? eventsFromReduxRaw : []));

    // Initialize filters from URL
    const initializeFromUrl = useCallback(() => {
        const urlParams = new URLSearchParams(location.search);
        const eventIdFromUrl = urlParams.get('eventId') || '';
        const startDateFromUrl = urlParams.get('startDate') || '';
        const endDateFromUrl = urlParams.get('endDate') || '';

        // Only update if values actually changed
        setSelectedEventId(prev => prev !== eventIdFromUrl ? eventIdFromUrl : prev);
        setStartDate(prev => prev !== startDateFromUrl ? startDateFromUrl : prev);
        setEndDate(prev => prev !== endDateFromUrl ? endDateFromUrl : prev);

        // Build active filters from URL
        const active = {};
        if (eventIdFromUrl) active.event = eventIdFromUrl;
        if (startDateFromUrl) active.startDate = startDateFromUrl;
        if (endDateFromUrl) active.endDate = endDateFromUrl;
        
        setActiveFilters(prev => {
            const hasChanged = JSON.stringify(prev) !== JSON.stringify(active);
            return hasChanged ? active : prev;
        });
    }, [location.search]);

    // Apply event name filter
    const applyFilters = useCallback(async (filterOverrides = {}) => {
        // Handle empty values explicitly - if filterOverrides has empty string, use it
        const eventIdToUse = filterOverrides.hasOwnProperty('eventId') ? filterOverrides.eventId : selectedEventId;
        const startDateToUse = filterOverrides.hasOwnProperty('startDate') ? filterOverrides.startDate : startDate;
        const endDateToUse = filterOverrides.hasOwnProperty('endDate') ? filterOverrides.endDate : endDate;
        
        // Build URL parameters
        const queryParams = new URLSearchParams();
        
        if (eventIdToUse) {
            queryParams.append('eventId', eventIdToUse);
        }
        if (startDateToUse) {
            queryParams.append('startDate', startDateToUse);
        }
        if (endDateToUse) {
            queryParams.append('endDate', endDateToUse);
        }

        // Update URL without page refresh
        const newUrl = queryParams.toString() 
            ? `${location.pathname}?${queryParams.toString()}`
            : location.pathname;
        
        // Store current URL before navigation (to detect what was removed)
        const oldUrl = location.search;
        
        // Reset flags to allow useEffect to process the new URL
        filtersAppliedRef.current = false;
        // Keep old URL in ref so we can detect what was removed
        lastUrlParamsRef.current = oldUrl;
        
        navigate(newUrl, { replace: true });

        // Update active filters state for UI feedback
        const active = {};
        if (eventIdToUse) {
            active.event = eventIdToUse;
        }
        if (startDateToUse) {
            active.startDate = startDateToUse;
        }
        if (endDateToUse) {
            active.endDate = endDateToUse;
        }
        setActiveFilters(active);
        
        // Don't dispatch here - let the useEffect handle it when URL changes
        // This prevents duplicate API calls
        return true;
    }, [selectedEventId, startDate, endDate, location.pathname, navigate]);

    // Clear all filters
    const clearFilters = useCallback(async () => {
        setSelectedEventId('');
        setStartDate('');
        setEndDate('');
        setActiveFilters({});

        // Clear URL parameters
        navigate(location.pathname, { replace: true });

        // Reset flags - important to reset before clearing
        filtersAppliedRef.current = false;
        lastUrlParamsRef.current = '';

        try {
            // Call the event action with empty filters object to load all events
            // Don't use memoizedInitialFilters as it might contain old filter values
            const emptyFilters = {};
            const result = await dispatch(eventActionRef.current(emptyFilters));
           
            return result;
        } catch (error) {
            console.error('Error clearing event filters:', error);
            return false;
        }
    }, [location.pathname, navigate, dispatch]);

    // Handle event selection change
    const handleEventChange = useCallback((eventId) => {
        setSelectedEventId(eventId);
        
        // If "All Events" is selected (empty value), automatically clear event filter and show all events
        if (!eventId || eventId === '') {
            // Build URL without eventId
            const queryParams = new URLSearchParams();
            if (startDate) {
                queryParams.append('startDate', startDate);
            }
            if (endDate) {
                queryParams.append('endDate', endDate);
            }
            
            const newUrl = queryParams.toString() 
                ? `${location.pathname}?${queryParams.toString()}`
                : location.pathname;
            
            // Store old URL before navigation
            const oldUrl = location.search;
            lastUrlParamsRef.current = oldUrl;
            filtersAppliedRef.current = false;
            
            // Navigate to new URL
            navigate(newUrl, { replace: true });
            
            // Build filters object without eventName
            const filters = {};
            if (startDate) {
                filters.startDate = startDate;
            }
            if (endDate) {
                filters.endDate = endDate;
            }
            
            // Update active filters
            const active = {};
            if (startDate) active.startDate = startDate;
            if (endDate) active.endDate = endDate;
            setActiveFilters(active);
            
            // Directly dispatch to load all events (without event filter)
            dispatch(eventActionRef.current(filters));
        }
    }, [startDate, endDate, location.pathname, navigate, dispatch]);

    // Initialize from URL on mount
    useEffect(() => {
        initializeFromUrl();
    }, [initializeFromUrl]);

    // Update state from URL when URL changes
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const eventIdFromUrl = urlParams.get('eventId');
        const startDateFromUrl = urlParams.get('startDate');
        const endDateFromUrl = urlParams.get('endDate');
        const currentUrlParams = location.search;
        
        if (currentUrlParams !== lastUrlParamsRef.current) {
            lastUrlParamsRef.current = currentUrlParams;
            filtersAppliedRef.current = false;
            
            if (eventIdFromUrl && selectedEventId !== eventIdFromUrl) setSelectedEventId(eventIdFromUrl);
            if (startDateFromUrl && startDate !== startDateFromUrl) setStartDate(startDateFromUrl);
            if (endDateFromUrl && endDate !== endDateFromUrl) setEndDate(endDateFromUrl);
        }
    }, [location.search, selectedEventId, startDate, endDate]);

    // Initial load - check for URL filters and apply them immediately
    useEffect(() => {
        let mounted = true;
        
        const initializeData = async () => {
            if (!mounted || hasInitializedRef.current) return;
            hasInitializedRef.current = true;
            
            const urlParams = new URLSearchParams(location.search);
            const eventIdFromUrl = urlParams.get('eventId');
            const startDateFromUrl = urlParams.get('startDate');
            const endDateFromUrl = urlParams.get('endDate');
            const hasUrlFilters = eventIdFromUrl || startDateFromUrl || endDateFromUrl;
            
            if (hasUrlFilters) {
                // We have URL filters - load all events first to get filter data, then apply filters
                // The filter application useEffect will handle applying filters when events are ready
                // Reset flags to allow filter application after events load
                filtersAppliedRef.current = false;
                lastUrlParamsRef.current = ''; // Reset to allow filter application
                // Load all events first to get filter data (for admin)
                dispatch(eventActionRef.current({}));
            } else {
                // No URL filters, load all events with empty filters
                filtersAppliedRef.current = true;
                lastUrlParamsRef.current = location.search;
                dispatch(eventActionRef.current({}));
            }
        };
        
        initializeData();
        
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.search]); // Include location.search to handle URL changes on mount

    // Update ref when allEvents changes
    useEffect(() => {
        allEventsRef.current = allEvents;
    }, [allEvents]);

    // Apply filters from URL when URL changes or when events are loaded
    useEffect(() => {
        const urlParams = new URLSearchParams(location.search);
        const eventIdFromUrl = urlParams.get('eventId');
        const startDateFromUrl = urlParams.get('startDate');
        const endDateFromUrl = urlParams.get('endDate');
        const currentUrlParams = location.search;
        
        // Get previous URL params to detect what changed
        const previousUrlParams = new URLSearchParams(lastUrlParamsRef.current);
        const previousEventId = previousUrlParams.get('eventId');
        
        // Check if URL changed
        const urlChanged = currentUrlParams !== lastUrlParamsRef.current;
        
        // Check if eventId was removed (had eventId before, don't have it now)
        const eventIdWasRemoved = previousEventId && !eventIdFromUrl && urlChanged;
        
        // Check if URL has any filters
        const hasUrlFilters = eventIdFromUrl || startDateFromUrl || endDateFromUrl;
        
        // If URL is empty and we had eventId before, eventId was removed - load all events
        if (!hasUrlFilters && eventIdWasRemoved) {
            filtersAppliedRef.current = true;
            lastUrlParamsRef.current = currentUrlParams;
            // Clear event filter - load all events
            dispatch(eventActionRef.current({})); // Load all events
            return;
        }
        
        // Also handle case where eventId was removed but date filters might still exist
        // In this case, we need to apply filters without eventName
        if (eventIdWasRemoved && hasUrlFilters) {
            // EventId was removed but date filters exist - apply only date filters
            const filters = {};
            if (startDateFromUrl) {
                filters.startDate = startDateFromUrl;
            }
            if (endDateFromUrl) {
                filters.endDate = endDateFromUrl;
            }
            filtersAppliedRef.current = true;
            lastUrlParamsRef.current = currentUrlParams;
            dispatch(eventActionRef.current(filters));
            return;
        }
        
        // If URL is empty and this is initial load, let initial load useEffect handle it
        if (!hasUrlFilters && !urlChanged) {
            if (currentUrlParams === '' && !hasInitializedRef.current) {
                filtersAppliedRef.current = false;
            }
            return;
        }
        
        // Use ref to get current allEvents to avoid dependency issues
        const currentAllEvents = allEventsRef.current;
        
        // Check if we have eventId but events are not loaded yet
        const hasEventIdButNoEvents = eventIdFromUrl && currentAllEvents.length === 0;
        
        // Check if we were waiting for events to load (initial load with filters)
        const wasWaitingForEvents = lastUrlParamsRef.current === '' && hasInitializedRef.current && eventIdFromUrl;
        
        // Prevent duplicate API calls
        if (!urlChanged && filtersAppliedRef.current && !hasEventIdButNoEvents && !wasWaitingForEvents && !eventIdWasRemoved) {
            return;
        }
        
        // Build filters object - start fresh
        const filters = {};
        let hasValidFilters = false;
        
        // Add event filter if eventId exists and events are loaded
        if (eventIdFromUrl && currentAllEvents.length > 0) {
            const selectedEvent = currentAllEvents.find(event => event.id === eventIdFromUrl);
            if (selectedEvent) {
                filters.eventName = selectedEvent.name;
                hasValidFilters = true;
            }
        } else if (eventIdFromUrl && currentAllEvents.length === 0) {
            // EventId in URL but events not loaded yet - wait for events to load
            return;
        }
        
        // Add date filters if they exist
        if (startDateFromUrl) {
            filters.startDate = startDateFromUrl;
            hasValidFilters = true;
        }
        
        if (endDateFromUrl) {
            filters.endDate = endDateFromUrl;
            hasValidFilters = true;
        }
        
        // Apply filters if:
        // 1. We have valid filters (event or date filters)
        // 2. OR eventId was removed (need to re-apply to clear event filter, even if no date filters)
        if (hasValidFilters || eventIdWasRemoved) {
            filtersAppliedRef.current = true;
            lastUrlParamsRef.current = currentUrlParams;
            // If eventId was removed and no date filters, filters = {} which loads all events
            dispatch(eventActionRef.current(filters));
        }
    }, [location.search, dispatch, allEvents.length]); // Include allEvents.length to trigger when events load

    // Update allEvents when initialEvents changes (from filter data)
    useEffect(() => {
        if (initialEvents && Array.isArray(initialEvents) && initialEvents.length > 0) {
            setAllEvents(initialEvents);
            allEventsRef.current = initialEvents; // Update ref
            setLoadingDropdowns(false);
            
            // If we have URL filters with eventId and events just loaded, trigger filter application
            const urlParams = new URLSearchParams(location.search);
            const eventIdFromUrl = urlParams.get('eventId');
            if (eventIdFromUrl && lastUrlParamsRef.current === '') {
                // Events loaded and we have a pending eventId filter - reset flag to allow application
                filtersAppliedRef.current = false;
            }
        }
    }, [initialEvents, location.search]);

    // Use ref to track previous event IDs to prevent unnecessary updates
    const prevEventsIdStringRef = useRef('');
    const prevEventsRef = useRef([]);
    
    // Sync with Redux state when it changes - NO API CALL, only use Redux data
    // Only update if initialEvents is not provided or empty
    useEffect(() => {
        // Skip if we have initialEvents (filter data from backend)
        if (initialEvents && Array.isArray(initialEvents) && initialEvents.length > 0) {
            return;
        }
        
        // Only update if the actual event IDs have changed (not just the reference)
        if (eventsIdString !== prevEventsIdStringRef.current) {
            if (eventsFromReduxRaw && Array.isArray(eventsFromReduxRaw) && eventsFromReduxRaw.length > 0) {
                setAllEvents(eventsFromReduxRaw);
                allEventsRef.current = eventsFromReduxRaw; // Update ref
                setLoadingDropdowns(false);
            } else {
                setAllEvents([]);
                allEventsRef.current = []; // Update ref
            }
            prevEventsIdStringRef.current = eventsIdString;
            prevEventsRef.current = eventsFromReduxRaw;
        }
        // Only depend on eventsIdString - the actual events array is captured via closure
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventsIdString, initialEvents]);

    // Memoize return object to prevent unnecessary re-renders
    const returnValue = useMemo(() => ({
        // Filter state
        selectedEventId,
        startDate,
        endDate,
        allEvents,
        loadingDropdowns,
        activeFilters,
        
        // Methods
        applyFilters,
        clearFilters,
        handleEventChange,
        
        // For direct state updates if needed
        setSelectedEventId,
        setStartDate,
        setEndDate,
        setActiveFilters
    }), [
        selectedEventId,
        startDate,
        endDate,
        allEvents,
        loadingDropdowns,
        activeFilters,
        applyFilters,
        clearFilters,
        handleEventChange
    ]);

    return returnValue;
};

export default useEventFilter;
