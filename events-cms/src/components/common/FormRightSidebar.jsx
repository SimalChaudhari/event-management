import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Button } from 'react-bootstrap';
import '../../assets/css/form-right-sidebar.css';

/**
 * Sliding panel from the right edge (overlay + panel).
 * Rendered via portal so nested sidebars do not submit parent <form> elements.
 */
const FormRightSidebar = ({
    show,
    onHide,
    title,
    children,
    footer,
    width = 520,
    closeOnOverlayClick = true
}) => {
    useEffect(() => {
        if (!show) return undefined;
        const prev = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = prev;
        };
    }, [show]);

    if (!show) return null;

    const panelStyle = { width: typeof width === 'number' ? `${width}px` : width };

    const sidebar = (
        <div className="form-right-sidebar form-right-sidebar--open">
            <div
                className="form-right-sidebar__overlay"
                onClick={closeOnOverlayClick ? onHide : undefined}
                role="presentation"
                aria-hidden="true"
            />
            <div
                className="form-right-sidebar__panel"
                style={panelStyle}
                role="dialog"
                aria-modal="true"
                aria-labelledby="form-right-sidebar-title"
            >
                <div className="form-right-sidebar__header">
                    <h5 id="form-right-sidebar-title" className="form-right-sidebar__title mb-0">
                        {title}
                    </h5>
                    <Button
                        type="button"
                        variant="link"
                        className="form-right-sidebar__close p-0 text-muted"
                        onClick={onHide}
                        aria-label="Close"
                    >
                        <i className="feather icon-x" style={{ fontSize: '20px' }} />
                    </Button>
                </div>
                <div className="form-right-sidebar__body">{children}</div>
                {footer != null && <div className="form-right-sidebar__footer">{footer}</div>}
            </div>
        </div>
    );

    return createPortal(sidebar, document.body);
};

export default FormRightSidebar;
