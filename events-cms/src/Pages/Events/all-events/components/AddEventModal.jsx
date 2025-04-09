import React, { useState, useEffect } from 'react';
import { Modal, Button, Row, Col } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { FetchEventData } from '../fetchEvents/FetchEventApi';
import { createEvent, editEvent } from '../../../../store/actions/eventActions';
import { API_URL } from '../../../../configs/env';

function AddEventModal({ show, handleClose, editData }) {

  const dispatch = useDispatch();

  const { fetchEvent } = FetchEventData(); // Destructure fetchData from the custom hook

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    location: '',
    image: null,
    type: 'Physical',
    price: '',
    currency: '',
  });

  useEffect(() => {
    if (editData) {
      setFormData({
        name: editData.name || '',
        description: editData.description || '',
        startDate: editData.startDate || '',
        startTime: editData.startTime || '',
        endDate: editData.endDate || '',
        endTime: editData.endTime || '',
        location: editData.location || '',
        type: editData.type || 'Physical',
        price: editData.price || '',
        currency: editData.currency || '',
        image: editData.image ? `${API_URL}/${editData.image.replace(/\\/g, '/')}` : null
    
      });
    } else {
      setFormData({
        name: '',
        description: '',
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        location: '',
        image: null,
        type: 'Physical',
        price: '',
        currency: '',
      });
    }
  }, [editData, show]);

  const handleChange = (e) => {
    const { name, value, type, files } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'file' ? files[0] : value,
    }));
  };

  const handleSubmit = async(e) => {
    e.preventDefault();
    const formDataToSend = new FormData();

    // Format the time fields before appending them to formDataToSend
    const formattedStartTime = formatTime(formData.startTime);
    const formattedEndTime = formatTime(formData.endTime);

    const dataToSend = {
        ...formData,
        startTime: formattedStartTime,
        endTime: formattedEndTime,
    };

    Object.keys(dataToSend).forEach((key) => {
        if (dataToSend[key] !== null) {
          formDataToSend.append(key, dataToSend[key]);
        }
    });

    try {
        let success;
        if (editData) {
            success = await dispatch(editEvent(editData.id, formDataToSend));
        } else {
            success = await dispatch(createEvent(formDataToSend));
        }

        if (success) {
          fetchEvent();
            handleClose();
        }
    } catch (error) {
        console.error('Error submitting form:', error);
    }
  };

  const formatTime = (time) => {
    if (!time) return '';
    let [hours, minutes] = time.split(':');
    hours = parseInt(hours, 10);

    // Check if the time includes AM/PM and adjust accordingly
    if (time.toLowerCase().includes('pm') && hours < 12) {
        hours += 12;
    } else if (time.toLowerCase().includes('am') && hours === 12) {
        hours = 0;
    }

    // Ensure two-digit format for hours and minutes
    hours = hours.toString().padStart(2, '0');
    minutes = minutes.replace(/[^0-9]/g, '').padStart(2, '0');

    return `${hours}:${minutes}`;
};

  return (
    <Modal show={show} onHide={handleClose} size="lg">
      <form onSubmit={handleSubmit}>
        <Modal.Header>
          <Modal.Title as="h5">{editData ? 'Edit Event' : 'Add Event'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Row>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="name">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Event Name"
                  required
                />
              </div>
            </Col>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="description">
                  Description
                </label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Event Description"
                  rows={3}
                />
              </div>
            </Col>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="startDate">
                  Start Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </Col>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="startTime">
                  Start Time
                </label>
                <input
                  type="time"
                  className="form-control"
                  name="startTime"
                  value={formData.startTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </Col>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="endDate">
                  End Date
                </label>
                <input
                  type="date"
                  className="form-control"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  required
                />
              </div>
            </Col>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="endTime">
                  End Time
                </label>
                <input
                  type="time"
                  className="form-control"
                  name="endTime"
                  value={formData.endTime}
                  onChange={handleChange}
                  required
                />
              </div>
            </Col>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="location">
                  Location
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Event Location"
                />
              </div>
            </Col>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="image">
                  Image
                </label>
                <input
                  type="file"
                  className="form-control"
                  name="image"
                  onChange={handleChange}
                  accept="image/*"
                />
                {formData.image && (
                  <img
                    src={
                      typeof formData.image === 'string'
                        ? formData.image
                        : URL.createObjectURL(formData.image)
                    }
                    alt="Event"
                    style={{ width: '100px', height: '100px', marginTop: '10px' }}
                  />
                )}
              </div>
            </Col>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="type">
                  Type
                </label>
                <select
                  className="form-control"
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="Physical">Physical</option>
                  <option value="Virtual">Virtual</option>
                </select>
              </div>
            </Col>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="price">
                  Price
                </label>
                <input
                  type="number"
                  className="form-control"
                  name="price"
                  value={formData.price}
                  onChange={handleChange}
                  placeholder="Event Price"
                />
              </div>
            </Col>
            <Col sm={6}>
              <div className="form-group fill">
                <label className="floating-label" htmlFor="currency">
                  Currency
                </label>
                <input
                  type="text"
                  className="form-control"
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  placeholder="Currency"
                />
              </div>
            </Col>
          </Row>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="danger" onClick={handleClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit">
            {editData ? 'Update' : 'Submit'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

export default AddEventModal;