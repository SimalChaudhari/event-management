import React from 'react';
import { Button } from 'react-bootstrap';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import '../css/pagination.css';

const PaginationsComponent = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    indexOfFirstItem,
    indexOfLastItem,
    showInfo = true,
    className = ''
}) => {
    // Helper function to generate PaginationsComponent items
    const getPaginationItems = (currentPage, totalPages) => {
        const items = [];
        const maxVisible = 5; // Maximum visible page numbers
        
        if (totalPages <= maxVisible) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                items.push(i);
            }
        } else {
            // Always show first page
            items.push(1);
            
            if (currentPage <= 3) {
                // Show first 3 pages + ellipsis + last page
                items.push(2, 3);
                if (totalPages > 4) {
                    items.push('...');
                }
                items.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Show first page + ellipsis + last 3 pages
                items.push('...');
                items.push(totalPages - 2, totalPages - 1, totalPages);
            } else {
                // Show first page + ellipsis + current page + ellipsis + last page
                items.push('...');
                items.push(currentPage);
                items.push('...');
                items.push(totalPages);
            }
        }
        
        return items;
    };

    const handlePageChange = (pageNumber) => {
        onPageChange(pageNumber);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    if (totalPages <= 1) {
        return null;
    }

    return (
        <div className={`datatable-pagination-container mt-4 ${className}`}>
            <div className="row">
                {showInfo && (
                    <div className="col-sm-12 col-md-5">
                        <div className="dataTables_info">
                            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, totalItems)} of {totalItems} items
                        </div>
                    </div>
                )}
                <div className={`col-sm-12 ${showInfo ? 'col-md-7' : 'col-md-12'}`}>
                    <div className="dataTables_paginate paging_simple_numbers">
                        <ul className="pagination">
                            <li className={`paginate_button previous ${currentPage === 1 ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                >
                                    <FaChevronLeft className="me-1" />
                                    Previous
                                </button>
                            </li>
                            
                            {getPaginationItems(currentPage, totalPages).map((item, index) => (
                                <li key={index} className={`paginate_button ${item === currentPage ? 'active' : ''} ${item === '...' ? 'disabled' : ''}`}>
                                    <button 
                                        className="page-link"
                                        onClick={() => item !== '...' ? handlePageChange(item) : null}
                                        disabled={item === '...'}
                                        style={item === '...' ? { cursor: 'default', border: 'none', background: 'transparent' } : {}}
                                    >
                                        {item}
                                    </button>
                                </li>
                            ))}

                            <li className={`paginate_button next ${currentPage === totalPages ? 'disabled' : ''}`}>
                                <button 
                                    className="page-link" 
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                >
                                    Next
                                    <FaChevronRight className="ms-1" />
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaginationsComponent;