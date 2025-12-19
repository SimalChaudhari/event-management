import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Form } from 'react-bootstrap';

const SearchableDropdown = ({
    label,
    name,
    value,
    onChange,
    options = [],
    onLoadMore,
    hasMore = false,
    loading = false,
    placeholder = 'Select...',
    displayKey = 'name',
    valueKey = 'id',
    searchPlaceholder = 'Search...',
    required = false,
    disabled = false,
    onOpen,
    onSearch,
    showSearchBox = true // Show search box by default
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredOptions, setFilteredOptions] = useState([]);
    const dropdownRef = useRef(null);
    const searchInputRef = useRef(null);
    const listRef = useRef(null);
    const loadingRef = useRef(false);
    const searchTimeoutRef = useRef(null);
    const hasOpenedRef = useRef(false);
    const lastSearchTermRef = useRef('');

    // Filter options based on search term (client-side if no onSearch callback)
    useEffect(() => {
        if (onSearch) {
            // Backend search - use all options as filtered (backend handles filtering)
            setFilteredOptions(options);
        } else {
            // Client-side filtering
            if (searchTerm) {
                const filtered = options.filter(option => {
                    const displayValue = typeof displayKey === 'function' 
                        ? displayKey(option) 
                        : option[displayKey];
                    return displayValue?.toLowerCase().includes(searchTerm.toLowerCase());
                });
                setFilteredOptions(filtered);
            } else {
                setFilteredOptions(options);
            }
        }
    }, [options, searchTerm, displayKey, onSearch]);

    // Handle search with debounce for backend search
    useEffect(() => {
        if (!onSearch || !isOpen || !showSearchBox) return;
        
        // Prevent duplicate calls for the same search term
        if (searchTerm === lastSearchTermRef.current) {
            return;
        }
        
        // Clear previous timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }
        
        // Update last search term
        lastSearchTermRef.current = searchTerm;
        
        // Debounce search - wait 500ms after user stops typing
        searchTimeoutRef.current = setTimeout(() => {
            onSearch(searchTerm);
        }, 500);

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchTerm, onSearch, isOpen, showSearchBox]);

    // Handle infinite scroll
    const handleScroll = useCallback(() => {
        if (!listRef.current || loadingRef.current || !hasMore || loading) return;

        const { scrollTop, scrollHeight, clientHeight } = listRef.current;
        const scrollPercentage = (scrollTop + clientHeight) / scrollHeight;

        // Load more when scrolled to 80% of the list
        if (scrollPercentage > 0.8) {
            loadingRef.current = true;
            onLoadMore?.().finally(() => {
                loadingRef.current = false;
            });
        }
    }, [hasMore, loading, onLoadMore]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                handleClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            // Focus search input when dropdown opens
            setTimeout(() => {
                searchInputRef.current?.focus();
            }, 100);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const handleSelect = (option) => {
        const optionValue = option[valueKey];
        onChange({
            target: {
                name,
                value: optionValue
            }
        });
        handleClose();
    };

    const handleToggle = (e) => {
        if (disabled) return;
        e?.preventDefault?.();
        e?.stopPropagation?.();
        
        // Always open on click, don't toggle if already open
        if (!isOpen && !hasOpenedRef.current) {
            hasOpenedRef.current = true;
            setIsOpen(true);
            // Call onOpen callback when dropdown opens (only once)
            onOpen?.();
        }
    };

    const handleClose = () => {
        setIsOpen(false);
        setSearchTerm('');
        hasOpenedRef.current = false; // Reset so it can open again
        lastSearchTermRef.current = ''; // Reset last search term
        // Clear any pending search timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
            searchTimeoutRef.current = null;
        }
    };

    const selectedOption = options.find(opt => opt[valueKey] === value);
    const displayValue = selectedOption 
        ? (typeof displayKey === 'function' ? displayKey(selectedOption) : selectedOption[displayKey])
        : '';

    return (
        <div className="form-group fill" ref={dropdownRef}>
            <label className="floating-label" htmlFor={name}>
                {label}
            </label>
            <div className="position-relative">
                <input
                    type="text"
                    className="form-control"
                    name={name}
                    value={displayValue}
                    readOnly
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggle(e);
                    }}
                    onFocus={(e) => {
                        // Only handle focus if not already opened by click
                        // This prevents double API calls
                        if (!isOpen && !hasOpenedRef.current) {
                            e.preventDefault();
                            handleToggle(e);
                        }
                    }}
                    placeholder={placeholder}
                    required={required}
                    disabled={disabled}
                    style={{ 
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        paddingRight: '30px',
                        backgroundColor: disabled ? '#e9ecef' : '#fff'
                    }}
                />
                <i 
                    className={`fas fa-chevron-${isOpen ? 'up' : 'down'}`}
                    style={{
                        position: 'absolute',
                        right: '15px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        pointerEvents: 'none',
                        color: '#6c757d',
                        fontSize: '12px'
                    }}
                />
                
                {isOpen && (
                    <div 
                        className="border rounded bg-white"
                        style={{
                            position: 'absolute',
                            top: '100%',
                            left: 0,
                            right: 0,
                            zIndex: 1000,
                            maxHeight: '300px',
                            overflow: 'hidden',
                            display: 'flex',
                            flexDirection: 'column',
                            marginTop: '2px',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                        }}
                    >
                            {/* Search Input - Only show if showSearchBox is true */}
                            {showSearchBox && (
                                <div className="p-2 border-bottom" style={{ backgroundColor: '#f8f9fa', position: 'relative' }}>
                                    <Form.Control
                                        ref={searchInputRef}
                                        type="text"
                                        placeholder={searchPlaceholder}
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{ fontSize: '14px', paddingRight: searchTerm ? '35px' : '12px' }}
                                    />
                                    {searchTerm && (
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setSearchTerm('');
                                                lastSearchTermRef.current = ''; // Reset last search term
                                                onSearch?.(''); // Clear search on backend
                                            }}
                                            style={{
                                                position: 'absolute',
                                                right: '20px',
                                                top: '50%',
                                                transform: 'translateY(-50%)',
                                                background: 'transparent',
                                                border: 'none',
                                                cursor: 'pointer',
                                                padding: '4px 8px',
                                                color: '#6c757d',
                                                fontSize: '16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.target.style.color = '#dc3545';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.target.style.color = '#6c757d';
                                            }}
                                        >
                                            <i className="fas fa-times"></i>
                                        </button>
                                    )}
                                </div>
                            )}

                        {/* Options List */}
                        <div
                            ref={listRef}
                            onScroll={handleScroll}
                            style={{
                                overflowY: 'auto',
                                maxHeight: '250px'
                            }}
                        >
                            {filteredOptions.length === 0 && !loading && (
                                <div className="p-3 text-center text-muted" style={{ fontSize: '14px' }}>
                                    No options found
                                </div>
                            )}
                            
                            {filteredOptions.map((option) => {
                                const optionValue = option[valueKey];
                                const optionDisplay = typeof displayKey === 'function' 
                                    ? displayKey(option) 
                                    : option[displayKey];
                                const isSelected = value === optionValue;

                                return (
                                    <div
                                        key={optionValue}
                                        onClick={() => handleSelect(option)}
                                        style={{
                                            padding: '8px 12px',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? '#e7f3ff' : 'transparent',
                                            borderBottom: '1px solid #f0f0f0',
                                            fontSize: '14px',
                                            color: '#333'
                                        }}
                                        onMouseEnter={(e) => {
                                            if (!isSelected) {
                                                e.target.style.backgroundColor = '#f8f9fa';
                                            }
                                        }}
                                        onMouseLeave={(e) => {
                                            if (!isSelected) {
                                                e.target.style.backgroundColor = 'transparent';
                                            }
                                        }}
                                    >
                                        {optionDisplay}
                                    </div>
                                );
                            })}
                            
                            {/* Loading indicator - only spinner, no text */}
                            {loading && (
                                <div className="p-3 text-center">
                                    <div className="spinner-border spinner-border-sm text-primary" role="status">
                                      
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchableDropdown;

