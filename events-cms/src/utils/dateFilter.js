import * as $ from 'jquery';

export const setupDateFilter = (table) => {
    // Remove any existing filter
    $.fn.dataTable.ext.search = $.fn.dataTable.ext.search.filter(function(fn) {
        return fn.name !== "dateFilter";
    });

    // Add date range filter
    $.fn.dataTable.ext.search.push(
        function dateFilter(settings, data, dataIndex, rowData) {
            const startDateStr = $('#startDateFilter').val();
            const endDateStr = $('#endDateFilter').val();

            // Only filter if end date is selected
            if (!endDateStr) {
                return true;
            }

            // Get the event date from rowData
            const eventDate = new Date(rowData.event?.startDate || rowData.startDate);
            eventDate.setHours(0, 0, 0, 0);

            const startDate = startDateStr ? new Date(startDateStr) : null;
            const endDate = new Date(endDateStr);

            if (startDate) startDate.setHours(0, 0, 0, 0);
            endDate.setHours(23, 59, 59, 999);

            if (startDate) {
                return eventDate >= startDate && eventDate <= endDate;
            } else {
                return eventDate <= endDate;
            }
        }
    );

    // Add event listeners
    $('#startDateFilter').on('change', function() {
        const startDate = $(this).val();
        $('#endDateFilter').attr('min', startDate);
        
        if ($('#endDateFilter').val()) {
            table.draw();
        }
    });

    $('#endDateFilter').on('change', function() {
        const endDate = $(this).val();
        const startDate = $('#startDateFilter').val();

        if (startDate && new Date(endDate) < new Date(startDate)) {
            alert('End date cannot be earlier than start date');
            this.value = '';
            return;
        }

        if (endDate) {
            $('#clearFilterBtn').show();
            table.draw();
        } else {
            $('#clearFilterBtn').hide();
        }
    });

    // Clear filter functionality
    $('#clearFilterBtn').on('click', function() {
        $('#startDateFilter').val('');
        $('#endDateFilter').val('');
        $('#endDateFilter').attr('min', '');
        $('#startDateFilter').attr('max', '');
        $(this).hide();
        table.draw();
    });
};

export const resetFilters = (currentTable) => {
    if (currentTable) {
        $('#startDateFilter').val('');
        $('#endDateFilter').val('');
        $('#endDateFilter').attr('min', '');
        $('#startDateFilter').attr('max', '');
        $('#clearFilterBtn').hide();
        currentTable.search('').draw();
        currentTable.page('first').draw('page');
    }
};

function atable(data, handleAddEvent) {
    let tableZero = '#data-table-zero';
    $.fn.dataTable.ext.errMode = 'throw';

    if ($.fn.DataTable.isDataTable(tableZero)) {
        return $(tableZero).DataTable();
    }

    const table = $(tableZero).DataTable({
        // ... existing table options ...

        initComplete: function(settings, json) {
            const dateFilterHtml = `
                <div class="date-filter-container d-flex align-items-center">
                    <div class="filter-group mr-3">
                        <label class="small mr-2">From:</label>
                        <input 
                            type="date" 
                            id="startDateFilter" 
                            class="form-control form-control-sm"
                        >
                    </div>
                    <div class="filter-group mr-3">
                        <label class="small mr-2">To:</label>
                        <input 
                            type="date" 
                            id="endDateFilter" 
                            class="form-control form-control-sm"
                        >
                    </div>
                    <div id="clearFilterBtn" class="filter-group" style="display: none;">
                        <button class="btn btn-light">
                            <i class="feather icon-x"></i> Clear Filter
                        </button>
                    </div>
                </div>
            `;
            
            $('.date-filter-wrapper').html(dateFilterHtml);
            setupDateFilter(table);
        },
        
        // ... rest of the table configuration
    });

    return table;
} 