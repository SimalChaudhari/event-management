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
    loadingActionType = null, // Action type to dispatch for loading (e.g., 'EVENT_LOADING')
    rowReorder = null, // RowReorder configuration object
    fetchAction = null, // Redux action function to fetch data (e.g., getAllEngagements)
    searchParamName = 'keyword', // Backend param for search box (e.g. 'keyword' for events, 'search' for orders)
    infoEntityName = 'entries' // Label for pagination info: "Showing X to Y of Z entries"
}) => {
    const $ = window.$ || require('jquery');
    
    // Destroy existing table if it exists
    if ($.fn.DataTable.isDataTable(tableSelector)) {
        $(tableSelector).DataTable().destroy();
    }

    // Read page parameter from URL to set initial page before first API call
    // This prevents the double API call (first page 1, then correct page)
    const urlParams = new URLSearchParams(window.location.search);
    const pageParam = parseInt(urlParams.get('page'), 10);
    let displayStart = 0; // Default to first page (0-indexed start position)
    
    if (!Number.isNaN(pageParam) && pageParam >= 1) {
        // Calculate displayStart: (page - 1) * pageLength
        // DataTables uses 0-indexed start position
        displayStart = (pageParam - 1) * pageLength;
    }

    // Debounce timer for search - store it per table instance
    let searchDebounceTimer = null;
    let lastSearchValue = '';
    let pendingCallback = null;
    let pendingData = null;
    let pendingSettings = null;

    // Debounce function for search
    const debounceSearch = (data, callback, settings) => {
        const currentSearchValue = data.search?.value || '';
        const isSearchChange = currentSearchValue !== lastSearchValue;
        
        // Check if this is a search-only change (same page, same sort, only search changed)
        const isSearchOnlyChange = isSearchChange && 
            data.start === (pendingData?.start || 0) && 
            JSON.stringify(data.order) === JSON.stringify(pendingData?.order || []);
        
        // Clear existing timer
        if (searchDebounceTimer) {
            clearTimeout(searchDebounceTimer);
        }
        
        // Store current values
        pendingCallback = callback;
        pendingData = data;
        pendingSettings = settings;
        
        // If it's a search-only change, debounce it
        if (isSearchOnlyChange && currentSearchValue !== '') {
            searchDebounceTimer = setTimeout(() => {
                lastSearchValue = currentSearchValue;
                executeAjaxCall(pendingData, pendingCallback, pendingSettings);
                searchDebounceTimer = null;
            }, 1000); // 500ms delay
        } else {
            // For non-search changes (pagination, sorting) or empty search, execute immediately
            lastSearchValue = currentSearchValue;
            executeAjaxCall(data, callback, settings);
        }
    };

    // Actual AJAX call function
    const executeAjaxCall = function (data, callback, settings) {
            // Show loading state if dispatch and loadingActionType are provided
            if (dispatch && loadingActionType) {
                dispatch({ type: loadingActionType, payload: true });
            }
            
            // Get current ajaxParams (support both object and function)
            const currentAjaxParams = typeof ajaxParams === 'function' ? ajaxParams() : ajaxParams;
            
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
            
            // Only add search if it has a value (DataTable search box or filter-card value from ajaxParams)
            const searchBoxValue = data.search?.value?.trim() || '';
            const filterCardSearch = currentAjaxParams[searchParamName];
            const searchValue = searchBoxValue || (typeof filterCardSearch === 'string' && filterCardSearch.trim() ? filterCardSearch.trim() : undefined);
            if (searchValue) {
                filters[searchParamName] = searchValue;
            }
            
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
                        if ((key === 'startDate' || key === 'endDate' || key === 'dateFrom' || key === 'dateTo') && value) {
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
            
            // Build query parameters using reusable utility
            const urlSearchParams = buildQueryParams(cleanedFilters);
            
            // Convert URLSearchParams to object for axios
            const paramsObject = {};
            urlSearchParams.forEach((value, key) => {
                paramsObject[key] = value;
            });
            
            // Use Redux action if provided, otherwise use direct API call
            if (fetchAction && dispatch) {
                // Use Redux action to fetch data
                dispatch(fetchAction(cleanedFilters))
                    .then(result => {
                        if (result && !result.error) {
                            const responseData = result.data || [];
                            const metadata = result.pagination || {};
                            
                            // Call custom callback if provided - pass full response to access filter data
                            if (onDataLoaded) {
                                const processedData = onDataLoaded(responseData, metadata, { 
                                    data: responseData, 
                                    events: result.events,
                                    metadata: metadata 
                                });
                                // Use processed data if callback returns something
                                const finalData = processedData !== undefined ? processedData : responseData;
                                
                                callback({
                                    draw: data.draw,
                                    recordsTotal: metadata.total || finalData.length,
                                    recordsFiltered: metadata.total || finalData.length,
                                    data: finalData,
                                    metadata: metadata
                                });
                            } else {
                                callback({
                                    draw: data.draw,
                                    recordsTotal: metadata.total || responseData.length,
                                    recordsFiltered: metadata.total || responseData.length,
                                    data: responseData,
                                    metadata: metadata
                                });
                            }
                        } else {
                            callback({
                                draw: data.draw,
                                recordsTotal: 0,
                                recordsFiltered: 0,
                                data: []
                            });
                        }
                        // Hide loading state after response
                        if (dispatch && loadingActionType) {
                            dispatch({ type: loadingActionType, payload: false });
                        }
                    })
                    .catch(error => {
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
            } else if (axiosInstance) {
                // Use direct axios call if no action provided
                axiosInstance.get(ajaxUrl, { params: paramsObject })
                    .then(response => {
                        const json = response.data;
                        // Handle both 'data' and 'events' response formats for backward compatibility
                        const responseData = json.data || json.events || [];
                        // Support APIs that return total/page/limit at top level (e.g. orders) or in metadata
                        const metadata = json.metadata || (json.total !== undefined ? { total: json.total, page: json.page, limit: json.limit } : {});
                        const totalCount = metadata.total ?? responseData.length;
                        if (json.success !== false && (responseData.length > 0 || totalCount >= 0)) {
                            // Call custom callback if provided - pass full response to access filter data
                            if (onDataLoaded) {
                                onDataLoaded(responseData, metadata, json);
                            }
                            callback({
                                draw: data.draw,
                                recordsTotal: totalCount,
                                recordsFiltered: totalCount,
                                data: responseData,
                                metadata
                            });
                        } else {
                            callback({
                                draw: data.draw,
                                recordsTotal: 0,
                                recordsFiltered: 0,
                                data: []
                            });
                        }
                        if (dispatch && loadingActionType) {
                            dispatch({ type: loadingActionType, payload: false });
                        }
                    })
                    .catch(error => {
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
                        callback({
                            draw: data.draw,
                            recordsTotal: 0,
                            recordsFiltered: 0,
                            data: []
                        });
                    }
                });
            }
    };

    const dataTableConfig = {
        processing: true,
        serverSide: true,
        displayStart: displayStart, // Set initial page from URL to prevent double API call
        order: order || undefined, // Set default sort order if provided
        searchDelay: 500, // Additional delay for UI feedback
        ajax: debounceSearch, // Use debounced search function
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
                    const infoText = `Showing ${((metadata.page - 1) * metadata.limit) + 1} to ${Math.min(metadata.page * metadata.limit, metadata.total)} of ${metadata.total} ${infoEntityName}`;
                    $(settings.nTable).find('.dataTables_info').html(infoText);
                }
            }
        }
    };

    // Add rowReorder configuration if provided
    if (rowReorder) {
        dataTableConfig.rowReorder = rowReorder;
    }

    const dataTableInstance = $(tableSelector).DataTable(dataTableConfig);

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

