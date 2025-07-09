import React from 'react';
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
    return (
        <CKEditor
            editor={ClassicEditor}
            config={editorConfiguration}
            data={data}
            onChange={onChange}
            placeholder={placeholder}
        />
    );
};

export default SettingsEditor; 