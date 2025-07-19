import * as React from 'react';
import { useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Table from 'react-bootstrap/Table';
import { useSelector } from 'react-redux';
import * as $ from 'jquery';
import {  API_URL, DUMMY_PATH_USER } from '../../configs/env';
import AddUserModal from './components/AddUserModal';
import { FetchUsers } from './fetchApi/FetchApi';
import DeleteConfirmationModal from '../../components/modal/DeleteConfirmationModal';
import ViewUserModal from './components/ViewUserModal';
import { useNavigate } from 'react-router-dom';

// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(data, handleAddUser, handleEditUser, handleDeleteUser,handleViewUser) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Preserve the current page
    let currentPage = $(tableZero).DataTable().page();

    // Destroy the DataTable if it already exists
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data,
        order: [[0, 'asc']], // Order by Name (First Name) column
        searching: true, // Enable search
        searchDelay: 500, // Delay in milliseconds
        pageLength: 5, // Records per page
        lengthMenu: [
            [5, 10, 25, 50, -1],
            [5, 10, 25, 50, 'All']
        ], // Page length options
        pagingType: 'full_numbers', // Type of pagination

        // Add this dom configuration
        dom:
            "<'row'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end'f<'add-user-button ml-2'>>>" +
            "<'row'<'col-sm-12'tr>>" +
            "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        // Add this initComplete function
        initComplete: function (settings, json) {
            $('.add-user-button').html(`
                 <button class="btn btn-primary d-flex align-items-center ml-2" id="addUserBtn">
                     <i class="feather icon-plus mr-1"></i>
                     Add User
                 </button>
             `);

            // Add click event listener
            $('#addUserBtn').on('click', function () {
                handleAddUser();
            });
        },

        columns: [
            {
                data: 'profilePicture',
                render: function (data, type, row) {
                    // const imageUrl = row.profilePicture || DUMMY_PATH;
                    const imageUrl = DUMMY_PATH_USER;

                    return `
                            <div class="d-inline-block align-middle">
                                <img src="${row.profilePicture ? `${API_URL}/${row.profilePicture}` : imageUrl}" alt="user" class="img-radius align-top m-r-15" style="width:50px; height:50px; object-fit:cover;" />
                                  <div class="d-inline-block">
                                    <h6 class="m-b-0">${row.firstName} ${row.lastName}</h6>
                                    <p class="m-b-0">${row.email}</p>
                                </div>
                            </div>
                        `;
                }
            },
    
            { data: 'mobile', title: 'Mobile' },
            { data: 'address', title: 'Address' },
            { data: 'city', title: 'City' },
            { data: 'state', title: 'State' },
            { data: 'postalCode', title: 'Postal Code' },
            {
                data: 'isMember',
                render: function (data) {
                    return data ? '<span class="badge badge-light-success">Yes</span>' : '<span class="badge badge-light-danger">No</span>';
                },
                title: 'Member'
            },
            {
                data: 'biometricEnabled',
                render: function (data) {
                    return data
                        ? '<span class="badge badge-light-success">Enabled</span>'
                        : '<span class="badge badge-light-danger">Disabled</span>';
                },
                title: 'Biometric Enabled'
            },

            {
                data: null,
                render: function (data, type, row) {
                    return `
                    <div class="btn-group" role="group" aria-label="Actions">
                        <button type="button" class="btn btn-icon btn-success" data-id="${row.id}" title="View" 
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
                },
                title: 'Actions',
                orderable: false
            }
        ]
    });

      // Restore the page
      $(tableZero).DataTable().page(currentPage).draw(false);

    // Attach event listeners for actions
    $(document).on('click', '.btn-icon', function () {
        const userId = $(this).data('id');
        const userData = data.find((user) => user.id === userId);
        if (userData) {
          handleViewUser(userData);
        }
    });

    $(document).on('click', '.edit-btn', function () {
        const userId = $(this).data('id');
        const userData = data.find((user) => user.id === userId);
        if (userData) {
            handleEditUser(userData);
        }
    });

    $(document).on('click', '.delete-btn', function () {
        const userId = $(this).data('id');
        handleDeleteUser(userId);
    });
}

const UserList = () => {
    const { fetchData, deleteUserData } = FetchUsers(); // Destructure fetchData from the custom hook

    const { user } = useSelector((state) => state.user); // Replace 'state.users' with the actual path in your Redux state
    const [showModal, setShowModal] = React.useState(false);
    const [showViewModal, setShowViewModal] = React.useState(false); // State for view modal
    const navigate = useNavigate();
    const [editData, setEditData] = React.useState(null);

    const [viewData, setViewData] = React.useState(null); // State for user data to view

    const [showConfirmModal, setShowConfirmModal] = React.useState(false);
    const [userIdToDelete, setUserIdToDelete] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleCloseModal = () => {
        setShowModal(false);
    };

    const handleViewUser = (userData) => {
        navigate(`/users/view-user/${userData.id}`);
      };
    

    const handleAddUser = () => {
        navigate(`/users/add-user`);
    };

    const handleEditUser = (userData) => {
        navigate(`/users/edit-user/${userData.id}`);
    };

    const handleDeleteUser = (userId) => {
        setUserIdToDelete(userId);
        setShowConfirmModal(true);
    };

    const confirmDeleteUser = async () => {
        setIsLoading(true);
        if (userIdToDelete) {
            try {
                await deleteUserData(userIdToDelete); // Await the delete operation
                setShowConfirmModal(false);
                fetchData(); // Refresh the user list after successful deletion
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
        setIsLoading(false);
    };

    useEffect(() => {
        if (user.length) {
            atable(user.data, handleAddUser, handleEditUser, handleDeleteUser,handleViewUser); // Pass handleAddUser to atable
        }
    }, [user, handleAddUser]); // Add handleAddUser to dependencies

    // Fetch data when the component mounts
    useEffect(() => {
        fetchData();
    }, []); // Only runs once when the component mounts

    return (
        <>
            <AddUserModal show={showModal} handleClose={handleCloseModal} editData={editData} />
            <ViewUserModal show={showViewModal} handleClose={() => setShowViewModal(false)} userData={viewData} />
   
            <DeleteConfirmationModal
                show={showConfirmModal}
                onHide={() => setShowConfirmModal(false)}
                onConfirm={confirmDeleteUser}
                isLoading={isLoading}
            />
            <Row>
                <Col sm={12} className="btn-page">
                    <Card className="user-profile-list">
                        <Card.Body>
                            <Table striped hover responsive id="data-table-zero">
                                <thead>
                                    <tr>
                                        <th>Name/ Email / Profile</th>
                                        <th>Mobile</th>
                                        <th>Address</th>
                                        <th>City</th>
                                        <th>State</th>
                                        <th>Postal Code</th>
                                        <th>Member</th>
                                        <th>Biometric Enabled</th>
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

export default UserList;
