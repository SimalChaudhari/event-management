/**
 * Reusable function to render animated publish dates for DataTables
 * Can be used in any table component that displays events
 * 
 * @param {Object} row - Event row data object
 * @returns {string} HTML string for the publish dates badge
 */
export function renderPublishDates(row) {
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            return `${date.getDate()} ${monthNames[date.getMonth()]} ${date.getFullYear()}`;
        } catch (e) {
            return '';
        }
    };

    const publishStart = formatDate(row.publishStartDate);
    const publishEnd = formatDate(row.publishEndDate);

    if (!publishStart && !publishEnd) {
        return '<span class="text-muted" style="font-style: italic;">Not Set</span>';
    }

    // Add CSS animations if not already added (using jQuery if available, or vanilla JS)
    // eslint-disable-next-line no-undef
    if (typeof window !== 'undefined' && typeof window.$ !== 'undefined' && !window.$('#publish-dates-animations').length) {
        // eslint-disable-next-line no-undef
        window.$('<style id="publish-dates-animations">')
            .text(`
                @keyframes fadeInUp {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                @keyframes pulseGlow {
                    0%, 100% {
                        box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
                        transform: scale(1);
                    }
                    50% {
                        box-shadow: 0 4px 16px rgba(102, 126, 234, 0.6);
                        transform: scale(1.02);
                    }
                }
                @keyframes rotateIcon {
                    0% { transform: rotate(0deg); }
                    25% { transform: rotate(-5deg); }
                    50% { transform: rotate(0deg); }
                    75% { transform: rotate(5deg); }
                    100% { transform: rotate(0deg); }
                }
                .publish-date-container {
                    animation: fadeInUp 0.6s ease-out;
                }
                .publish-date-container:hover {
                    transform: scale(1.05) !important;
                    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
                }
            `)
            .appendTo('head');
    } else if (typeof document !== 'undefined' && !document.getElementById('publish-dates-animations')) {
        // Fallback for vanilla JS if jQuery is not available
        const style = document.createElement('style');
        style.id = 'publish-dates-animations';
        style.textContent = `
            @keyframes fadeInUp {
                from {
                    opacity: 0;
                    transform: translateY(10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes pulseGlow {
                0%, 100% {
                    box-shadow: 0 2px 8px rgba(102, 126, 234, 0.4);
                    transform: scale(1);
                }
                50% {
                    box-shadow: 0 4px 16px rgba(102, 126, 234, 0.6);
                    transform: scale(1.02);
                }
            }
            @keyframes rotateIcon {
                0% { transform: rotate(0deg); }
                25% { transform: rotate(-5deg); }
                50% { transform: rotate(0deg); }
                75% { transform: rotate(5deg); }
                100% { transform: rotate(0deg); }
            }
            .publish-date-container {
                animation: fadeInUp 0.6s ease-out;
            }
            .publish-date-container:hover {
                transform: scale(1.05) !important;
                box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5) !important;
            }
        `;
        document.head.appendChild(style);
    }

    // Format: "Date: 21 Nov 2025 - 30 Nov 2025"
    let dateText = '';
    if (publishStart && publishEnd) {
        dateText = `${publishStart} - ${publishEnd}`;
    } else if (publishStart) {
        dateText = `${publishStart}`;
    } else if (publishEnd) {
        dateText = `${publishEnd}`;
    }

    return `
        <div class="publish-date-container" style="
            display: inline-flex;
            align-items: center;
            padding: 6px 12px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            border-radius: 20px;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
            transition: all 0.3s ease;
            animation: pulseGlow 2s ease-in-out infinite;
        ">
            <i class="feather icon-calendar mr-1" style="
                color: white;
                font-size: 12px;
                animation: rotateIcon 3s linear infinite;
            "></i>
            <span style="
                color: white;
                font-size: 11px;
                font-weight: 500;
            ">
                ${dateText}
            </span>
        </div>
    `;
}

