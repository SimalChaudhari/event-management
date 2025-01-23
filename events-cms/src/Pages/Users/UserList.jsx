import * as React from 'react';
import { useEffect } from 'react';
import { Row, Col, Card, Table } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import * as $ from 'jquery';
import { userList } from '../../store/actions/userActions';
import { DUMMY_PATH } from '../../configs/env';
// @ts-ignore
$.DataTable = require('datatables.net-bs');

function atable(data) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    // Destroy the DataTable if it already exists
    if ($.fn.DataTable.isDataTable(tableZero)) {
        $(tableZero).DataTable().clear().destroy();
    }

    $(tableZero).DataTable({
        data: data,
        order: [[1, 'asc']], // Order by Name (First Name) column
        columns: [
            {
                data: 'profilePicture',
                render: function (data, type, row) {
                    // const imageUrl = row.profilePicture || DUMMY_PATH;
                    const imageUrl = DUMMY_PATH;

                    return `
                            <div class="d-inline-block align-middle">
                                <img src="${imageUrl}" alt="user" class="img-radius align-top m-r-15" style="width:50px; height:50px; object-fit:cover;" />
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
                    return data
                        ? '<span class="badge badge-light-success">Yes</span>'
                        : '<span class="badge badge-light-danger">No</span>';
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
            { data: 'countryCurrency', title: 'Currency' },
          
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
    // Attach event listeners for actions
    $(document).on('click', '.view-btn', function () {
        const userId = $(this).data('id');
        alert(`View user with ID: ${userId}`);
    });

    $(document).on('click', '.edit-btn', function () {
        const userId = $(this).data('id');
        alert(`Edit user with ID: ${userId}`);
    });

    $(document).on('click', '.delete-btn', function () {
        const userId = $(this).data('id');
        if (window.confirm('Are you sure you want to delete this user?')) {
            alert(`Delete user with ID: ${userId}`);
        }
    });
}


const UserList = () => {
    // Fetch user data from Redux
    const dispatch = useDispatch()
    const { user } = useSelector((state) => state.user); // Replace 'state.users' with the actual path in your Redux state

    useEffect(() => {
        if (user.length) {
            atable(user);
        }
    }, [user]);

    // Fetch data when the component mounts
    useEffect(() => {
        const FetchData = async () => {
            await dispatch(userList()); // Fetch user data
        };
        FetchData();
    }, [dispatch]); // Only runs once when the component mounts

    // Log the user data whenever it updates
    useEffect(() => {
        console.log("🚀 ~ Updated user data:", user);
    }, [user]);

    return (
        <Row>
            <Col sm={12} className="btn-page">
                <Card className="user-profile-list">
                    <Card.Body>
                        <Table striped hover responsive id="data-table-zero">
                            <thead>
                                <tr>
                                    <th>Profile</th>
                                    <th>Mobile</th>
                                    <th>Address</th>
                                    <th>City</th>
                                    <th>State</th>
                                    <th>Postal Code</th>
                                    <th>Member</th>
                                    <th>Biometric Enabled</th>
                                    <th>Currency</th>
                                    <th>Actions</th>

                                </tr>
                            </thead>
                        </Table>
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
};

export default UserList;
