import React, { useRef, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const editorConfiguration = {
    toolbar: [
        'heading', '|',
        'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|',
        'fontSize', 'fontColor', 'fontBackgroundColor', '|',
        'bulletedList', 'numberedList', 'todoList', '|',
        'alignment', 'outdent', 'indent', '|',
        'link', 'blockQuote', 'insertTable', 'imageUpload', 'mediaEmbed', '|',
        'undo', 'redo', 'removeFormat', 'horizontalLine', 'specialCharacters', 'codeBlock', 'highlight', 'findAndReplace', 'selectAll', 'fullScreen'
    ],
    heading: {
        options: [
            { model: 'paragraph', title: 'Paragraph', class: 'ck-heading_paragraph' },
            { model: 'heading1', view: 'h1', title: 'Heading 1', class: 'ck-heading_heading1' },
            { model: 'heading2', view: 'h2', title: 'Heading 2', class: 'ck-heading_heading2' },
            { model: 'heading3', view: 'h3', title: 'Heading 3', class: 'ck-heading_heading3' },
            { model: 'heading4', view: 'h4', title: 'Heading 4', class: 'ck-heading_heading4' },
            { model: 'heading5', view: 'h5', title: 'Heading 5', class: 'ck-heading_heading5' },
            { model: 'heading6', view: 'h6', title: 'Heading 6', class: 'ck-heading_heading6' }
        ]
    },
    fontSize: {
        options: [
            10, 12, 14, 'default', 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52, 54, 56, 58, 60, 62, 64, 66, 68, 70, 72
        ]
    }
};

const SettingsEditor = ({ data, onChange, placeholder = "Enter content here..." }) => {
    const editorRef = useRef(null);

    // Suppress ResizeObserver and CKEditor destroy errors
    useEffect(() => {
        const errorHandler = (event) => {
            const message = event.message || event.error?.message || event.error?.toString() || '';
            const stack = event.error?.stack || '';
            
            // Suppress ResizeObserver errors
            if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
                event.preventDefault();
                event.stopPropagation();
                return true;
            }
            
            // Suppress CKEditor destroy errors - check multiple variations
            if (
                message.includes("Cannot read properties of null (reading 'destroy')") ||
                message.includes("reading 'destroy'") ||
                (message.includes("destroy") && message.includes("null") && message.includes("reading")) ||
                stack.includes('_destructor')
            ) {
                event.preventDefault();
                event.stopPropagation();
                return true;
            }
            
            return false;
        };

        const rejectionHandler = (event) => {
            const message = event.reason?.message || event.reason?.toString() || '';
            const stack = event.reason?.stack || '';
            
            // Suppress ResizeObserver errors
            if (message.includes('ResizeObserver loop completed with undelivered notifications')) {
                event.preventDefault();
                return true;
            }
            
            // Suppress CKEditor destroy errors
            if (
                message.includes("Cannot read properties of null (reading 'destroy')") ||
                message.includes("reading 'destroy'") ||
                (message.includes("destroy") && message.includes("null") && message.includes("reading")) ||
                stack.includes('_destructor')
            ) {
                event.preventDefault();
                return true;
            }
            
            return false;
        };

        // Add error handler at capture phase for better catching
        window.addEventListener('error', errorHandler, true);
        window.addEventListener('unhandledrejection', rejectionHandler);

        return () => {
            window.removeEventListener('error', errorHandler, true);
            window.removeEventListener('unhandledrejection', rejectionHandler);
        };
    }, []);

    // Cleanup editor reference on unmount
    // Note: CKEditor's React wrapper handles editor destruction automatically
    useEffect(() => {
        return () => {
            // Just clear the reference - let CKEditor handle the actual destruction
            editorRef.current = null;
        };
    }, []);

    const handleReady = (editor) => {
        // Store editor instance only if it's valid
        if (editor) {
            editorRef.current = editor;
        }
    };

    const handleError = (error, { willEditorRestart }) => {
        // Clear reference if editor will restart
        if (willEditorRestart) {
            editorRef.current = null;
        }
        
        // Suppress destroy-related errors silently
        const errorMessage = error?.message || error?.toString() || '';
        if (
            errorMessage.includes("Cannot read properties of null (reading 'destroy')") ||
            errorMessage.includes("reading 'destroy'") ||
            errorMessage.includes('_destructor')
        ) {
            // Silently ignore - this is expected during unmount/remount cycles
            return;
        }
        
        // For other errors, you might want to log them in development
        if (process.env.NODE_ENV === 'development' && !errorMessage.includes('destroy')) {
            console.warn('CKEditor error:', error);
        }
    };

    return (
        <CKEditor
            editor={ClassicEditor}
            config={editorConfiguration}
            data={data}
            onChange={onChange}
            onReady={handleReady}
            onError={handleError}
            placeholder={placeholder}
        />
    );
};

export default SettingsEditor; 