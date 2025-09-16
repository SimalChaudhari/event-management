import * as React from 'react';
import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import Form from 'react-bootstrap/Form';
import { useSelector } from 'react-redux';
import * as $ from 'jquery';
import { API_URL, DUMMY_PATH_USER } from '../../configs/env';
import { FetchUsers } from './fetchApi/FetchApi';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import { useNavigate } from 'react-router-dom';
import { USER_PATHS } from '../../utils/constants';
import UserFilterComponent from '../../components/common/UserFilterComponent';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function userTable(data, handleAddUser, handleEditUser, handleDeleteUser, handleViewUser) {
    let tableZero = '#user-data-table';
    $.fn.dataTable.ext.errMode = 'throw';

    // Ensure data is valid and has proper structure
    const validData = Array.isArray(data) ? data.filter(item => item && item.id) : [];

    // Preserve the current page
    let currentPage = 0;
    if ($.fn.DataTable.isDataTable(tableZero)) {
        currentPage = $(tableZero).DataTable().page();
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
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
            "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-user-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        columns: [
            {
                data: 'firstName',
                title: 'User Details',
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
                data: 'mobile',
                title: 'Mobile',
                render: function (data, type, row) {
                    return `
                        <div class="d-inline-block align-middle">
                              <p class="m-b-0">
                                <span class="badge badge-success">
                                    <i class="feather icon-phone mr-1"></i>
                                    ${row.mobile || 'N/A'}
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
                const id = $(this).data('id');
                const userData = validData.find((user) => user && user.id === id);
                if (userData) {
                    handleViewUser(userData);
                } else {
                    console.error('User data not found for ID:', id);
                }
            });

            $(tableZero + ' tbody').off('click', '.edit-btn').on('click', '.edit-btn', function () {
                const id = $(this).data('id');
                const userData = validData.find((user) => user && user.id === id);
                if (userData) {
                    handleEditUser(userData);
                } else {
                    console.error('User data not found for ID:', id);
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

    // Restore the current page
    $(tableZero).DataTable().page(currentPage).draw('page');
}

const UserList = () => {
    const { fetchData, deleteUserData } = FetchUsers();
    const { user } = useSelector((state) => state.user);
    const navigate = useNavigate();
    const [showConfirmModal, setShowConfirmModal] = React.useState(false);
    const [userIdToDelete, setUserIdToDelete] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);
    const [currentTable, setCurrentTable] = useState(null);
    const [roleFilter, setRoleFilter] = useState('all');

    const handleViewUser = (userData) => {
        navigate(`${USER_PATHS.VIEW_USER}/${userData.id}`);
    };

    const handleAddUser = () => {
        navigate(`${USER_PATHS.ADD_USER}`);
    };

    const handleEditUser = (userData) => {
        navigate(`${USER_PATHS.EDIT_USER}/${userData.id}`);
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
                setIsLoading(false);
                // Refresh data with current filter after deletion
                await fetchData(roleFilter === 'all' ? null : roleFilter);
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

    // Define filter options for the reusable component
    const roleFilterOptions = [
        { value: 'user', label: 'Users Only' },
        { value: 'exhibitor', label: 'Exhibitors Only' }
    ];

    const destroyTable = () => {
        if (currentTable) {
            $('#user-data-table').off('click', '.delete-btn');
            currentTable.destroy();
            setCurrentTable(null);
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
                    handleViewUser
                );
                setCurrentTable(table);
            } catch (error) {
                console.error('Error initializing user table:', error);
              
            }
        } else {
            console.log('User data is not an array or is undefined:', user);
        }
    };

    useEffect(() => {
        fetchData(roleFilter === 'all' ? null : roleFilter);
        return () => destroyTable();
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
            
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="user-list"> 
                        <Card.Body>
                            {/* Reusable User Filter Component */}
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
                            />
                            
                            <Table striped hover responsive id="user-data-table">
                                <thead>
                                    <tr>
                                        <th>User Details</th>
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
