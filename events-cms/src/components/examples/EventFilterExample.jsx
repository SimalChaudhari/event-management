import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { Row, Col, Card } from 'react-bootstrap';
import FilterComponent from '../common/FilterComponent';
import { eventList, getAllEventsForFilter } from '../../store/actions/eventActions';

/**
 * Example component demonstrating exact event name dropdown filtering
 * This shows how to implement the exact event name filter functionality
 */
const EventFilterExample = () => {
    const dispatch = useDispatch();
    
    // Filter states
    const [selectedEventId, setSelectedEventId] = useState('');
    const [allEvents, setAllEvents] = useState([]);
    const [loadingDropdowns, setLoadingDropdowns] = useState(false);
    const [activeFilters, setActiveFilters] = useState({});
    const [filteredEvents, setFilteredEvents] = useState([]);

    // Load all events for dropdown
    const loadEventsForDropdown = async () => {
        setLoadingDropdowns(true);
        try {
            const eventsData = await dispatch(getAllEventsForFilter());
            setAllEvents(eventsData || []);
        } catch (error) {
            console.error('Error loading events for dropdown:', error);
        } finally {
            setLoadingDropdowns(false);
        }
    };

    // Apply exact event name filter
    const applyFilters = async (filterOverrides = {}) => {
        const eventIdToUse = filterOverrides.eventId || selectedEventId;
        
        const filters = {};
        if (eventIdToUse && allEvents.length > 0) {
            const selectedEvent = allEvents.find(event => event.id === eventIdToUse);
            if (selectedEvent) {
                // Pass exact event name for filtering
                filters.eventName = selectedEvent.name;
                console.log('Filtering by exact event name:', selectedEvent.name);
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

        // Apply the filter to get events
        const result = await dispatch(eventList(filters));
        if (result) {
            console.log('Filter applied successfully');
        }
    };

    // Clear all filters
    const clearFilters = async () => {
        setSelectedEventId('');
        setActiveFilters({});
        await dispatch(eventList()); // Load all events without filters
        console.log('Filters cleared');
    };

    // Load dropdown data on component mount
    useEffect(() => {
        loadEventsForDropdown();
    }, []);

    return (
        <div>
            <Row>
                <Col>
                    <Card className="mb-4">
                        <Card.Header>
                            <h5 className="mb-0">Event Name Filter Example</h5>
                            <small className="text-muted">
                                Demonstrates exact event name filtering using dropdown selection
                            </small>
                        </Card.Header>
                        <Card.Body>
                            {/* Filter Component with only event filter enabled */}
                            <FilterComponent
                                events={allEvents}
                                loadingDropdowns={loadingDropdowns}
                                selectedEventId={selectedEventId}
                                onEventChange={setSelectedEventId}
                                onApplyFilters={applyFilters}
                                onClearFilters={clearFilters}
                                activeFilters={activeFilters}
                                showUserFilter={false}
                                showEventFilter={true}
                            />
                            
                            {/* Display current filter status */}
                            <div className="mt-3">
                                <h6>Current Filter Status:</h6>
                                {Object.keys(activeFilters).length > 0 ? (
                                    <div className="alert alert-info">
                                        <strong>Active Filter:</strong> Event Name = "{activeFilters.eventName}"
                                    </div>
                                ) : (
                                    <div className="alert alert-secondary">
                                        <strong>No filters applied</strong> - Showing all events
                                    </div>
                                )}
                            </div>

                            {/* Instructions */}
                            <div className="mt-3">
                                <h6>How it works:</h6>
                                <ol>
                                    <li>Select an event from the dropdown</li>
                                    <li>Click "Apply" to filter by that exact event name</li>
                                    <li>The backend will return only events with that exact name</li>
                                    <li>Click "Clear" to remove the filter and show all events</li>
                                </ol>
                                
                                <h6 className="mt-3">API Behavior:</h6>
                                <ul>
                                    <li><code>GET /api/events</code> - Returns all events</li>
                                    <li><code>GET /api/events?eventName=Conference%202024</code> - Returns only events with name "Conference 2024"</li>
                                    <li>Filter performs exact string matching (case-sensitive)</li>
                                    <li>Can be combined with other filters like keyword, category, etc.</li>
                                </ul>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </div>
    );
};

export default EventFilterExample;
