import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Reusable hook for DataTable pagination navigation
 * Handles page preservation when navigating to View/Edit/Add pages and back
 * 
 * @param {Object} options - Configuration options
 * @param {Object} options.tableRef - Ref to the DataTable instance
 * @param {string} options.listPath - Base path for the list page (e.g., '/events', '/speakers')
 * @param {string} options.viewPath - Base path for view page (e.g., '/events/view-event', '/speakers/view-speaker')
 * @param {string} options.editPath - Base path for edit page (e.g., '/events/edit-event', '/speakers/edit-speaker')
 * @param {string} options.addPath - Base path for add page (e.g., '/events/add-event', '/speakers/add-speaker')
 * @returns {Object} Navigation handlers with page preservation
 */
const useTableNavigation = ({ tableRef, listPath, viewPath, editPath, addPath }) => {
    const navigate = useNavigate();
    const location = useLocation();

    /**
     * Gets the current page number from DataTable or URL
     * Priority: DataTable > URL > null
     * 
     * @returns {string|null} Current page number (1-based) or null
     */
    const getCurrentPage = useCallback(() => {
        // Try to get from DataTable first (most accurate)
        if (tableRef?.current) {
            try {
                const pageInfo = tableRef.current.page.info();
                if (pageInfo && pageInfo.page !== undefined) {
                    // DataTable uses 0-based indexing, URL uses 1-based
                    return (pageInfo.page + 1).toString();
                }
            } catch (e) {
                // DataTable not available, fallback to URL
            }
        }

        // Fallback to URL if DataTable page not available
        const urlParams = new URLSearchParams(window.location.search || location.search);
        return urlParams.get('page');
    }, [tableRef, location.search]);

    /**
     * Navigates to a path with page number preserved in URL
     * 
     * @param {string} path - Target path
     * @param {string|number} id - Optional ID to append to path
     * @param {string} pageParam - Optional page parameter (if not provided, gets from current page)
     */
    const navigateWithPage = useCallback(
        (path, id = null, pageParam = null) => {
            const currentPage = pageParam || getCurrentPage();
            const fullPath = id ? `${path}/${id}` : path;
            const url = currentPage ? `${fullPath}?page=${currentPage}` : fullPath;
            navigate(url);
        },
        [navigate, getCurrentPage]
    );

    /**
     * Handles navigation to view page with page preservation
     * 
     * @param {Object} data - Item data containing id
     * @param {string} pageParam - Optional page parameter
     */
    const handleView = useCallback(
        (data, pageParam = null) => {
            // If pageParam is provided, use it; otherwise try to get from DataTable or URL
            const currentPage = pageParam || getCurrentPage();
            const fullPath = data.id ? `${viewPath}/${data.id}` : viewPath;
            const url = currentPage ? `${fullPath}?page=${currentPage}` : fullPath;
            
            // Check if this is for upcoming events and add a flag
            // This helps ViewEventPage know it's an upcoming event even if pathname check fails
            const isUpcomingPath = viewPath.includes('/upcoming/view-upcoming-event');
            if (isUpcomingPath) {
                const separator = currentPage ? '&' : '?';
                navigate(`${url}${separator}fromUpcoming=true`);
            } else {
                navigate(url);
            }
        },
        [viewPath, navigate, getCurrentPage]
    );

    /**
     * Handles navigation to edit page with page preservation
     * 
     * @param {Object} data - Item data containing id
     */
    const handleEdit = useCallback(
        (data) => {
            navigateWithPage(editPath, data.id);
        },
        [editPath, navigateWithPage]
    );

    /**
     * Handles navigation to add page with page preservation
     */
    const handleAdd = useCallback(() => {
        navigateWithPage(addPath);
    }, [addPath, navigateWithPage]);

    /**
     * Handles back navigation to list page with page preservation
     * Reads page number from URL and navigates back to the same page
     * 
     * @param {string} pageParam - Optional page parameter (if not provided, reads from URL)
     */
    const handleBack = useCallback(
        (pageParam = null) => {
            // Get page number from URL to preserve it when going back
            // Use window.location.search for the actual browser URL (more reliable than React Router location)
            const urlParams = new URLSearchParams(window.location.search || location.search);
            const currentPage = pageParam || urlParams.get('page') || location.state?.page;
            
            if (currentPage) {
                navigate(`${listPath}?page=${currentPage}`);
            } else {
                navigate(listPath);
            }
        },
        [navigate, listPath, location.search, location.state]
    );

    return {
        getCurrentPage,
        navigateWithPage,
        handleView,
        handleEdit,
        handleAdd,
        handleBack
    };
};

export default useTableNavigation;

