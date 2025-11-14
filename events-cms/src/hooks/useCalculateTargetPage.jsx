import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import store from '../store/store';

/**
 * Reusable hook to calculate the target page where a record will appear after create/update
 * Supports different sorting strategies: date-based (descending/ascending) or string-based (alphabetical)
 * 
 * @param {Object} options - Configuration options
 * @param {Function} options.listAction - Action to fetch/refresh the list (e.g., speakerList, eventList)
 * @param {string} options.reduxSelector - Redux state selector path (e.g., 'speaker.speakers', 'event.event.events')
 * @param {number} options.pageLength - Number of items per page (default: 5)
 * @param {string} options.sortType - Type of sorting: 'date' or 'string' (default: 'string')
 * @param {string} options.sortDirection - Sort direction: 'asc' or 'desc' (default: 'asc')
 * @param {string|Array} options.sortFields - Field(s) to sort by. For string: can be array like ['firstName', 'lastName'], for date: single field like 'startDate'
 * @returns {Function} calculateAndNavigate - Function to calculate page and navigate
 */
const useCalculateTargetPage = ({
    listAction,
    reduxSelector,
    pageLength = 5,
    sortType = 'string',
    sortDirection = 'asc',
    sortFields = []
}) => {
    const dispatch = useDispatch();

    /**
     * Gets the array of items from Redux store
     * @param {string} selector - Redux selector path
     * @returns {Array} Array of items
     */
    const getItemsFromStore = useCallback((selector) => {
        const state = store.getState();
        const pathParts = selector.split('.');
        let value = state;
        for (const part of pathParts) {
            value = value?.[part];
            if (value === undefined || value === null) {
                return [];
            }
        }
        return Array.isArray(value) ? value : [];
    }, []);

    /**
     * Parses a date value to Date object
     * @param {*} dateValue - Date value to parse
     * @returns {Date} Parsed date object
     */
    const parseDate = useCallback((dateValue) => {
        if (!dateValue) return new Date(0);
        if (dateValue instanceof Date) return dateValue;
        const dateStr = String(dateValue);
        const parts = dateStr.split('T')[0].split('-');
        if (parts.length === 3) {
            return new Date(Date.UTC(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)));
        }
        return new Date(dateStr);
    }, []);


    /**
     * Calculates the page number where the new/updated item will appear
     * @param {Object} params - Calculation parameters
     * @param {Object} params.newItemData - New/updated item data
     * @param {string} params.entityId - ID of the entity (for update mode, to exclude from count)
     * @param {boolean} params.shouldRefreshList - Whether to refresh the list before calculation (for update mode)
     * @returns {Promise<number>} Page number (1-indexed)
     */
    const calculateTargetPage = useCallback(async ({ newItemData, entityId = null, shouldRefreshList = false }) => {
        // Refresh list if needed (for update mode when sort field changed)
        if (shouldRefreshList && listAction) {
            await dispatch(listAction());
            // Small delay to ensure Redux state is updated
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Get items from Redux store
        const items = getItemsFromStore(reduxSelector);
        
        // Debug logging
        console.log('calculateTargetPage - entityId:', entityId, 'newItemData:', newItemData);
        console.log('calculateTargetPage - Total items in store:', items.length);
        
        if (entityId) {
            const entityInList = items.find(item => String(item.id) === String(entityId));
            console.log('Entity in list?', !!entityInList, entityInList ? {id: entityInList.id, name: `${entityInList.firstName} ${entityInList.lastName}`} : null);
        } else {
            console.log('Create mode - newItemData:', newItemData);
        }

        // Sort items to match backend/DataTable order before filtering
        // This ensures we calculate based on the same sorted order as the table
        const sortedItems = [...items].sort((a, b) => {
            const itemA = a || {};
            const itemB = b || {};
            if (sortType === 'date') {
                const field = Array.isArray(sortFields) ? sortFields[0] : sortFields;
                const dateA = parseDate(itemA[field]);
                const dateB = parseDate(itemB[field]);
                return sortDirection === 'asc' 
                    ? dateA.getTime() - dateB.getTime()
                    : dateB.getTime() - dateA.getTime();
            } else {
                // String sorting
                const fieldsArray = Array.isArray(sortFields) ? sortFields : [sortFields];
                for (const field of fieldsArray) {
                    const valueA = ((itemA[field] || '').trim().toLowerCase());
                    const valueB = ((itemB[field] || '').trim().toLowerCase());
                    const compare = valueA.localeCompare(valueB);
                    if (compare !== 0) {
                        return sortDirection === 'asc' ? compare : -compare;
                    }
                }
                return 0;
            }
        });

        // Filter out the entity being edited (for update mode)
        // Convert both IDs to strings for consistent comparison (same as reducer)
        const itemsToCompare = entityId 
            ? sortedItems.filter(item => {
                if (!item || typeof item !== 'object') {
                    return false;
                }
                const itemId = String(item.id);
                const excludeId = String(entityId);
                return itemId !== excludeId;
            })
            : sortedItems.filter(item => item && typeof item === 'object');
            
        console.log('Items to compare (after sorting and exclusion):', itemsToCompare.length);

        // Count how many items come before the new/updated item
        let itemsBeforeNew = 0;
        if (Array.isArray(itemsToCompare)) {
            itemsBeforeNew = itemsToCompare.filter((item) => {
                if (!item || typeof item !== 'object') {
                    return false;
                }
                // Skip items that don't have the required sort field(s)
                if (sortType === 'date') {
                    const field = Array.isArray(sortFields) ? sortFields[0] : sortFields;
                    if (!item[field]) return false;
                } else {
                    const fieldsArray = Array.isArray(sortFields) ? sortFields : [sortFields];
                    if (fieldsArray.some(field => !item[field])) return false;
                }

                if (sortType === 'date') {
                    // Date comparison
                    const field = Array.isArray(sortFields) ? sortFields[0] : sortFields;
                    const itemDate = parseDate(item[field]);
                    const newDate = parseDate(newItemData[field]);
                    
                    if (sortDirection === 'desc') {
                        // For descending (newest first), items with date >= new date come before
                        return itemDate.getTime() >= newDate.getTime();
                    } else {
                        // For ascending (oldest first), items with date <= new date come before
                        return itemDate.getTime() <= newDate.getTime();
                    }
                } else {
                    // String comparison (alphabetical)
                    const fieldsArray = Array.isArray(sortFields) ? sortFields : [sortFields];
                    
                    for (const field of fieldsArray) {
                        const itemValue = (item[field] || '').trim().toLowerCase();
                        const newValue = (newItemData[field] || '').trim().toLowerCase();
                        const compare = itemValue.localeCompare(newValue);
                        
                        if (compare !== 0) {
                            if (sortDirection === 'asc') {
                                // For ascending, items < new value come before
                                return compare < 0;
                            } else {
                                // For descending, items > new value come before
                                return compare > 0;
                            }
                        }
                    }
                    // If all fields are equal, item doesn't come before
                    return false;
                }
            }).length;
        }

        // Calculate page number (1-indexed for URL)
        const pageNumber = Math.floor(itemsBeforeNew / pageLength) + 1;
        console.log('calculateTargetPage - itemsBeforeNew:', itemsBeforeNew, 'pageLength:', pageLength, 'calculated page:', pageNumber);
        return pageNumber;
    }, [listAction, reduxSelector, pageLength, sortType, sortDirection, sortFields, dispatch, getItemsFromStore, parseDate]);

    return { calculateTargetPage };
};

export default useCalculateTargetPage;

