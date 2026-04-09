import React, { useState, useRef, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { getCountries } from '../../store/actions/eventActions';

const CountrySelect = ({ 
    name = 'country', 
    value = '', 
    onChange, 
    className = 'form-control',
    id = 'country',
    placeholder = 'Select Country',
    required = false,
    disabled = false
}) => {
    const dispatch = useDispatch();
    const [countryList, setCountryList] = useState([]);
    const [isLoadingCountries, setIsLoadingCountries] = useState(false);
    const fetchingCountriesRef = useRef(false);
    const countriesLoadedRef = useRef(false);
    const selectRef = useRef(null);

    // Fetch countries function - called only when dropdown is focused
    const fetchCountries = useCallback(async () => {
        // Check refs to prevent multiple API calls
        if (fetchingCountriesRef.current) return;
        if (countriesLoadedRef.current) return;

        fetchingCountriesRef.current = true;
        setIsLoadingCountries(true);
        try {
            const countries = await dispatch(getCountries());
            const countriesList = Array.isArray(countries) ? countries : [];
            // Sort countries alphabetically for better UX
            countriesList.sort((a, b) => {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                return nameA.localeCompare(nameB);
            });
            setCountryList(countriesList);
            countriesLoadedRef.current = true;
        } catch (error) {
            console.error('Error fetching countries:', error);
            countriesLoadedRef.current = true;
        } finally {
            setIsLoadingCountries(false);
            fetchingCountriesRef.current = false;
        }
    }, [dispatch]);

    // Handle country dropdown mouse down - fetch countries when user clicks (before dropdown opens)
    const handleCountryDropdownMouseDown = (e) => {
        // If countries are not loaded yet, fetch them
        // This happens when user clicks, allowing dropdown to open smoothly
        if (!countriesLoadedRef.current && !fetchingCountriesRef.current) {
            // Fetch countries asynchronously - don't prevent dropdown from opening
            // Use setTimeout to ensure dropdown opens first, then fetch
            setTimeout(() => {
                fetchCountries();
            }, 0);
        }
    };

    const handleChange = (e) => {
        // Direct onChange call - no delays, immediate update
        if (onChange) {
            onChange(e);
        }
    };

    return (
        <>
            <div className="position-relative">
                <select
                    ref={selectRef}
                    id={id}
                    name={name}
                    className={className}
                    value={value}
                    onChange={handleChange}
                    onMouseDown={handleCountryDropdownMouseDown}
                    disabled={disabled}
                    required={required}
                    style={{ 
                        cursor: 'pointer',
                        paddingRight: isLoadingCountries ? '40px' : '10px',
                        minHeight: '38px',
                        transition: 'none'
                    }}
                >
                    <option value="" disabled={!isLoadingCountries && countryList.length === 0}>
                        {isLoadingCountries ? 'Loading countries...' : placeholder}
                    </option>
                    {countryList.map((country, index) => {
                        const countryCode = country.code || country.name || `country-${index}`;
                        const countryName = country.name || '';
                        if (!countryName) return null;
                        return (
                            <option key={countryCode} value={countryName}>
                                {countryName}
                            </option>
                        );
                    })}
                    {!isLoadingCountries && countryList.length === 0 && (
                        <option value="" disabled>No countries available</option>
                    )}
                </select>
                {isLoadingCountries && (
                    <div 
                        className="position-absolute" 
                        style={{ 
                            right: '10px', 
                            top: '50%', 
                            transform: 'translateY(-50%)', 
                            pointerEvents: 'none', 
                            zIndex: 10 
                        }}
                    >
                        <i 
                            className="feather icon-loader" 
                            style={{ 
                                animation: 'spin 1s linear infinite', 
                                fontSize: '14px',
                                color: '#4680ff'
                            }}
                        ></i>
                    </div>
                )}
            </div>
            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                #${id} {
                    appearance: auto;
                    -webkit-appearance: menulist;
                    -moz-appearance: menulist;
                }
                #${id}:focus {
                    border-color: inherit;
                    box-shadow: none;
                    outline: none;
                }
                #${id}:active {
                    border-color: inherit;
                    box-shadow: none;
                    outline: none;
                }
            `}</style>
        </>
    );
};

export default CountrySelect;

