import { useCallback, useMemo, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Keeps DataTable pagination in sync with the URL so the page is restored after refresh / navigation.
 * @param {string} paramName Query parameter to use for the page (default: "page")
 * @returns {{ initialPage: number, handlePageChange: (pageIndex: number) => void, restoreTablePage: (dataTableInstance: any, currentPage?: number) => any }}
 */
const usePersistedTablePage = (paramName = 'page') => {
    const navigate = useNavigate();
    const location = useLocation();
    
    // Use ref to store the latest handlePageChange to avoid stale closures
    const handlePageChangeRef = useRef(null);

    const initialPage = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const pageParam = parseInt(params.get(paramName), 10);
        if (Number.isNaN(pageParam) || pageParam < 1) {
            return 0;
        }
        return pageParam - 1;
    }, [location.search, paramName]);

    const handlePageChange = useCallback(
        (pageIndex) => {
            const params = new URLSearchParams(location.search);
            const currentPageParam = params.get(paramName);

            // If on first page (pageIndex === 0), remove the page parameter
            if (pageIndex === 0) {
                if (currentPageParam === null) {
                    // Already on first page with no param, no need to update
                    return;
                }
                // Remove the page parameter
                params.delete(paramName);
                const searchString = params.toString();
                const nextSearch = searchString ? `?${searchString}` : '';
                // Always update URL when going to first page if there was a page param
                navigate(
                    {
                        pathname: location.pathname,
                        search: nextSearch
                    },
                    { replace: true }
                );
                return;
            } else {
                // For pages > 1, set the page parameter (pageIndex is 0-based, URL is 1-based)
                const newPage = pageIndex + 1;
                if (currentPageParam === String(newPage)) {
                    // Already on this page, no need to update
                    return;
                }
                params.set(paramName, String(newPage));
                const searchString = params.toString();
                const nextSearch = searchString ? `?${searchString}` : '';
                // Always update URL when page changes
                navigate(
                    {
                        pathname: location.pathname,
                        search: nextSearch
                    },
                    { replace: true }
                );
                return;
            }
        },
        [location.pathname, location.search, navigate, paramName]
    );
    
    // Keep ref updated with latest handlePageChange
    useEffect(() => {
        handlePageChangeRef.current = handlePageChange;
    }, [handlePageChange]);

    /**
     * Restores the DataTable page from URL and sets up page change listener
     * @param {any} dataTableInstance - The DataTable instance
     * @returns {any} The DataTable instance
     */
    const restoreTablePage = useCallback(
        (dataTableInstance) => {
            if (!dataTableInstance) {
                return dataTableInstance;
            }

            // Get page info from DataTable
            const pageInfo = dataTableInstance.page.info();
            const totalPages = pageInfo ? pageInfo.pages : 0;
            
            // Read page parameter directly from current URL at restoration time
            // Use window.location.search to get the actual current URL (not React Router's location which might be stale)
            const currentSearch = window.location.search || location.search;
            const params = new URLSearchParams(currentSearch);
            const pageParam = parseInt(params.get(paramName), 10);
            let targetPage = 0; // Default to page 0 if no page param in URL
            if (!Number.isNaN(pageParam) && pageParam >= 1) {
                targetPage = pageParam - 1; // Convert 1-based URL to 0-based DataTable index
            }
            const originalTargetPage = targetPage;
            
            // Ensure target page is within valid range
            if (totalPages > 0 && targetPage >= totalPages) {
                targetPage = Math.max(totalPages - 1, 0);
            }
            
            // Restore the page if there are pages available and it's different from current
            const currentTablePage = pageInfo ? pageInfo.page : 0;
            if (totalPages > 0 && targetPage >= 0 && targetPage < totalPages && currentTablePage !== targetPage) {
                // Only change page if it's different - this prevents unnecessary redraws
                dataTableInstance.page(targetPage).draw('page');
            }

            // Set up page change listener - use ref to always get latest version
            // Remove any existing listeners
            dataTableInstance.off('page.dt');
            // Set up new listener that uses the ref
            dataTableInstance.on('page.dt', function () {
                const currentPage = dataTableInstance.page();
                if (handlePageChangeRef.current) {
                    handlePageChangeRef.current(currentPage);
                }
            });

            // Update URL if page was adjusted (e.g., from page 3 to page 2 after deletion)
            if (originalTargetPage !== targetPage) {
                handlePageChange(targetPage);
            } else {
                // Only sync URL if it doesn't match the target page we restored to
                // Use targetPage (the page we just set) instead of reading back from DataTable
                if (targetPage === 0) {
                    // If we restored to page 0, ensure page param is removed from URL
                    const params = new URLSearchParams(location.search);
                    if (params.get(paramName) !== null) {
                        params.delete(paramName);
                        const searchString = params.toString();
                        const nextSearch = searchString ? `?${searchString}` : '';
                        if (nextSearch !== location.search) {
                            navigate(
                                {
                                    pathname: location.pathname,
                                    search: nextSearch
                                },
                                { replace: true }
                            );
                        }
                    }
                } else {
                    // If we restored to a non-zero page, ensure URL has correct page param
                    const expectedPage = targetPage + 1;
                    const params = new URLSearchParams(location.search);
                    const currentPageParam = params.get(paramName);
                    if (currentPageParam !== String(expectedPage)) {
                        params.set(paramName, String(expectedPage));
                        const searchString = params.toString();
                        const nextSearch = searchString ? `?${searchString}` : '';
                        if (nextSearch !== location.search) {
                            navigate(
                                {
                                    pathname: location.pathname,
                                    search: nextSearch
                                },
                                { replace: true }
                            );
                        }
                    }
                }
            }

            return dataTableInstance;
        },
        [initialPage, handlePageChange, location.pathname, location.search, navigate, paramName]
    );

    /**
     * Checks if the current page is valid after data changes (e.g., after deletion)
     * and navigates to the previous page if the current page is empty
     * @param {any} dataTableInstance - The DataTable instance
     * @returns {boolean} True if page was adjusted, false otherwise
     */
    const checkAndAdjustPage = useCallback(
        (dataTableInstance) => {
            if (!dataTableInstance) {
                return false;
            }

            const pageInfo = dataTableInstance.page.info();
            const totalPages = pageInfo ? pageInfo.pages : 0;
            const currentPageIndex = pageInfo ? pageInfo.page : 0;

            // If current page is beyond total pages, go to the last available page
            if (totalPages > 0 && currentPageIndex >= totalPages) {
                const targetPage = Math.max(totalPages - 1, 0);
                dataTableInstance.page(targetPage).draw('page');
                
                // Update URL to reflect the new page
                handlePageChange(targetPage);
                return true;
            }

            return false;
        },
        [handlePageChange]
    );

    return { initialPage, handlePageChange, restoreTablePage, checkAndAdjustPage };
};

export default usePersistedTablePage;

