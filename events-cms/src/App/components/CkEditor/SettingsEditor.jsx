import React from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

const editorConfiguration = {
    toolbar: [
        'heading', '|',
        'bold', 'italic', 'underline', 'strikethrough', 'subscript', 'superscript', '|',
        'fontFamily', 'fontSize', 'fontColor', 'fontBackgroundColor', '|',
        'bulletedList', 'numberedList', 'todoList', '|',
        'alignment', 'outdent', 'indent', '|',
        'link', 'blockQuote', 'insertTable', 'imageUpload', 'mediaEmbed', '|',
        'undo', 'redo', 'removeFormat', 'horizontalLine', 'specialCharacters', 'codeBlock', 'highlight', 'findAndReplace', 'selectAll', 'fullScreen'
    ],
    fontFamily: {
        options: [
            'default',
            'Prama, cursive',
            'Arial, Helvetica, sans-serif',
            'Poppins, sans-serif',
            'Times New Roman, Times, serif',
            'Courier New, Courier, monospace'
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