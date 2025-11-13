import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { eventList, upcomingEventList } from '../store/actions/eventActions';

/**
 * Reusable hook for event name filtering
 * Can be used with different event list actions (all events, upcoming events, etc.)
 * 
 * @param {Function} eventAction - The action to call for loading events (eventList, upcomingEventList, etc.)
 * @param {Object} initialFilters - Initial filter values
 * @returns {Object} Filter state and methods
 */
const useEventFilter = (eventAction = eventList, initialFilters = {}) => {
    const dispatch = useDispatch();
    
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
    
    // Filter states
    const [selectedEventId, setSelectedEventId] = useState('');
    const [allEvents, setAllEvents] = useState(Array.isArray(eventsFromReduxRaw) ? eventsFromReduxRaw : []);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});

    // Apply event name filter
    const applyFilters = useCallback(async (filterOverrides = {}) => {
        const eventIdToUse = filterOverrides.eventId || selectedEventId;
        
        // Build filters object
        const filters = { ...memoizedInitialFilters };
        
        if (eventIdToUse && allEvents.length > 0) {
            const selectedEvent = allEvents.find(event => event.id === eventIdToUse);
            if (selectedEvent) {
                // Pass exact event name for filtering
                filters.eventName = selectedEvent.name;
                
            }
        }

        // Update active filters state for UI feedback
        const active = {};
        if (eventIdToUse) {
            const selectedEvent = allEvents.find(event => event.id === eventIdToUse);
            if (selectedEvent) {
                active.eventName = selectedEvent.name;
            }
        }
        setActiveFilters(active);

        // Apply the filter using the provided action
        try {
            const result = await dispatch(eventActionRef.current(filters));
            if (result) {
                console.log('Event filter applied successfully');
            }
            return result;
        } catch (error) {
            console.error('Error applying event filter:', error);
            return false;
        }
    }, [dispatch, selectedEventId, allEvents, memoizedInitialFilters]);

    // Clear all filters
    const clearFilters = useCallback(async () => {
        setSelectedEventId('');
        setActiveFilters({});
        
        try {
            // Call the event action without filters (or with just initial filters)
            const result = await dispatch(eventActionRef.current(memoizedInitialFilters));
           
            return result;
        } catch (error) {
            console.error('Error clearing event filters:', error);
            return false;
        }
    }, [dispatch, memoizedInitialFilters]);

    // Handle event selection change
    const handleEventChange = useCallback((eventId) => {
        setSelectedEventId(eventId);
    }, []);

    // Use ref to track previous event IDs to prevent unnecessary updates
    const prevEventsIdStringRef = useRef('');
    const prevEventsRef = useRef([]);
    
    // Sync with Redux state when it changes - NO API CALL, only use Redux data
    useEffect(() => {
        // Only update if the actual event IDs have changed (not just the reference)
        if (eventsIdString !== prevEventsIdStringRef.current) {
            if (eventsFromReduxRaw && Array.isArray(eventsFromReduxRaw) && eventsFromReduxRaw.length > 0) {
                setAllEvents(eventsFromReduxRaw);
                setLoadingDropdowns(false);
            } else {
                setAllEvents([]);
            }
            prevEventsIdStringRef.current = eventsIdString;
            prevEventsRef.current = eventsFromReduxRaw;
        }
        // Only depend on eventsIdString - the actual events array is captured via closure
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [eventsIdString]);

    // Memoize return object to prevent unnecessary re-renders
    const returnValue = useMemo(() => ({
        // Filter state
        selectedEventId,
        allEvents,
        loadingDropdowns,
        activeFilters,
        
        // Methods
        applyFilters,
        clearFilters,
        handleEventChange,
        
        // For direct state updates if needed
        setSelectedEventId,
        setActiveFilters
    }), [
        selectedEventId,
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
