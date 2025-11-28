import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector } from 'react-redux';
import * as $ from 'jquery';
import { API_URL, DUMMY_PATH_USER } from '../../configs/env';
import { FetchUsers } from './fetchApi/FetchApi';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import ExportConfirmationModal from '../../components/modal/ExportConfirmationModal';
import CsvUploadModal from '../../components/modals/CsvUploadModal';
import { useNavigate, useLocation } from 'react-router-dom';
import { USER_PATHS } from '../../utils/constants';
import UserFilterComponent from '../../components/common/UserFilterComponent';
import { formatPhoneDisplay } from '../../utils/phoneFormatter';
import usePersistedTablePage from '../../hooks/usePersistedTablePage';
import useTableNavigation from '../../hooks/useTableNavigation';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function userTable(
    data,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    handleViewUser,
    handleExportUsers,
    restoreTablePage
) {
    let tableZero = '#user-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Ensure data is valid and has proper structure
    const validData = Array.isArray(data) ? data.filter(item => item && item.id) : [];

    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    const dataTableInstance = $(tableZero).DataTable({
        data: validData,
        rowId: 'id', // Explicitly set the row ID field
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
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-user-button ml-1'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'firstName',
                title: 'User Details',
                type: 'string',
                render: function (data, type, row) {
                    const imageUrl = row.profilePicture 
                        ? `${API_URL}/${row.profilePicture}` 
                        : DUMMY_PATH_USER;
                    
                    let badgeClass = 'badge-light-success';
                    let statusText = 'Active';
                    
                    // You can add user status logic here if needed
                    // if (!row.isActive) {
                    //     badgeClass = 'badge-light-danger';
                    //     statusText = 'Inactive';
                    // }

                    // For sorting, return combined firstName + lastName
                    if (type === 'sort' || type === 'type') {
                        const firstName = (row.firstName || '').trim().toLowerCase();
                        const lastName = (row.lastName || '').trim().toLowerCase();
                        return `${firstName} ${lastName}`;
                    }

                    return `
                        <div class="d-inline-block align-middle">
                            <img src="${imageUrl}" alt="user" class="img-radius align-top m-r-15" 
                                 style="width:50px; height:50px; object-fit:cover;" 
                                 onerror="this.src='${DUMMY_PATH_USER}';">
                            <div class="d-inline-block">
                                <h6 class="m-b-0">${row.firstName || ''} ${row.lastName || ''}</h6>
                                <p class="m-b-5 text-muted">${row.email || 'N/A'}</p>
                                <span class="badge ${badgeClass}">
                                    ${statusText}
                                </span>
                            </div>
                        </div>   
                    `;
                }
            },
            {
                data: 'role',
                title: 'Role',
                render: function (data, type, row) {
                    const role = row.role || 'user';
                    let badgeClass = 'badge-light-primary';
                    let roleText = role.charAt(0).toUpperCase() + role.slice(1);
                    let iconClass = 'feather icon-user';
                    
                    // Set different colors and icons based on role
                    if (role === 'exhibitor') {
                        badgeClass = 'badge-light-warning';
                        iconClass = 'feather icon-briefcase';
                    } else if (role === 'speaker') {
                        badgeClass = 'badge-light-info';
                        iconClass = 'feather icon-mic';
                    } else if (role === 'admin') {
                        badgeClass = 'badge-light-danger';
                        iconClass = 'feather icon-shield';
                    } else if (role === 'moderator') {
                        badgeClass = 'badge-light-success';
                        iconClass = 'feather icon-users';
                    }
                    
                    return `
                        <div class="d-inline-block align-middle">
                            <span class="badge ${badgeClass}">
                                <i class="${iconClass} mr-1"></i>
                                ${roleText}
                            </span>
                        </div>
                    `;
                }
            },
            {
                data: 'mobile',
                title: 'Mobile',
                render: function (data, type, row) {
                    const formattedPhone = row.mobile ? formatPhoneDisplay(row.mobile) : 'N/A';
                    return `
                        <div class="d-inline-block align-middle">
                              <p class="m-b-0">
                                <span class="badge badge-success">
                                    <i class="feather icon-phone mr-1"></i>
                                    ${formattedPhone}
                                </span>
                            </p>
                        </div>
                    `;
                }
            },
            {
                data: 'address',
                title: 'Address',
                render: function (data, type, row) {
                    return `
                        <div class="d-inline-block align-middle">
                            <p class="m-b-0">
                                <span class="badge badge-light-primary">
                                    <i class="feather icon-map-pin mr-1"></i>
                                    ${row.formattedAddress || 'Not specified'}
                                </span>
                            </p>
                        </div>
                    `;
                }
            },
            {
                data: 'updatedAt',
                title: 'Last Updated',
                render: function (data, type, row) {
                    if (data) {
                        const date = new Date(data);
                        return date.toLocaleDateString('en-IN') + ' ' + date.toLocaleTimeString('en-IN');
                    }
                    return 'N/A';
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
        initComplete: function (settings, json) {
            if (typeof restoreTablePage === 'function') {
                const api = this.api();
                restoreTablePage(api);
            }
            if (!$('#addUserBtn').length) {
                $('.add-user-button').html(`
                    <button class="btn btn-primary d-flex align-items-center ml-2" id="addUserBtn">
                        <i class="feather icon-plus mr-1"></i>
                        Add
                    </button>
                `);

                $('#addUserBtn').on('click', handleAddUser);
            }




            // Add event listeners for action buttons
            $(tableZero + ' tbody').off('click', '.view-btn').on('click', '.view-btn', function () {
                // Get the row data directly from DataTables (more reliable than data-id attribute)
                const table = $(tableZero).DataTable();
                const rowData = table.row($(this).closest('tr')).data();
                if (rowData && rowData.id) {
                    handleViewUser(rowData);
                } else {
                    // Fallback to data-id if row data not available
                    const id = $(this).data('id');
                    const userData = validData.find((user) => user && String(user.id) === String(id));
                    if (userData) {
                        handleViewUser(userData);
                    } else {
                        console.error('User data not found for ID:', id);
                    }
                }
            });

            $(tableZero + ' tbody').off('click', '.edit-btn').on('click', '.edit-btn', function () {
                // Get the row data directly from DataTables (more reliable than data-id attribute)
                const table = $(tableZero).DataTable();
                const row = $(this).closest('tr');
                const rowData = table.row(row).data();
                
                // Verify we got valid data
                if (rowData && rowData.id) {
                    // Double-check: verify this user exists in validData
                    const foundUser = validData.find((user) => user && String(user.id) === String(rowData.id));
                    if (foundUser) {
                        console.log('Editing user:', foundUser.firstName, foundUser.lastName, 'ID:', foundUser.id);
                        handleEditUser(foundUser); // Use foundUser from validData to ensure consistency
                    } else {
                        console.error('User from row data not found in validData. Row ID:', rowData.id, 'Row data:', rowData);
                        // Fallback to rowData if not found (shouldn't happen)
                        handleEditUser(rowData);
                    }
                } else {
                    // Fallback to data-id if row data not available
                    const id = $(this).data('id');
                    console.warn('Row data not available, using data-id:', id);
                    const userData = validData.find((user) => user && String(user.id) === String(id));
                    if (userData) {
                        handleEditUser(userData);
                    } else {
                        console.error('User data not found for ID:', id);
                    }
                }
            });

            $(tableZero + ' tbody').off('click', '.delete-btn').on('click', '.delete-btn', function () {
                const id = $(this).data('id');
                if (id) {
                    handleDeleteUser(id);
                } else {
                    console.error('No user ID found for delete action');
                }
            });
        },
        responsive: true,
        language: {
            search: 'Search Users:',
            lengthMenu: 'Show _MENU_ users per page',
            info: 'Showing _START_ to _END_ of _TOTAL_ users',
            infoEmpty: 'No users found',
            infoFiltered: '(filtered from _MAX_ total users)',
            zeroRecords: 'No matching users found'
        }
    });

    return dataTableInstance;
}

const UserList = () => {
    const { fetchData, deleteUserData, uploadCsvData, downloadCsvSample, exportUsersData } = FetchUsers();
    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const location = useLocation();
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);
    const [showCsvUploadModal, setShowCsvUploadModal] = useState(false);
    const [showExportConfirmModal, setShowExportConfirmModal] = useState(false);
    const [userIdToDelete, setUserIdToDelete] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [isExporting, setIsExporting] = React.useState(false);
    const [currentTable, setCurrentTable] = useState(null);
    const [roleFilter, setRoleFilter] = useState('all');
    const tableRef = React.useRef(null);

    const { restoreTablePage, checkAndAdjustPage } = usePersistedTablePage();
    
    // Use reusable table navigation hook for page preservation
    const { handleView, handleEdit, handleAdd } = useTableNavigation({
        tableRef,
        listPath: USER_PATHS.LIST_USERS,
        viewPath: USER_PATHS.VIEW_USER,
        editPath: USER_PATHS.EDIT_USER,
        addPath: USER_PATHS.ADD_USER
    });

    const handleViewUser = (userData) => {
        // Get current page from DataTable or URL
        let currentPage = null;
        if (tableRef.current) {
            try {
                const pageInfo = tableRef.current.page.info();
                if (pageInfo && pageInfo.page !== undefined) {
                    currentPage = (pageInfo.page + 1).toString();
                }
            } catch (e) {
                // Fallback to URL
                const urlParams = new URLSearchParams(location.search);
                currentPage = urlParams.get('page');
            }
        } else {
            const urlParams = new URLSearchParams(location.search);
            currentPage = urlParams.get('page');
        }
        handleView(userData, currentPage);
    };

    const handleAddUser = () => {
        handleAdd();
    };

    const handleEditUser = (userData) => {
        handleEdit(userData);
    };

    const handleDeleteUser = (userId) => {
        setUserIdToDelete(userId);
        setShowConfirmModal(true);
    };

    const confirmDeleteUser = async () => {
        setIsLoading(true);
        if (userIdToDelete) {
            try {
                await deleteUserData(userIdToDelete);
                setShowConfirmModal(false);
                // deleteUserData already updates Redux directly, no need to fetch again
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
        setIsLoading(false);
    };

    const handleRoleFilterChange = async (newFilter) => {
        setRoleFilter(newFilter);
        // Fetch data with new filter
        await fetchData(newFilter === 'all' ? null : newFilter);
    };

    const handleClearFilters = async () => {
        setRoleFilter('all');
        await fetchData(null);
    };

    const handleCsvUpload = () => {
        setShowCsvUploadModal(true);
    };

    const handleCsvUploadSuccess = async () => {
        setShowCsvUploadModal(false);
        // CSV upload adds multiple users, so we need to fetch the updated list
        // (unlike single create/update/delete which update Redux directly)
        await fetchData(roleFilter === 'all' ? null : roleFilter);
    };

    const handleExportUsers = () => {
        setShowExportConfirmModal(true);
    };

    const confirmExportUsers = async () => {
        setIsExporting(true);
        try {
            await exportUsersData();
            setShowExportConfirmModal(false);
        } catch (error) {
            console.error('Error exporting users:', error);
        } finally {
            setIsExporting(false);
        }
    };

    // Define filter options for the reusable component
    const roleFilterOptions = [
        { value: 'user', label: 'Users Only' },
        { value: 'exhibitor', label: 'Exhibitors Only' }
    ];

    const destroyTable = () => {
        if (currentTable) {
            currentTable.off('page.dt');
            const tableSelector = '#user-data-table';
            const tableBodySelector = `${tableSelector} tbody`;
            $(tableBodySelector).off('click', '.view-btn');
            $(tableBodySelector).off('click', '.edit-btn');
            $(tableBodySelector).off('click', '.delete-btn');
            currentTable.destroy();
            setCurrentTable(null);
            tableRef.current = null;
        }
    };

    const initializeTable = () => {
        destroyTable();
        // Check if user data exists and is an array
        if (Array.isArray(user)) {
            try {
                const table = userTable(
                    user,
                    handleAddUser,
                    handleEditUser,
                    handleDeleteUser,
                    handleViewUser,
                    handleExportUsers,
                    restoreTablePage
                );
                tableRef.current = table;
                setCurrentTable(table);
                // Check and adjust page if current page is now empty (after deletion)
                if (table && typeof checkAndAdjustPage === 'function') {
                    checkAndAdjustPage(table);
                }
            } catch (error) {
                console.error('Error initializing user table:', error);
              
            }
        } else {
            console.log('User data is not an array or is undefined:', user);
        }
    };

    useEffect(() => {
        // Only fetch if users are not already loaded in Redux
        // This prevents unnecessary API calls when navigating back after create/update/delete
        // Since create/update/delete already update Redux, we don't need to fetch again
        if (!user || user.length === 0) {
            fetchData(roleFilter === 'all' ? null : roleFilter);
        }
        return () => destroyTable();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        initializeTable();
        return () => destroyTable();
    }, [user]);


    return (
        <>
            <DeleteConfirmationModal
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                onConfirm={confirmDeleteUser}
                isLoading={isLoading}
                title="Delete User"
                message="Are you sure you want to delete this user? This action cannot be undone."
            />

            <ExportConfirmationModal
                show={showExportConfirmModal}
                onHide={() => setShowExportConfirmModal(false)}
                onConfirm={confirmExportUsers}
                isLoading={isExporting}
            />

            <CsvUploadModal
                show={showCsvUploadModal}
                onHide={() => setShowCsvUploadModal(false)}
                onUploadSuccess={handleCsvUploadSuccess}
            />
            
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="user-list"> 
                        <Card.Body>
                            {/* Filter Component with Action Buttons */}
                            <UserFilterComponent
                                filterOptions={roleFilterOptions}
                                selectedFilter={roleFilter}
                                onFilterChange={handleRoleFilterChange}
                                filterLabel="Filter by Role"
                                filterIcon="users"
                                title="Filter Options"
                                loading={false}
                                activeFilters={{}}
                                onClearFilters={handleClearFilters}
                                allOptionLabel="All Users & Exhibitors"
                                allOptionValue="all"
                                actionButtons={
                                    <>
                                        <button 
                                            className="btn btn-success d-flex align-items-center" 
                                            id="csvUploadBtn"
                                            onClick={handleCsvUpload}
                                        >
                                            <i className="feather icon-upload mr-1"></i>
                                            CSV Upload
                                        </button>
                                        <button 
                                            className="btn btn-info d-flex align-items-center" 
                                            id="exportUsersBtn"
                                            onClick={handleExportUsers}
                                        >
                                            <i className="feather icon-download mr-1"></i>
                                            Export Users
                                        </button>
                                    </>
                                }
                            />
                            
                            <Table striped hover responsive id="user-data-table">
                                <thead>
                                    <tr>
                                        <th>User Details</th>
                                        <th>Role</th>
                                        <th>Contact & Location</th>
                                        <th>Address</th>
                                        <th>Last Updated</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody></tbody>
                            </Table>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </>
    );
};

export default UserList;
