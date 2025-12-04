/**
 * Reusable utility to build query parameters for API requests
 * Can be used for users, events, exhibitors, orders, etc.
 * 
 * @param {Object|string} filters - Filter object or string (for backward compatibility)
 * @param {Object} options - Additional options
 * @param {Object} options.defaultParams - Default parameters to include
 * @param {Object} options.customFilters - Custom filter mappings
 * @returns {URLSearchParams} - Built query parameters
 */
export const buildQueryParams = (filters = {}, options = {}) => {
    const params = new URLSearchParams();
    const { defaultParams = {}, customFilters = {} } = options;
    
    // Support backward compatibility - if filters is a string, treat it as a simple filter
    // For example: 'user' or 'exhibitor' for role filter
    if (typeof filters === 'string') {
        // Handle string filters (backward compatibility)
        if (filters && filters !== 'all' && filters !== '') {
            // Try to determine what type of filter this is
            // Common patterns: role filters, status filters, etc.
            const commonFilters = ['user', 'exhibitor', 'speaker', 'moderator', 'admin', 'active', 'inactive'];
            if (commonFilters.includes(filters.toLowerCase())) {
                // Default to 'role' if it's a common role filter
                if (['user', 'exhibitor', 'speaker', 'moderator', 'admin'].includes(filters.toLowerCase())) {
                    params.append('role', filters);
                }
            }
        }
        return params;
    }
    
    // Handle object filters
    if (typeof filters === 'object' && filters !== null) {
        // Pagination parameters
        if (filters.page !== undefined && filters.page !== null) {
            params.append('page', filters.page);
        }
        if (filters.limit !== undefined && filters.limit !== null) {
            params.append('limit', filters.limit);
        }
        
        // Common filters
        // Role filter - only add if it's a valid role and not 'all'
        const roleValue = filters.role;
        if (roleValue && roleValue !== 'all' && roleValue !== '' && 
            (roleValue === 'user' || roleValue === 'exhibitor' || 
             roleValue === 'speaker' || roleValue === 'moderator' || roleValue === 'admin')) {
            params.append('role', roleValue);
        }
        
        // Search filter
        if (filters.search && filters.search.trim() !== '') {
            params.append('search', filters.search.trim());
        }
        
        // Active status filter
        if (filters.isActive !== undefined && filters.isActive !== null) {
            params.append('isActive', filters.isActive);
        }
        
        // Sorting
        if (filters.sortBy && filters.sortBy.trim() !== '') {
            params.append('sortBy', filters.sortBy.trim());
        }
        if (filters.sortOrder && (filters.sortOrder === 'ASC' || filters.sortOrder === 'DESC')) {
            params.append('sortOrder', filters.sortOrder);
        }
        
        // Date range filters
        if (filters.startDate) {
            params.append('startDate', filters.startDate);
        }
        if (filters.endDate) {
            params.append('endDate', filters.endDate);
        }
        
        // Status filter (generic)
        if (filters.status && filters.status.trim() !== '') {
            params.append('status', filters.status.trim());
        }
        
        // Event-specific filters
        if (filters.eventId) {
            params.append('eventId', filters.eventId);
        }
        if (filters.eventFilter && filters.eventFilter.trim() !== '') {
            params.append('eventFilter', filters.eventFilter.trim());
        }
        if (filters.eventName && filters.eventName.trim() !== '') {
            params.append('eventName', filters.eventName.trim());
        }
        if (filters.keyword && filters.keyword.trim() !== '') {
            params.append('keyword', filters.keyword.trim());
        }
        if (filters.globalSearch && filters.globalSearch.trim() !== '') {
            params.append('globalSearch', filters.globalSearch.trim());
        }
        if (filters.location && filters.location.trim() !== '') {
            params.append('location', filters.location.trim());
        }
        if (filters.upcoming !== undefined && filters.upcoming !== null) {
            params.append('upcoming', filters.upcoming);
        }
        
        // User-specific filters
        if (filters.userId) {
            params.append('userId', filters.userId);
        }
        if (filters.userFilter && filters.userFilter.trim() !== '') {
            params.append('userFilter', filters.userFilter.trim());
        }
        
        // Category filter
        if (filters.category && filters.category.trim() !== '') {
            params.append('category', filters.category.trim());
        }
        
        // Type filter
        if (filters.type && filters.type.trim() !== '') {
            params.append('type', filters.type.trim());
        }
        
        // Custom filters from options
        if (customFilters && typeof customFilters === 'object') {
            Object.keys(customFilters).forEach(key => {
                const filterValue = filters[key];
                const customKey = customFilters[key] || key;
                
                if (filterValue !== undefined && filterValue !== null && filterValue !== '') {
                    if (typeof filterValue === 'boolean') {
                        params.append(customKey, filterValue);
                    } else if (typeof filterValue === 'string' && filterValue.trim() !== '') {
                        params.append(customKey, filterValue.trim());
                    } else if (typeof filterValue === 'number') {
                        params.append(customKey, filterValue);
                    }
                }
            });
        }
        
        // Add default parameters
        if (defaultParams && typeof defaultParams === 'object') {
            Object.keys(defaultParams).forEach(key => {
                if (!params.has(key)) {
                    const value = defaultParams[key];
                    if (value !== undefined && value !== null && value !== '') {
                        params.append(key, value);
                    }
                }
            });
        }
    }
    
    return params;
};

/**
 * Build URL with query parameters
 * 
 * @param {string} baseUrl - Base URL
 * @param {Object|string} filters - Filter object or string
 * @param {Object} options - Additional options
 * @returns {string} - Complete URL with query string
 */
export const buildUrlWithParams = (baseUrl, filters = {}, options = {}) => {
    const params = buildQueryParams(filters, options);
    const queryString = params.toString();
    
    if (queryString) {
        return `${baseUrl}?${queryString}`;
    }
    
    return baseUrl;
};

