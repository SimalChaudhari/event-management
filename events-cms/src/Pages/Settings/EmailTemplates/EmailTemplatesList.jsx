import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Badge from 'react-bootstrap/Badge';
import { toast } from 'react-toastify';
import * as $ from 'jquery';
import axiosInstance from '../../../configs/axiosInstance';
import '../../../assets/css/event.css';
import DeleteConfirmationModal from '../../../components/modal/DeleteConfirmationModal';
import { SETTINGS_PATHS } from '../../../utils/constants';
import usePersistedTablePage from '../../../hooks/usePersistedTablePage';
import useTableNavigation from '../../../hooks/useTableNavigation';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function emailTemplatesTable(data, handleAddTemplate, handleEdit, handleDelete, handleView, restoreTablePage) {
    const tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    const validData = Array.isArray(data) ? data.filter((item) => item && item.id) : [];

    const getTypeBadgeVariant = (type) => {
        const variants = {
            welcome: 'success',
            'password-reset': 'warning',
            'event-registration': 'info',
            'event-reminder': 'primary',
            notification: 'secondary',
            custom: 'dark'
        };
        return variants[type] || 'dark';
    };

    const formatType = (type) => {
        return type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    };

    const dataTableInstance = $(tableZero).DataTable({
        data: validData,
        rowId: 'id',
        order: [[0, 'asc']],
        searching: true,
        searchDelay: 500,
        pageLength: 5,
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ],
        pagingType: 'full_numbers',
        dom:
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-template-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'name',
                title: 'Template Name',
                render: function (data, type, row) {
                    const maxLength = 100;
                    let subject = row.subject || 'No subject';
                    if (subject.length > maxLength) {
                        subject = subject.substring(0, maxLength) + '...';
                    }
                    return `
                        <div class="d-inline-block align-middle">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.name || 'N/A'}</h6>
                                <p class="text-muted m-b-0">${subject}</p>
                            </div>
                        </div>   
                    `;
                }
            },
            {
                data: 'type',
                title: 'Type',
                render: function (data, type, row) {
                    const variant = getTypeBadgeVariant(row.type);
                    const formattedType = formatType(row.type);
                    return `<span class="badge badge-${variant}">${formattedType}</span>`;
                }
            },
            {
                data: 'isActive',
                title: 'Status',
                render: function (data, type, row) {
                    const status = row.isActive ? 'Active' : 'Inactive';
                    const variant = row.isActive ? 'success' : 'secondary';
                    return `<span class="badge badge-${variant}">${status}</span>`;
                }
            },
            {
                data: 'createdAt',
                title: 'Created Date',
                render: function (data, type, row) {
                    if (!row.createdAt) return 'N/A';
                    const date = new Date(row.createdAt);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                    return `<span class="badge badge-light">${formattedDate}</span>`;
                }
            },
            {
                data: 'updatedAt',
                title: 'Last Updated',
                render: function (data, type, row) {
                    if (!row.updatedAt) return 'N/A';
                    const date = new Date(row.updatedAt);
                    const formattedDate = date.toLocaleDateString('en-GB', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                    return `<span class="badge badge-light">${formattedDate}</span>`;
                }
            },
            {
                data: null,
                title: 'Actions',
                orderable: false,
                render: function (data, type, row) {
                    return `
                        <div class="btn-group" role="group" aria-label="Actions">
                            <button type="button" class="btn btn-icon btn-success view-btn" data-id="${row.id}" title="View" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-eye"></i>
                            </button>
                            <button type="button" class="btn btn-warning btn-circle btn-sm edit-btn" data-id="${row.id}" title="Edit" 
                                style="margin-right: 10px; width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-edit"></i>
                            </button>
                            <button type="button" class="btn btn-danger btn-circle btn-sm delete-btn" data-id="${row.id}" title="Delete" 
                                style="width: 40px; height: 40px; border-radius: 50%; display: inline-flex; justify-content: center; align-items: center;">
                                <i class="feather icon-trash-2"></i>
                            </button>
                        </div>
                    `;
                }
            }
        ],
        initComplete: function () {
            if (typeof restoreTablePage === 'function') {
                const api = this.api();
                restoreTablePage(api);
            }

            if (!$('#addTemplateBtn').length) {
                $('.add-template-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addTemplateBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add
                    </button>
                `);

                $('#addTemplateBtn').on('click', handleAddTemplate);
            }
        },
        responsive: true
    });

    const tableSelector = `${tableZero} tbody`;
    $(tableSelector).off('click', '.view-btn').on('click', '.view-btn', function () {
        const table = $(tableZero).DataTable();
        const rowData = table.row($(this).closest('tr')).data();
        if (rowData && rowData.id) {
            handleView(rowData);
        }
    });

    $(tableSelector).off('click', '.edit-btn').on('click', '.edit-btn', function () {
        const table = $(tableZero).DataTable();
        const rowData = table.row($(this).closest('tr')).data();
        if (rowData && rowData.id) {
            handleEdit(rowData);
        }
    });

    $(tableSelector).off('click', '.delete-btn').on('click', '.delete-btn', function () {
        const templateId = $(this).data('id');
        if (templateId) {
            handleDelete(templateId);
        }
    });

    return dataTableInstance;
}

const EmailTemplatesList = () => {
    const [templates, setTemplates] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentTable, setCurrentTable] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const tableRef = React.useRef(null);
    const { restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();

    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: SETTINGS_PATHS.EMAIL_TEMPLATES,
        viewPath: SETTINGS_PATHS.VIEW_EMAIL_TEMPLATE,
        editPath: SETTINGS_PATHS.EDIT_EMAIL_TEMPLATE,
        addPath: SETTINGS_PATHS.ADD_EMAIL_TEMPLATE
    });

    const fetchTemplates = async () => {
        setLoading(true);
        try {
            const response = await axiosInstance.get('/email-templates');
            if (response.data.success) {
                setTemplates(response.data.data);
            }
        } catch (error) {
            toast.error('Failed to fetch email templates');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const destroyTable = () => {
        if (currentTable) {
            currentTable.off('page.dt');
            const tableSelector = '#data-table-zero tbody';
            $(tableSelector).off('click', '.view-btn');
            $(tableSelector).off('click', '.edit-btn');
            $(tableSelector).off('click', '.delete-btn');
            currentTable.destroy();
            setCurrentTable(null);
            tableRef.current = null;
        }
    };

    const initializeTable = () => {
        destroyTable();
        if (Array.isArray(templates)) {
            const table = emailTemplatesTable(
                templates,
                handleAddTemplate,
                handleEditTemplate,
                handleDeleteTemplate,
                handleViewTemplate,
                restoreTablePage
            );
            setCurrentTable(table);
            tableRef.current = table;
            if (table && typeof checkAndAdjustPage === 'function') {
                checkAndAdjustPage(table);
            }
        }
    };

    useEffect(() => {
        fetchTemplates();
        return () => destroyTable();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [templates]);

    // Template gallery code moved to ChooseTemplatePage

    const handleAddTemplate = () => {
        handleAdd();
    };

    const handleEditTemplate = (data) => {
        handleEdit(data);
    };

    const handleViewTemplate = (data) => {
        handleView(data);
    };

    const handleDeleteTemplate = (templateId) => {
        setItemToDelete({ id: templateId });
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!itemToDelete) return;

        setIsDeleting(true);
        try {
            const response = await axiosInstance.delete(`/email-templates/delete/${itemToDelete.id}`);
            if (response.data.success) {
                toast.success('Email template deleted successfully');
                setShowDeleteModal(false);
                setItemToDelete(null);
                fetchTemplates();
            }
        } catch (error) {
            toast.error('Failed to delete email template');
            console.error(error);
        } finally {
            setIsDeleting(false);
        }
    };

    const handleClose = () => {
        if (!isDeleting) {
            setShowDeleteModal(false);
            setItemToDelete(null);
        }
    };

    return (
        <>
            <DeleteConfirmationModal 
                show={showDeleteModal} 
                onHide={handleClose} 
                onConfirm={handleConfirmDelete} 
                isLoading={isDeleting}
                title="Delete Email Template"
                message={`Are you sure you want to delete this email template? This action cannot be undone.`}
            />


            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="event-list">
                        <Card.Body>
                            <Table striped hover responsive id="data-table-zero">
                                <thead>
                                    <tr>
                                        <th>Template Name</th>
                                        <th>Type</th>
                                        <th>Status</th>
                                        <th>Created Date</th>
                                        <th>Last Updated</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default EmailTemplatesList;

