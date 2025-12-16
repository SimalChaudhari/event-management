import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector, useDispatch } from 'react-redux';
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
import { initializeServerSideDataTable } from '../../utils/dataTableServerSide';
import axiosInstance from '../../configs/axiosInstance';
import { USER_LOADING } from '../../store/constants/actionTypes';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function userTable(
    roleFilter,
    handleAddUser,
    handleEditUser,
    handleDeleteUser,
    handleViewUser,
    handleExportUsers,
    restoreTablePage, dispatch = null
) {
    let tableZero = '#user-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().destroy();
    }

    // Define columns
    const columns = [
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
    ];

    // Initialize server-side DataTable
    const dataTableInstance = initializeServerSideDataTable({
        tableSelector: tableZero,
        ajaxUrl: '/users',
        ajaxMethod: 'GET',
        columns: columns,
        ajaxParams: {
            role: roleFilter && roleFilter !== 'all' ? roleFilter : undefined
        },
        axiosInstance: axiosInstance,
        dispatch: dispatch, // Pass dispatch for loading state
        loadingActionType: USER_LOADING, // Use USER_LOADING to show GlobalLoader
        onDataLoaded: (data, metadata) => {
            // Optional: Store data in Redux or handle it
        },
        restoreTablePage: restoreTablePage,
        initCompleteCallback: function (settings, json, api) {
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
                const table = $(tableZero).DataTable();
                const rowData = table.row($(this).closest('tr')).data();
                if (rowData && rowData.id) {
                    handleViewUser(rowData);
                } else {
                    const id = $(this).data('id');
                    if (id) {
                        handleViewUser({ id });
                    }
                }
            });

            $(tableZero + ' tbody').off('click', '.edit-btn').on('click', '.edit-btn', function () {
                const table = $(tableZero).DataTable();
                const rowData = table.row($(this).closest('tr')).data();
                if (rowData && rowData.id) {
                    handleEditUser(rowData);
                } else {
                    const id = $(this).data('id');
                    if (id) {
                        handleEditUser({ id });
                    }
                }
            });

            $(tableZero + ' tbody').off('click', '.delete-btn').on('click', '.delete-btn', function () {
                const id = $(this).data('id');
                if (id) {
                    handleDeleteUser(id);
                }
            });
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
                // Error deleting user
            }
        }
        setIsLoading(false);
    };

    const handleRoleFilterChange = async (newFilter) => {
        // Update state first
        setRoleFilter(newFilter);
        
        // Immediately reinitialize table with new filter value (don't wait for state)
        // This ensures the filter is applied right away
        initializeTable(newFilter);
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
            // Error exporting users
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

    const initializeTable = (filterValue = null) => {
        // Use provided filterValue or current roleFilter state
        const currentFilter = filterValue !== null ? filterValue : roleFilter;
        
        destroyTable();
        try {
            const table = userTable(
                currentFilter,
                handleAddUser,
                handleEditUser,
                handleDeleteUser,
                handleViewUser,
                handleExportUsers,
                restoreTablePage,
            );
            tableRef.current = table;
            setCurrentTable(table);
        } catch (error) {
            // Error initializing user table
        }
    };

    useEffect(() => {
        // Only initialize on mount, filter changes are handled by handleRoleFilterChange
        if (!tableRef.current) {
            initializeTable();
        }
        return () => destroyTable();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); // Empty dependency array - only run on mount


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
