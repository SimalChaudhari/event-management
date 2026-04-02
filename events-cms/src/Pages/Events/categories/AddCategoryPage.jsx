import React, { useState, useEffect } from 'react';
import { Button, Row, Col, Container } from 'react-bootstrap';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { createCategory, updateCategory, categoryById, categoryList } from '../../../store/actions/categoryActions';
import { EVENT_PATHS } from '../../../utils/constants';
import useTableNavigation from '../../../hooks/useTableNavigation';
import useCalculateTargetPage from '../../../hooks/useCalculateTargetPage';

const AddCategoryPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    const { id } = useParams(); // Edit mode 

    const [formData, setFormData] = useState({
        name: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const previousPageRef = React.useRef(null);
    const originalCategoryNameRef = React.useRef('');

    const { handleBack: handleBackNavigation } = useTableNavigation({
        tableRef: null,
        listPath: EVENT_PATHS.CATEGORIES,
        viewPath: EVENT_PATHS.VIEW_CATEGORY,
        editPath: EVENT_PATHS.EDIT_CATEGORY,
        addPath: EVENT_PATHS.ADD_CATEGORY
    });

    const { calculateTargetPage } = useCalculateTargetPage({
        listAction: categoryList,
        reduxSelector: 'category.categories',
        pageLength: 5,
        sortType: 'string',
        sortDirection: 'asc',
        sortFields: ['name']
    });

    useEffect(() => {
        const params = new URLSearchParams(location.search || window.location.search);
        const pageParam = params.get('page');
        if (pageParam) {
            previousPageRef.current = parseInt(pageParam, 10);
        } else if (location.state?.page) {
            previousPageRef.current = location.state.page;
        }
    }, [location.search, location.state, id]);

    // Load edit data if id exists
    useEffect(() => {
        if (id) {
            const loadCategoryData = async () => {
                    const response = await dispatch(categoryById(id));
                    if (response?.data) {
                        const editData = response.data;
                        setFormData({
                            name: editData.name || '',
                            description: editData.description || ''
                        });
                        originalCategoryNameRef.current = editData.name || '';
                    }
            };
            loadCategoryData();
        }
    }, [id, dispatch]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const getReturnPage = () => {
                const params = new URLSearchParams(location.search || window.location.search);
                return params.get('page') || location.state?.page || previousPageRef.current;
            };

            if (id) {
                const response = await dispatch(updateCategory(id, formData));
                if (response?.success) {
                    const originalName = (originalCategoryNameRef.current || '').trim();
                    const updatedName = formData.name.trim();
                    const updatedCategoryId =
                        response?.category?.id ? String(response.category.id) : String(id);

                    if (originalName && originalName !== updatedName) {
                        const pageNumber = await calculateTargetPage({
                            newItemData: { name: updatedName },
                            entityId: updatedCategoryId,
                            shouldRefreshList: !response?.category?.id
                        });
                        navigate(`${EVENT_PATHS.CATEGORIES}?page=${pageNumber}`);
                    } else {
                        const targetPage = getReturnPage();
                        if (targetPage) {
                            navigate(`${EVENT_PATHS.CATEGORIES}?page=${targetPage}`);
                        } else {
                            navigate(EVENT_PATHS.CATEGORIES);
                        }
                    }
                }
            } else {
                const response = await dispatch(createCategory(formData));
                if (response?.success) {
                    const newName = formData.name.trim();
                    const createdCategoryId = response?.category?.id
                        ? String(response.category.id)
                        : null;

                    setFormData({
                        name: '',
                        description: ''
                    });

                    const pageNumber = await calculateTargetPage({
                        newItemData: { name: newName },
                        entityId: createdCategoryId,
                        shouldRefreshList: !createdCategoryId
                    });
                    navigate(`${EVENT_PATHS.CATEGORIES}?page=${pageNumber}`);
                }
            }
        } catch (error) {
            //error handling
        } finally {
            setLoading(false);
        }
    };

    const getCurrentPage = () => {
        const params = new URLSearchParams(location.search || window.location.search);
        return params.get('page') || location.state?.page || previousPageRef.current;
    };

    const handleCancel = () => {
        const targetPage = getCurrentPage();
        handleBackNavigation(targetPage);
    };

    return (
        <Container fluid>
            <div className="row">
                <div className="col-12">
                    <div className="card">
                        <div className="card-header">
                            <div className="d-flex justify-content-between align-items-center">
                                <h4 className="card-title">{id ? 'Edit Category' : 'Add Category'}</h4>
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
                                        <div className="form-group fill">
                                        <label className="floating-label" htmlFor="name">
                                                Name <span style={{ color: 'red' }}>*</span>
                                            </label>
                                            <input
                                                type="text"
                                                className="form-control"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                placeholder="Enter category name"
                                                required
                                            />
                                        </div>
                                    </Col>

                                    <Col sm={12}>
                                        <div className="form-group fill">
                                            <label className="floating-label" htmlFor="description">
                                                Description
                                            </label>
                                            <textarea
                                                className="form-control"
                                                name="description"
                                                value={formData.description}
                                                onChange={handleInputChange}
                                                placeholder="Enter category description (optional)"
                                                rows={4}
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
                                            <Button variant="primary" type="submit" disabled={loading || !formData.name.trim()}>
                                                {loading
                                                    ? id
                                                        ? 'Updating...'
                                                        : 'Creating...'
                                                    : id
                                                    ? 'Update'
                                                    : 'Create'}
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

export default AddCategoryPage;
