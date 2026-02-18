import React, { useEffect, useState } from 'react';
import { Row, Col, Card, Table, Button, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../../../configs/axiosInstance';
import { EVENT_PATHS } from '../../../utils/constants';
import { API_URL, DUMMY_PATH } from '../../../configs/env';
import '../../../assets/css/event.css';

const GalleryEventSelectPage = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            try {
                const res = await axiosInstance.get('/events', {
                    params: { limit: 500, page: 1 }
                });
                const list = res?.data?.events ?? res?.data?.data ?? (Array.isArray(res?.data) ? res.data : []);
                setEvents(Array.isArray(list) ? list : []);
            } catch (e) {
                console.error('Failed to load events', e);
                setEvents([]);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const handleOpenGallery = (eventId) => {
        navigate(`${EVENT_PATHS.GALLERY_EVENT}/${eventId}`);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <>
            <Row>
                <Col sm={12}>
                    <Card className="gallery-list">
                        <Card.Body>
                            <h5 className="mb-3">
                                <i className="fas fa-images mr-2" style={{ color: '#4680ff' }}></i>
                                Select an event to manage its gallery
                            </h5>
                            <p className="text-muted mb-3">
                                Each event has its own gallery with tracks. Select an event below to upload, view, or delete images per track.
                            </p>
                            <Table striped hover responsive>
                                <thead>
                                    <tr>
                                        <th>Event</th>
                                        <th>Start Date</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {events.length === 0 ? (
                                        <tr>
                                            <td colSpan={3} className="text-center text-muted py-4">
                                                No events found.
                                            </td>
                                        </tr>
                                    ) : (
                                        events.map((ev) => {
                                            const imgSrc = ev.images?.[0]
                                                ? `${API_URL}/${ev.images[0]}`
                                                : DUMMY_PATH;
                                            const startDate = ev.startDate
                                                ? new Date(ev.startDate).toLocaleDateString('en-GB', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    year: 'numeric'
                                                  })
                                                : '—';
                                            return (
                                                <tr key={ev.id}>
                                                    <td>
                                                        <div className="d-flex align-items-center">
                                                            <img
                                                                src={imgSrc}
                                                                alt=""
                                                                style={{
                                                                    width: 48,
                                                                    height: 48,
                                                                    objectFit: 'cover',
                                                                    borderRadius: 6,
                                                                    marginRight: 12
                                                                }}
                                                                onError={(e) => {
                                                                    e.target.src = DUMMY_PATH;
                                                                }}
                                                            />
                                                            <span className="font-weight-medium">{ev.name || 'Unnamed Event'}</span>
                                                        </div>
                                                    </td>
                                                    <td>{startDate}</td>
                                                    <td>
                                                        <Button
                                                            variant="primary"
                                                            size="sm"
                                                            onClick={() => handleOpenGallery(ev.id)}
                                                        >
                                                            <i className="fas fa-images mr-1"></i>
                                                            Open Gallery
                                                        </Button>
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    )}
                                </tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default GalleryEventSelectPage;
