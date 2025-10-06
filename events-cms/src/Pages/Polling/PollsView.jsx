import * as React from 'react';
import { useEffect, useState, useCallback } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { getAllPollsForAdmin, deletePoll, togglePollLive } from '../../store/actions/pollingActions';
import { eventList } from '../../store/actions/eventActions';
import { speakerList } from '../../store/actions/speakerActions';
import { useNavigate } from 'react-router-dom';
import '../../assets/css/event.css';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import FilterComponent from '../../components/common/FilterComponent';
import { formatDateTimeForTable } from '../../components/dateTime/dateTimeUtils';
import { POLLING_PATHS } from '../../utils/constants';
import { Button } from 'react-bootstrap';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function pollsTable(data, handleAdd, handleEdit, handleDelete, handleView, handleToggleLive) {
    let tableZero = '#polls-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data || [],
        order: [[4, 'desc']], // Sort by created date descending
        searching: true,
        searchDelay: 500,
        pageLength: 10,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-poll-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'question',
                title: 'Poll Question',
                width: '35%',
                render: function (data, type, row) {
                    const truncatedQuestion = data.length > 60 ? data.substring(0, 60) + '...' : data;
                    const speakerName = row.speaker?.name || 'No Speaker';
                    const totalVotes = row.totalVotes || 0;
                    const totalVoters = row.totalVoters || 0;

                    return `
                        <div class="d-inline-block align-middle" style="max-width: 100%;">
                            <h6 class="m-b-0" style="font-size: 14px; font-weight: 600;">${truncatedQuestion}</h6>
                            <p class="m-b-0 text-muted" style="font-size: 12px; margin-top: 4px;">
                                <i class="feather icon-mic" style="color: #17a2b8;"></i> <span style="font-weight: 500;">${speakerName}</span>
                                <span class="mx-2">|</span>
                                <i class="feather icon-users" style="color: #28a745;"></i> ${totalVotes} votes (${totalVoters} voters)
                            </p>
                        </div>
                    `;
                }
            },
            {
                data: 'options',
                title: 'Options',
                width: '10%',
                className: 'text-center',
                render: function (data, type, row) {
                    const optionCount = data?.length || 0;
                    return `
                        <span class="badge badge-light-info" style="font-size: 13px; padding: 6px 12px;">
                            <i class="feather icon-list" style="margin-right: 4px;"></i>${optionCount}
                        </span>
                    `;
                }
            },
            {
                data: 'timerSeconds',
                title: 'Timer',
                width: '10%',
                className: 'text-center',
                render: function (data, type, row) {
                    const timer = data || 30;
                    return `
                        <span class="badge badge-light-warning" style="font-size: 13px; padding: 6px 12px;">
                            <i class="feather icon-clock" style="margin-right: 4px;"></i>${timer}s
                        </span>
                    `;
                }
            },
            {
                data: 'isLive',
                title: 'Status',
                width: '12%',
                className: 'text-center',
                render: function (data, type, row) {
                    const isLive = data || false;
                    const badgeClass = isLive ? 'badge-light-success' : 'badge-light-secondary';
                    const statusText = isLive ? 'Live' : 'Offline';
                    const iconClass = isLive ? 'icon-check-circle' : 'icon-x-circle';

                    return `
                        <span class="badge ${badgeClass} toggle-live-badge" data-id="${row.id}" 
                              style="cursor: pointer; font-size: 13px; padding: 6px 16px; min-width: 90px;" 
                              title="Click to toggle">
                            <i class="feather ${iconClass}" style="margin-right: 4px;"></i>${statusText}
                        </span>
                    `;
                }
            },
            {
                data: 'createdAt',
                title: 'Created',
                width: '15%',
                render: function (data, type, row) {
                    return formatDateTimeForTable(data);
                }
            },
            {
                data: null,
                title: 'Actions',
                width: '18%',
                orderable: false,
                className: 'text-center',
                render: function (data, type, row) {
                    return `
                        <div class="btn-group" role="group" aria-label="Actions">
                            <button type="button" class="btn btn-icon btn-success view-btn" data-id="${row.id}" title="View Details" 
                                style="margin-right: 8px;border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-eye"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-warning edit-btn" data-id="${row.id}" title="Edit Poll" 
                                style="margin-right: 8px;border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-edit"></i>
                            </button>
                            <button type="button" class="btn btn-icon btn-danger delete-btn" data-id="${row.id}" title="Delete Poll" 
                                style="border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-trash-2"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        initComplete: function (settings, json) {
            // Add "Create New Poll" button
            $('.add-poll-button').html(
                '<button type="button" class="btn btn-primary add-new-poll-btn" style="white-space: nowrap;">' +
                    '<i class="feather icon-plus"></i> Create New Poll' +
                    '</button>'
            );

            // Attach event listeners
            $('.add-new-poll-btn')
                .off('click')
                .on('click', function () {
                    handleAdd();
                });

            // Restore the previous page
            $(tableZero).DataTable().page(currentPage).draw('page');
        },
        drawCallback: function (settings) {
            // Attach event listeners after each draw
            $('.view-btn')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleView(id);
                });

            $('.edit-btn')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleEdit(id);
                });

            $('.delete-btn')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleDelete(id);
                });

            $('.toggle-live-badge')
                .off('click')
                .on('click', function () {
                    const id = $(this).data('id');
                    handleToggleLive(id);
                });
        }
    });
}

const PollsView = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { polls, loading } = useSelector((state) => state.polling);
    const events = useSelector((state) => state.event?.event?.events || []);

    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPollId, setSelectedPollId] = useState(null);
    const [selectedPollName, setSelectedPollName] = useState('');
    const [flatPolls, setFlatPolls] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [selectedSpeakerId, setSelectedSpeakerId] = useState('');
    const speakers = useSelector((state) => state.speaker?.speakers || []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                await dispatch(getAllPollsForAdmin());
                await dispatch(eventList());
                await dispatch(speakerList());
            } catch (error) {
                console.error('Error fetching initial data:', error);
            }
        };
        fetchData();
    }, [dispatch]);

    // Flatten and filter polls data for DataTable
    useEffect(() => {
        console.log('Polls state:', polls);

        if (polls?.data && Array.isArray(polls.data)) {
            let processedPolls = [];

            // Check if it's the new format (flat array)
            if (polls.data.length > 0 && polls.data[0].question && !polls.data[0].questions) {
                // New admin API format - already flat
                processedPolls = polls.data;
            } else {
                // Old grouped format
                processedPolls = polls.data.flatMap(
                    (eventGroup) =>
                        eventGroup.questions?.map((poll) => ({
                            ...poll,
                            event: eventGroup.event,
                            speaker: eventGroup.speaker
                        })) || []
                );
            }

            // Apply filters
            if (selectedEventId) {
                processedPolls = processedPolls.filter((poll) => poll.event?.id === selectedEventId);
            }
            if (selectedSpeakerId) {
                processedPolls = processedPolls.filter((poll) => poll.speaker?.id === selectedSpeakerId);
            }

            setFlatPolls(processedPolls);
        } else {
            setFlatPolls([]);
        }
    }, [polls, selectedEventId, selectedSpeakerId]);

    useEffect(() => {
        if (!loading && flatPolls.length >= 0) {
            pollsTable(flatPolls, handleAddPoll, handleEditPoll, handleDeletePollClick, handleViewPoll, handleToggleLive);
        }
    }, [flatPolls, loading]);

    const handleAddPoll = useCallback(() => {
        navigate(POLLING_PATHS.ADD_POLL);
    }, [navigate]);

    const handleEditPoll = useCallback(
        (id) => {
            navigate(`${POLLING_PATHS.EDIT_POLL}/${id}`);
        },
        [navigate]
    );

    const handleViewPoll = useCallback(
        (id) => {
            navigate(`${POLLING_PATHS.VIEW_POLL}/${id}`);
        },
        [navigate]
    );

    const handleDeletePollClick = useCallback(
        (id) => {
            const poll = flatPolls.find((p) => p.id === id);
            if (poll) {
                setSelectedPollId(id);
                setSelectedPollName(poll.question);
                setShowDeleteModal(true);
            }
        },
        [flatPolls]
    );

    const handleDeleteConfirm = useCallback(async () => {
        if (selectedPollId) {
            try {
                await dispatch(deletePoll(selectedPollId));
                setShowDeleteModal(false);
                setSelectedPollId(null);
                setSelectedPollName('');
                dispatch(getAllPollsForAdmin());
            } catch (error) {
                console.error('Error deleting poll:', error);
            }
        }
    }, [dispatch, selectedPollId]);

    const handleToggleLive = useCallback(
        async (id) => {
            try {
                await dispatch(togglePollLive(id));
                dispatch(getAllPollsForAdmin());
            } catch (error) {
                console.error('Error toggling poll status:', error);
            }
        },
        [dispatch]
    );

    const handleClearFilters = useCallback(() => {
        setSelectedEventId('');
        setSelectedSpeakerId('');
    }, []);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="sr-only">Loading...</span>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Filter Component - Same as Event (No Apply button, auto-filter) */}
            <Card className="mb-4 shadow-sm border-0" style={{ borderRadius: '8px' }}>
                <Card.Header className="bg-light border-0" style={{ padding: '16px 20px', borderRadius: '8px 8px 0 0' }}>
                    <div className="d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center">
                            <i className="feather icon-filter mr-2" style={{ color: '#4680ff', fontSize: '18px' }}></i>
                            <h6 className="mb-0" style={{ fontWeight: '600', color: '#495057' }}>
                                Filter Options
                            </h6>
                        </div>
                        {(selectedEventId || selectedSpeakerId) && (
                            <span
                                className="badge badge-primary"
                                style={{ backgroundColor: '#4680ff', fontSize: '11px', padding: '4px 8px' }}
                            >
                                {[selectedEventId, selectedSpeakerId].filter(Boolean).length} Active
                            </span>
                        )}
                    </div>
                </Card.Header>
                <Card.Body style={{ padding: '20px' }}>
                    <Row className="align-items-end g-3">
                        {/* Event Filter */}
                        <Col xl={4} lg={4} md={6} sm={12} xs={12}>
                            <Form.Group className="mb-0">
                                <Form.Label style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                                    <i className="feather icon-calendar mr-1"></i>
                                    Filter by Event
                                </Form.Label>
                                <Form.Select
                                    value={selectedEventId}
                                    onChange={(e) => setSelectedEventId(e.target.value)}
                                    style={{
                                        borderRadius: '6px',
                                        border: '1px solid #ced4da',
                                        padding: '8px 12px',
                                        width: '100%',
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    <option value="">All Events</option>
                                    {events?.map((event) => (
                                        <option key={event.id} value={event.id}>
                                            {event.name} {event.location ? `(${event.location})` : ''}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        {/* Speaker Filter */}
                        <Col xl={4} lg={4} md={6} sm={12} xs={12}>
                            <Form.Group className="mb-0">
                                <Form.Label style={{ fontSize: '14px', fontWeight: '600', color: '#495057', marginBottom: '8px' }}>
                                    <i className="feather icon-mic mr-1"></i>
                                    Filter by Speaker
                                </Form.Label>
                                <Form.Select
                                    value={selectedSpeakerId}
                                    onChange={(e) => setSelectedSpeakerId(e.target.value)}
                                    style={{
                                        borderRadius: '6px',
                                        border: '1px solid #ced4da',
                                        padding: '8px 12px',
                                        width: '100%',
                                        maxWidth: '100%',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis'
                                    }}
                                >
                                    <option value="">All Speakers</option>
                                    {speakers?.map((speaker) => (
                                        <option key={speaker.id} value={speaker.id}>
                                            {speaker.firstName} {speaker.lastName} ({speaker.email})
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>

                        {/* Clear Button */}
                        <Col xl={4} lg={4} md={12} sm={12} xs={12} className="mt-md-3 mt-sm-3 mt-3">
                            <div
                                className="d-flex align-items-end justify-content-xl-end justify-content-lg-end justify-content-md-start justify-content-sm-start justify-content-start flex-wrap"
                                style={{ gap: '12px' }}
                            >
                                {(selectedEventId || selectedSpeakerId) && (
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleClearFilters}
                                        style={{
                                            borderRadius: '6px',
                                            padding: '8px 14px',
                                            fontSize: '13px',
                                            fontWeight: '500',
                                            minWidth: '75px',
                                            whiteSpace: 'nowrap'
                                        }}
                                    >
                                        <i className="feather icon-x mr-1"></i>
                                        Clear
                                    </Button>
                                )}
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="polls-data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '35%' }}>Poll Question</th>
                                        <th style={{ width: '10%' }} className="text-center">
                                            Options
                                        </th>
                                        <th style={{ width: '10%' }} className="text-center">
                                            Timer
                                        </th>
                                        <th style={{ width: '12%' }} className="text-center">
                                            Status
                                        </th>
                                        <th style={{ width: '15%' }}>Created</th>
                                        <th style={{ width: '18%' }} className="text-center">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Delete Confirmation Modal */}
            <DeleteConfirmationModal
                show={showDeleteModal}
                onHide={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteConfirm}
                title="Delete Poll"
                message={`Are you sure you want to delete this poll? "${selectedPollName}"`}
            />
        </>
    );
};

export default PollsView;
