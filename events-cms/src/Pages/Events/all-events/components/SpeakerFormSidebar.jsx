import React from 'react';
import { Button, Col, Row } from 'react-bootstrap';
import SingaporePhoneInput from '../../../../components/SingaporePhoneInput';
import SettingsEditor from '../../../../App/components/CkEditor/SettingsEditor';
import FormRightSidebar from '../../../../components/common/FormRightSidebar';

const SpeakerFormModal = ({ show, onClose, onChange, onSubmit, formData, isLoading = false }) => {
    const handleSave = (e) => {
        e.preventDefault();
        e.stopPropagation();
        onSubmit(e);
    };

    const footer = (
        <>
            <Button type="button" variant="danger" onClick={onClose}>
                Cancel
            </Button>
            <Button
                variant="primary"
                type="button"
                onClick={handleSave}
                disabled={
                    isLoading ||
                    !formData.firstName?.trim() ||
                    !formData.lastName?.trim() ||
                    !formData.email?.trim() ||
                    !formData.mobile?.trim() ||
                    !formData.position?.trim()
                }
            >
                {isLoading ? 'Saving...' : 'Save Speaker'}
            </Button>
        </>
    );

    return (
        <FormRightSidebar show={show} onHide={onClose} title="Add New Speaker" footer={footer} width={600}>
            <Row>
                <Col sm={6}>
                    <div className="form-group fill">
                        <label className="floating-label" htmlFor="firstName">
                            First Name <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            name="firstName"
                            value={formData.firstName}
                            onChange={onChange}
                            placeholder="Enter first name"
                            required
                        />
                    </div>
                </Col>
                <Col sm={6}>
                    <div className="form-group fill">
                        <label className="floating-label" htmlFor="lastName">
                            Last Name <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            name="lastName"
                            value={formData.lastName}
                            onChange={onChange}
                            placeholder="Enter last name"
                            required
                        />
                    </div>
                </Col>
                <Col sm={6}>
                    <div className="form-group fill">
                        <label className="floating-label" htmlFor="email">
                            Email <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                            type="email"
                            className="form-control"
                            name="email"
                            value={formData.email}
                            onChange={onChange}
                            placeholder="Enter email address"
                            required
                        />
                    </div>
                </Col>
                <Col sm={6}>
                    <div className="form-group fill">
                        <SingaporePhoneInput
                            name="mobile"
                            value={formData.mobile}
                            onChange={onChange}
                            label="Mobile"
                            required={true}
                        />
                    </div>
                </Col>
                <Col sm={6}>
                    <div className="form-group fill">
                        <label className="floating-label" htmlFor="position">
                            Position <span style={{ color: '#dc3545' }}>*</span>
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            name="position"
                            value={formData.position}
                            onChange={onChange}
                            placeholder="Enter position/designation"
                            required
                        />
                    </div>
                </Col>
                <Col sm={6}>
                    <div className="form-group fill">
                        <label className="floating-label" htmlFor="companyName">
                            Company Name
                        </label>
                        <input
                            type="text"
                            className="form-control"
                            name="companyName"
                            value={formData.companyName}
                            onChange={onChange}
                            placeholder="Enter company name"
                        />
                    </div>
                </Col>
                <Col sm={12}>
                    <div className="form-group" style={{ marginTop: '10px' }}>
                        <label
                            htmlFor="description"
                            style={{
                                display: 'block',
                                marginBottom: '10px',
                                fontSize: '0.875rem',
                                fontWeight: '500',
                                color: '#4680ff'
                            }}
                        >
                            Description
                        </label>
                        <hr style={{ margin: '10px 0 15px 0', borderTop: '1px solid #dee2e6' }} />
                        <SettingsEditor
                            data={formData.description || ''}
                            onChange={(event, editor) => {
                                onChange({
                                    target: {
                                        name: 'description',
                                        value: editor.getData()
                                    }
                                });
                            }}
                            placeholder="Enter speaker description"
                        />
                    </div>
                </Col>
                <Col sm={12}>
                    <div className="form-group fill">
                        <label className="floating-label" htmlFor="profilePicture">
                            Profile Image
                        </label>
                        <input
                            type="file"
                            className="form-control"
                            name="profilePicture"
                            onChange={onChange}
                            accept="image/*"
                        />
                        {formData.profilePicture && (
                            <div className="mt-3 text-start">
                                <img
                                    src={
                                        typeof formData.profilePicture === 'string'
                                            ? formData.profilePicture
                                            : URL.createObjectURL(formData.profilePicture)
                                    }
                                    alt="Speaker Profile Preview"
                                    style={{
                                        width: '120px',
                                        height: '120px',
                                        objectFit: 'cover',
                                        borderRadius: '10px',
                                        border: '2px solid #4680ff',
                                        marginTop: '10px'
                                    }}
                                />
                                <p className="text-muted mt-2" style={{ fontSize: '12px' }}>
                                    Image Preview
                                </p>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </FormRightSidebar>
    );
};

export default SpeakerFormModal;
