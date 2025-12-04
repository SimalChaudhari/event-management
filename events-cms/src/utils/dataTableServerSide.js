import { buildQueryParams } from './buildQueryParams';

/**
 * DataTables Server-Side Processing Utility
 * Makes DataTables work with backend pagination while keeping the same UI
 */
export const initializeServerSideDataTable = ({
    tableSelector,
    ajaxUrl,
    ajaxMethod = 'GET',
    columns,
    ajaxParams = {},
    onDataLoaded = null,
    restoreTablePage = null,
    initCompleteCallback = null,
    axiosInstance = null,
    dom = null, // Custom DOM configuration
    pageLength = 10,
    lengthMenu = [[5, 10, 25, 50, -1], [5, 10, 25, 50, 'All']],
    order = null, // Default sort order
    dispatch = null, // Redux dispatch for loading state
    loadingActionType = null // Action type to dispatch for loading (e.g., 'EVENT_LOADING')
}) => {
    const $ = window.$ || require('jquery');
    
    // Destroy existing table if it exists
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector).DataTable().destroy();
    }

    const dataTableInstance = $(tableSelector).DataTable({
        processing: true,
        serverSide: true,
        order: order || undefined, // Set default sort order if provided
        ajax: function (data, callback, settings) {
            // Show loading state if dispatch and loadingActionType are provided
            if (dispatch && loadingActionType) {
                dispatch({ type: loadingActionType, payload: true });
            }
            
            // Get current ajaxParams (support both object and function)
            const currentAjaxParams = typeof ajaxParams === 'function' ? ajaxParams() : ajaxParams;
            
            console.log('DataTable ajax: currentAjaxParams', currentAjaxParams);
            
            // Determine default sortBy based on order or column index
            let defaultSortBy = 'updatedAt';
            if (order && order.length > 0) {
                const defaultOrderColumn = order[0][0];
                defaultSortBy = data.columns[defaultOrderColumn]?.data || 'updatedAt';
            } else {
                defaultSortBy = data.columns[0]?.data || 'updatedAt';
            }
            
            // Get sortBy from current order, or use default
            const currentOrder = data.order && data.order.length > 0 ? data.order[0] : null;
            const sortByColumn = currentOrder ? data.columns[currentOrder.column] : null;
            const sortBy = sortByColumn?.data || defaultSortBy;
            const sortOrder = currentOrder?.dir?.toUpperCase() || (order && order.length > 0 ? order[0][1].toUpperCase() : 'DESC');
            
            // Handle "All" option (-1) - set a reasonable limit
            const pageSize = data.length === -1 ? 1000 : data.length; // Use 1000 as max when "All" is selected
            
            // Map DataTables parameters to backend API parameters
            const filters = {
                page: Math.floor(data.start / pageSize) + 1, // Calculate page number
                limit: pageSize, // Page size
                sortBy: sortBy,
                sortOrder: sortOrder,
                ...currentAjaxParams // Additional custom parameters (like eventName, startDate, endDate)
            };
            
            // Only add search if it has a value
            if (data.search?.value && data.search.value.trim() !== '') {
                filters.search = data.search.value.trim();
            }
            
            console.log('DataTable ajax: filters before cleaning', filters);
            
            // Clean filters - remove null/undefined/empty/'all' values
            const cleanedFilters = {};
            Object.keys(filters).forEach(key => {
                const value = filters[key];
                // Skip null, undefined, empty string, and 'all' for role
                if (value !== null && value !== undefined && value !== '') {
                    // Special handling for role filter
                    if (key === 'role') {
                        // Skip if role is 'all' or empty
                        if (value === 'all' || value === '') {
                            return; // Skip this filter
                        }
                        // Only add valid roles
                        if (['user', 'exhibitor', 'speaker', 'moderator', 'admin'].includes(value)) {
                            cleanedFilters[key] = value;
                        }
                    } else {
                        // For date filters, ensure they're strings
                        if ((key === 'startDate' || key === 'endDate') && value) {
                            cleanedFilters[key] = String(value);
                        } else if (key === 'eventName' && value) {
                            // For eventName, trim and ensure it's a string
                            cleanedFilters[key] = String(value).trim();
                        } else {
                            cleanedFilters[key] = value;
                        }
                    }
                }
            });
            
            console.log('DataTable: Sending filters to backend', cleanedFilters);
            console.log('DataTable: eventName in cleanedFilters', cleanedFilters.eventName, 'type:', typeof cleanedFilters.eventName, 'length:', cleanedFilters.eventName?.length);
            
            // Build query parameters using reusable utility
            const urlSearchParams = buildQueryParams(cleanedFilters);
            
            // Convert URLSearchParams to object for axios
            const paramsObject = {};
            urlSearchParams.forEach((value, key) => {
                paramsObject[key] = value;
            });
            
            // Use axios if provided, otherwise use jQuery ajax
            if (axiosInstance) {
                axiosInstance.get(ajaxUrl, { params: paramsObject })
                    .then(response => {
                        const json = response.data;
                        // Handle both 'data' and 'events' response formats for backward compatibility
                        const responseData = json.data || json.events || [];
                        if (json.success && responseData) {
                            // Call custom callback if provided - pass full response to access filter data
                            if (onDataLoaded) {
                                onDataLoaded(responseData, json.metadata, json);
                            }
                            
                            // Return DataTables format
                            callback({
                                draw: data.draw,
                                recordsTotal: json.metadata?.total || responseData.length,
                                recordsFiltered: json.metadata?.total || responseData.length,
                                data: responseData,
                                metadata: json.metadata
                            });
                        } else {
                            callback({
                                draw: data.draw,
                                recordsTotal: 0,
                                recordsFiltered: 0,
                                data: []
                            });
                        }
                        // Hide loading state after successful response
                        if (dispatch && loadingActionType) {
                            dispatch({ type: loadingActionType, payload: false });
                        }
                    })
                    .catch(error => {
                        console.error('DataTables AJAX error:', error);
                        callback({
                            draw: data.draw,
                            recordsTotal: 0,
                            recordsFiltered: 0,
                            data: []
                        });
                        // Hide loading state on error
                        if (dispatch && loadingActionType) {
                            dispatch({ type: loadingActionType, payload: false });
                        }
                    });
            } else {
                // Fallback to jQuery ajax
                $.ajax({
                    url: ajaxUrl,
                    type: ajaxMethod,
                    data: paramsObject,
                    success: function (json) {
                        // Handle both 'data' and 'events' response formats for backward compatibility
                        const responseData = json.data || json.events || [];
                        if (json.success && responseData) {
                            if (onDataLoaded) {
                                onDataLoaded(responseData, json.metadata, json);
                            }
                            callback({
                                draw: data.draw,
                                recordsTotal: json.metadata?.total || responseData.length,
                                recordsFiltered: json.metadata?.total || responseData.length,
                                data: responseData,
                                metadata: json.metadata
                            });
                        } else {
                            callback({
                                draw: data.draw,
                                recordsTotal: 0,
                                recordsFiltered: 0,
                                data: []
                            });
                        }
                    },
                    error: function (xhr, error, thrown) {
                        console.error('DataTables AJAX error:', error);
                        callback({
                            draw: data.draw,
                            recordsTotal: 0,
                            recordsFiltered: 0,
                            data: []
                        });
                    }
                });
            }
        },
        columns: columns,
        pageLength: pageLength,
        lengthMenu: lengthMenu,
        pagingType: 'full_numbers',
        dom: dom || "<'row mb-3'<'col-sm-12 col-md-6'l><'col-sm-12 col-md-6 d-flex justify-content-end align-items-center'<'search-container'f><'add-user-button ml-1'>>>" +
             "<'row'<'col-sm-12'tr>>" +
             "<'row'<'col-sm-12 col-md-5'i><'col-sm-12 col-md-7'p>>",
        language: {
            processing: 'Loading...',
            search: 'Search:',
            lengthMenu: 'Show _MENU_ entries',
            info: 'Showing _START_ to _END_ of _TOTAL_ entries',
            infoEmpty: 'No entries found',
            infoFiltered: '(filtered from _MAX_ total entries)',
            zeroRecords: 'No matching records found'
        },
        initComplete: function (settings, json) {
            if (typeof restoreTablePage === 'function') {
                const api = this.api();
                restoreTablePage(api);
            }
            
            if (typeof initCompleteCallback === 'function') {
                initCompleteCallback(settings, json, this.api());
            }
        },
        drawCallback: function (settings) {
            // Update info text with backend pagination data if available
            const api = this.api();
            const pageInfo = api.page.info();
            
            // If we have custom pagination info from the last AJAX call, update the display
            if (settings.aoData && settings.aoData.length > 0) {
                const lastResponse = settings.json;
                if (lastResponse && lastResponse.metadata) {
                    const metadata = lastResponse.metadata;
                    const infoText = `Showing ${((metadata.page - 1) * metadata.limit) + 1} to ${Math.min(metadata.page * metadata.limit, metadata.total)} of ${metadata.total} users`;
                    $(settings.nTable).find('.dataTables_info').html(infoText);
                }
            }
        }
    });

    return dataTableInstance;
};

/**
 * Update DataTables with new filters/parameters
 */
export const updateDataTableFilters = (tableInstance, newParams = {}) => {
    if (tableInstance && typeof tableInstance.ajax === 'function') {
        // Update ajax parameters
        const currentAjax = tableInstance.ajax.params();
        const updatedParams = {
            ...currentAjax,
            ...newParams
        };
        
        // Reload with new parameters
        tableInstance.ajax.reload(null, false);
    }
};

