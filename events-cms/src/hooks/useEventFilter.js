import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { eventList, upcomingEventList, getAllEventsForFilter } from '../store/actions/eventActions';

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
    
    // Memoize initial filters to prevent unnecessary re-renders
    const memoizedInitialFilters = useMemo(() => initialFilters, [JSON.stringify(initialFilters)]);
    
    // Use ref to store eventAction to prevent dependency issues
    const eventActionRef = useRef(eventAction);
    eventActionRef.current = eventAction;
    
    // Filter states
    const [selectedEventId, setSelectedEventId] = useState('');
    const [allEvents, setAllEvents] = useState([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});

    // Load all events for dropdown
    const loadEventsForDropdown = useCallback(async () => {
        setLoadingDropdowns(true);
        try {
            const eventsData = await dispatch(getAllEventsForFilter());
            setAllEvents(eventsData || []);
        } catch (error) {
            console.error('Error loading events for dropdown:', error);
            setAllEvents([]);
        } finally {
            setLoadingDropdowns(false);
        }
    }, [dispatch]);

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

    // Initialize dropdown data - only run once
    useEffect(() => {
        loadEventsForDropdown();
    }, [loadEventsForDropdown]);

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
        loadEventsForDropdown,
        
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
        handleEventChange,
        loadEventsForDropdown
    ]);

    return returnValue;
};

export default useEventFilter;
