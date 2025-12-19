import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Button, Row, Col, Container } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createRegisterEvent, adminUpdateRegisterEvent, registerEventById } from '../../../store/actions/eventActions';
import { filterUserList, filterEventList } from '../../../store/actions/filterActions';
import { EVENT_PATHS } from '../../../utils/constants';
import useTableNavigation from '../../../hooks/useTableNavigation';
import SearchableDropdown from '../../../components/common/SearchableDropdown';

const AddRegisterEventPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // For edit mode
    const previousPageRef = useRef(null);

    // Use reusable table navigation hook for back navigation
    const { handleBack } = useTableNavigation({
        tableRef: null, // Not needed for back navigation
        listPath: EVENT_PATHS.REGISTERED_EVENTS,
        viewPath: EVENT_PATHS.VIEW_REGISTER_EVENT,
        editPath: EVENT_PATHS.EDIT_REGISTER_EVENT,
        addPath: EVENT_PATHS.ADD_REGISTER_EVENT
    });

    const [formData, setFormData] = useState({
        userId: '',
        eventId: '',
        type: 'Attendee',
        registerCode: '',
        isCreatedByAdmin: true
    });

    const [submitting, setSubmitting] = useState(false); // For form submission
    const [currentUser, setCurrentUser] = useState(null);
    const [currentEvent, setCurrentEvent] = useState(null);
    const [users, setUsers] = useState([]); // Local state for users from filter API
    const [events, setEvents] = useState([]); // Local state for events from filter API
    
    // Pagination and search states for users
    const [userSearch, setUserSearch] = useState('');
    const [userPage, setUserPage] = useState(1);
    const [userPagination, setUserPagination] = useState({ total: 0, totalPages: 0 });
    const [userLoading, setUserLoading] = useState(false);
    
    // Pagination and search states for events
    const [eventSearch, setEventSearch] = useState('');
    const [eventPage, setEventPage] = useState(1);
    const [eventPagination, setEventPagination] = useState({ total: 0, totalPages: 0 });
    const [eventLoading, setEventLoading] = useState(false);

    // Load data for edit mode
    useEffect(() => {
        if (id) {
            const loadRegisterEventData = async () => {
                try {
                    const response = await dispatch(registerEventById(id));
                    if (response?.data) {
                        const editData = response.data;

                        // Store current user and event data
                        setCurrentUser(editData.user);
                        setCurrentEvent(editData.event);

                        setFormData({
                            userId: editData.user?.id || '',
                            eventId: editData.event?.id || '',
                            type: editData.type || 'Attendee',
                            registerCode: editData.registerCode || '',
                            isCreatedByAdmin: editData.isCreatedByAdmin || true
                        });

                        // Capture page from URL if available
                        const urlParams = new URLSearchParams(location.search);
                        const page = urlParams.get('page');
                        if (page) {
                            previousPageRef.current = page;
                        }
                    }
                } catch (error) {
                    console.error('Error loading register event data:', error);
                }
            };
            loadRegisterEventData();
        } else {
            // Capture page from URL for create mode
            const urlParams = new URLSearchParams(location.search);
            const page = urlParams.get('page');
            if (page) {
                previousPageRef.current = page;
            }
        }
    }, [id, dispatch, location.search]);

    const handleInputChange = async (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    // Load users with search and pagination
    const loadUsers = useCallback(async (search = '', page = 1, append = false) => {
        setUserLoading(true);
        try {
            const result = await filterUserList({ search, page, limit: 20 });
            if (result?.success) {
                if (append) {
                    setUsers(prev => [...prev, ...result.data]);
                } else {
                    setUsers(result.data);
                }
                setUserPagination(result.pagination || {});
            }
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setUserLoading(false);
        }
    }, []);

    // Load events with search and pagination
    const loadEvents = useCallback(async (search = '', page = 1, append = false) => {
        setEventLoading(true);
        try {
            const result = await filterEventList({ search, page, limit: 20 });
            if (result?.success) {
                if (append) {
                    setEvents(prev => [...prev, ...result.data]);
                } else {
                    setEvents(result.data);
                }
                setEventPagination(result.pagination || {});
            }
        } catch (error) {
            console.error('Error loading events:', error);
        } finally {
            setEventLoading(false);
        }
    }, []);

    // Handle user dropdown open - load initial data
    const handleUserDropdownOpen = useCallback(() => {
        if (users.length === 0) {
            loadUsers('', 1, false);
        }
    }, [users.length, loadUsers]);

    // Handle event dropdown open - load initial data
    const handleEventDropdownOpen = useCallback(() => {
        if (events.length === 0) {
            loadEvents('', 1, false);
        }
    }, [events.length, loadEvents]);

    // Handle load more users (infinite scroll)
    const handleLoadMoreUsers = useCallback(async () => {
        if (!userLoading && userPage < userPagination.totalPages) {
            const nextPage = userPage + 1;
            setUserPage(nextPage);
            await loadUsers(userSearch, nextPage, true);
        }
    }, [userLoading, userPage, userPagination.totalPages, userSearch, loadUsers]);

    // Handle load more events (infinite scroll)
    const handleLoadMoreEvents = useCallback(async () => {
        if (!eventLoading && eventPage < eventPagination.totalPages) {
            const nextPage = eventPage + 1;
            setEventPage(nextPage);
            await loadEvents(eventSearch, nextPage, true);
        }
    }, [eventLoading, eventPage, eventPagination.totalPages, eventSearch, loadEvents]);

    // Handle user search
    const handleUserSearch = useCallback((searchTerm) => {
        setUserSearch(searchTerm);
        setUserPage(1);
        loadUsers(searchTerm, 1, false);
    }, [loadUsers]);

    // Handle event search
    const handleEventSearch = useCallback((searchTerm) => {
        setEventSearch(searchTerm);
        setEventPage(1);
        loadEvents(searchTerm, 1, false);
    }, [loadEvents]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            let response;
            if (id) {
                // Edit mode - update existing register event
                // Include userId and eventId in the update data
                const updateData = {
                    userId: formData.userId,
                    eventId: formData.eventId,
                    type: formData.type,
                    registerCode: formData.registerCode,
                    isCreatedByAdmin: formData.isCreatedByAdmin
                };
                response = await dispatch(adminUpdateRegisterEvent(id, updateData));
            } else {
                // Create mode - create new register event
                response = await dispatch(createRegisterEvent(formData));
            }

            if (response) {
                if (!id) {
                    setFormData({
                        userId: '',
                        eventId: '',
                        type: 'Attendee',
                        registerCode: '',
                        isCreatedByAdmin: true
                    });
                }

                // Navigate back with page preservation
                const urlParams = new URLSearchParams(location.search);
                const currentPage = urlParams.get('page') || location.state?.page || previousPageRef.current;
                handleBack(currentPage);
            }
        } catch (err) {
            setSubmitting(false);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancel = () => {
        // Navigate back with page preservation
        const urlParams = new URLSearchParams(location.search);
        const currentPage = urlParams.get('page') || location.state?.page || previousPageRef.current;
        handleBack(currentPage);
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Register' : 'Add Register'}</h4>
                                <Button variant="secondary" onClick={handleCancel}>
                                    <i style={{ marginRight: '10px' }} className="fas fa-arrow-left me-2"></i>
                                    Back
                                </Button>
                            </div>
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col sm={12}>
                                            <SearchableDropdown
                                                label="Select User"
                                                name="userId"
                                                value={formData.userId}
                                                onChange={handleInputChange}
                                                options={users.map(user => ({
                                                    id: user.id,
                                                    name: `${user.firstName} ${user.lastName}${user.email ? ` (${user.email})` : ''}`
                                                }))}
                                                onLoadMore={handleLoadMoreUsers}
                                                hasMore={userPage < userPagination.totalPages}
                                                loading={userLoading}
                                                placeholder="Select a user"
                                                displayKey="name"
                                                valueKey="id"
                                                searchPlaceholder="Search users by name or email..."
                                                required
                                                onOpen={handleUserDropdownOpen}
                                                onSearch={handleUserSearch}
                                            />
                                            {id && currentUser && (
                                                <small className="text-info">
                                                    Current: {currentUser.firstName} {currentUser.lastName} ({currentUser.email})
                                                </small>
                                            )}
                                        </Col>

                                        <Col sm={12}>
                                            <SearchableDropdown
                                                label="Select Event"
                                                name="eventId"
                                                value={formData.eventId}
                                                onChange={handleInputChange}
                                                options={events.map(event => ({
                                                    id: event.id,
                                                    name: `${event.name} - ${new Date(event.startDate).toLocaleDateString()}`
                                                }))}
                                                onLoadMore={handleLoadMoreEvents}
                                                hasMore={eventPage < eventPagination.totalPages}
                                                loading={eventLoading}
                                                placeholder="Select an event"
                                                displayKey="name"
                                                valueKey="id"
                                                searchPlaceholder="Search events..."
                                                required
                                                onOpen={handleEventDropdownOpen}
                                                onSearch={handleEventSearch}
                                            />
                                            {id && currentEvent && (
                                                <small className="text-info">
                                                    Current: {currentEvent.name} (
                                                    {new Date(currentEvent.startDate).toLocaleDateString()})
                                                </small>
                                            )}
                                        </Col>

                                        <Col sm={12}>
                                            <div className="form-group fill">
                                                <label className="floating-label" htmlFor="type">
                                                    Registration Type
                                                </label>
                                                <select
                                                    className="form-control"
                                                    name="type"
                                                    value={formData.type}
                                                    onChange={handleInputChange}
                                                    required
                                                >
                                                    <option value="Attendee">Attendee</option>
                                                    <option value="Exhibitor">Exhibitor</option>
                                                </select>
                                            </div>
                                        </Col>

                                        <Col sm={12}>
                                            <div className="form-group fill">
                                                <label className="floating-label" htmlFor="registerCode">
                                                    Register Code
                                                </label>
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    name="registerCode"
                                                    value={formData.registerCode}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter register code (optional for admin)"
                                                />
                                            </div>
                                        </Col>
                                    </Row>

                                    {/* Form Actions */}
                                    <div className="row mt-4">
                                        <div className="col-12">
                                            <div className="d-flex justify-content-between gap-2">
                                                <Button variant="danger" onClick={handleCancel}>
                                                    Cancel
                                                </Button>
                                                <Button
                                                    variant="primary"
                                                    type="submit"
                                                    disabled={submitting || !formData.userId || !formData.eventId}
                                                >
                                                    {submitting ? (id ? 'Updating...' : 'Creating...') : id ? 'Update' : 'Create'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                        </div>
                    </div>
                </div>
            </div>
        </Container>
    );
};

export default AddRegisterEventPage;
