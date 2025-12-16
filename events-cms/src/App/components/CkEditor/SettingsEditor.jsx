import React, { useRef, useEffect } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const editorConfiguration = {
    toolbar: [
        'heading', '|',
        'bold', 'italic', '|',
        'bulletedList', 'numberedList', '|',
        'outdent', 'indent', '|',
        'link', 'blockQuote', 'insertTable', 'imageUpload', 'mediaEmbed', '|',
        'undo', 'redo', 'selectAll'
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
    }
};

const SettingsEditor = ({ data, onChange, placeholder = "Enter content here..." }) => {
    const editorRef = useRef(null);


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

    return (
        <CKEditor
            editor={ClassicEditor}
            config={editorConfiguration}
            data={data}
            onChange={onChange}
            onReady={handleReady}
            // onError={handleError}
            placeholder={placeholder}
        />
    );
};

export default SettingsEditor; 