import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { Row, Col, Card, Table, Badge, Button, Spinner, Alert, ProgressBar, Form } from 'react-bootstrap';
import { getPollResults } from '../../store/actions/pollingActions';
import { POLLING_PATHS } from '../../utils/constants';
import DateTimeFormatter from '../../components/dateTime/DateTimeFormatter';

const PollResultsPage = () => {
    const { eventId } = useParams();
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const { pollResults, loading, error } = useSelector((state) => state.polling);

    const [selectedPoll, setSelectedPoll] = useState(null);
    const [selectedSpeaker, setSelectedSpeaker] = useState('all');

    useEffect(() => {
        if (eventId) {
            dispatch(getPollResults(eventId));
        }
    }, [dispatch, eventId]);

    useEffect(() => {
        if (pollResults?.data?.polls && pollResults.data.polls.length > 0) {
            setSelectedPoll(pollResults.data.polls[0].id);
        }
    }, [pollResults]);

    if (loading) {
        return (
            <div className="text-center py-5">
                <Spinner animation="border" role="status">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="danger">
                <Alert.Heading>Error</Alert.Heading>
                <p>{error}</p>
                <Button variant="outline-danger" onClick={() => navigate(POLLING_PATHS.LIST_POLLS)}>
                    Back to Polls
                </Button>
            </Alert>
        );
    }

    const event = pollResults?.data?.event;
    const polls = pollResults?.data?.polls || [];
    const summary = pollResults?.data?.summary || {};
    const userVoteSummary = pollResults?.data?.userVoteSummary || [];

    const currentPoll = polls.find(p => p.id === selectedPoll);

    // Filter votes by speaker
    const filteredVotes = selectedSpeaker === 'all'
        ? currentPoll?.allVotes || []
        : currentPoll?.allVotes?.filter(vote => vote.speakerId === selectedSpeaker) || [];

    return (
        <React.Fragment>
            <Row>
                <Col>
                    {/* Header Card */}
                    <Card className="mb-3">
                        <Card.Header>
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <Card.Title as="h5">Poll Results & Analytics</Card.Title>
                                    <p className="text-muted mb-0">
                                        Event: {event?.name || 'Unknown Event'}
                                    </p>
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={() => navigate(POLLING_PATHS.LIST_POLLS)}
                                >
                                    <i className="feather icon-arrow-left me-2"></i>
                                    Back to Polls
                                </Button>
                            </div>
                        </Card.Header>
                    </Card>

                    {/* Summary Cards */}
                    <Row className="mb-3">
                        <Col md={3}>
                            <Card className="bg-primary text-white">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <h6 className="text-white mb-1">Total Polls</h6>
                                            <h3 className="text-white mb-0">{summary.totalPolls || 0}</h3>
                                        </div>
                                        <i className="feather icon-bar-chart-2" style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="bg-success text-white">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <h6 className="text-white mb-1">Total Votes</h6>
                                            <h3 className="text-white mb-0">{summary.totalVotes || 0}</h3>
                                        </div>
                                        <i className="feather icon-check-circle" style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="bg-info text-white">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <h6 className="text-white mb-1">Unique Voters</h6>
                                            <h3 className="text-white mb-0">{summary.uniqueVoters || 0}</h3>
                                        </div>
                                        <i className="feather icon-users" style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                        <Col md={3}>
                            <Card className="bg-warning text-white">
                                <Card.Body>
                                    <div className="d-flex align-items-center justify-content-between">
                                        <div>
                                            <h6 className="text-white mb-1">Speakers</h6>
                                            <h3 className="text-white mb-0">{summary.uniqueSpeakers || 0}</h3>
                                        </div>
                                        <i className="feather icon-mic" style={{ fontSize: '2.5rem', opacity: 0.5 }}></i>
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>

                    {/* Poll Selection & Results */}
                    {polls.length > 0 ? (
                        <>
                            <Card className="mb-3">
                                <Card.Header>
                                    <Row className="align-items-center">
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Select Poll</Form.Label>
                                                <Form.Select
                                                    value={selectedPoll || ''}
                                                    onChange={(e) => setSelectedPoll(e.target.value)}
                                                >
                                                    {polls.map((poll) => (
                                                        <option key={poll.id} value={poll.id}>
                                                            {poll.question}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group>
                                                <Form.Label>Filter by Speaker</Form.Label>
                                                <Form.Select
                                                    value={selectedSpeaker}
                                                    onChange={(e) => setSelectedSpeaker(e.target.value)}
                                                >
                                                    <option value="all">All Speakers</option>
                                                    {summary.speakers?.map((speaker) => (
                                                        <option key={speaker.id} value={speaker.id}>
                                                            {speaker.name}
                                                        </option>
                                                    ))}
                                                </Form.Select>
                                            </Form.Group>
                                        </Col>
                                    </Row>
                                </Card.Header>
                                <Card.Body>
                                    {currentPoll && (
                                        <>
                                            <h5 className="mb-4">{currentPoll.question}</h5>
                                            <div className="mb-3">
                                                <Badge bg="info" className="me-2">
                                                    Total Votes: {currentPoll.totalVotes}
                                                </Badge>
                                                <Badge bg="success">
                                                    Voters: {currentPoll.totalVoters}
                                                </Badge>
                                            </div>

                                            {/* Options with Progress Bars */}
                                            {currentPoll.options?.map((option, index) => (
                                                <div key={option.id} className="mb-4">
                                                    <div className="d-flex justify-content-between align-items-center mb-2">
                                                        <div className="d-flex align-items-center gap-2">
                                                            <Badge bg="light" text="dark">
                                                                {String.fromCharCode(65 + index)}
                                                            </Badge>
                                                            <strong>{option.optionText}</strong>
                                                        </div>
                                                        <div className="d-flex align-items-center gap-3">
                                                            <span className="text-muted">
                                                                {option.voteCount} {option.voteCount === 1 ? 'vote' : 'votes'}
                                                            </span>
                                                            <Badge bg="primary">{option.percentage}%</Badge>
                                                        </div>
                                                    </div>
                                                    <ProgressBar
                                                        now={option.percentage}
                                                        variant={option.percentage >= 50 ? 'success' : option.percentage >= 25 ? 'info' : 'warning'}
                                                        style={{ height: '25px' }}
                                                        label={`${option.percentage}%`}
                                                    />
                                                </div>
                                            ))}
                                        </>
                                    )}
                                </Card.Body>
                            </Card>

                            {/* Voters Table */}
                            {filteredVotes.length > 0 && (
                                <Card>
                                    <Card.Header>
                                        <Card.Title as="h6">
                                            Voter Details ({filteredVotes.length} {filteredVotes.length === 1 ? 'vote' : 'votes'})
                                        </Card.Title>
                                    </Card.Header>
                                    <Card.Body>
                                        <Table responsive hover>
                                            <thead>
                                                <tr>
                                                    <th>#</th>
                                                    <th>Voter Name</th>
                                                    <th>Email</th>
                                                    <th>Speaker</th>
                                                    <th>Selected Option</th>
                                                    <th>Voted At</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredVotes.map((vote, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>{vote.user?.fullName || 'N/A'}</td>
                                                        <td>{vote.user?.email || 'N/A'}</td>
                                                        <td>
                                                            {vote.speaker?.name || 'No Speaker'}
                                                        </td>
                                                        <td>
                                                            <Badge bg="light" text="dark">
                                                                {vote.selectedOption?.optionText || 'N/A'}
                                                            </Badge>
                                                        </td>
                                                        <td>
                                                            <DateTimeFormatter date={vote.votedAt} />
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </Card.Body>
                                </Card>
                            )}
                        </>
                    ) : (
                        <Alert variant="info">
                            <i className="feather icon-info me-2"></i>
                            No polls found for this event
                        </Alert>
                    )}
                </Col>
            </Row>
        </React.Fragment>
    );
};

export default PollResultsPage;

