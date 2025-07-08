import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getTermsConditions, saveTermsConditions } from '../../../store/actions/settingsActions';
import { useDispatch, useSelector } from 'react-redux';
import SettingsEditor from '../../../App/components/CkEditor/SettingsEditor';

const defaultContent = `
    <h2>Terms and Conditions</h2>
    <p>Welcome to <b>RGTechno!</b> By using our platform, you agree to the following terms...</p>
`;

const PrivacyPolicy = () => {
    const dispatch = useDispatch();
    const { termsConditions } = useSelector(state => state.settings);
    const [content, setContent] = useState(defaultContent);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Fetch existing terms and conditions on component mount
    useEffect(() => {
        fetchTermsConditions();
    }, []);

    // Update content when termsConditions data is loaded
    useEffect(() => {
        if (termsConditions && termsConditions.content) {
            setContent(termsConditions.content);
        }
    }, [termsConditions]);

    const fetchTermsConditions = async () => {
        try {
            await dispatch(getTermsConditions());
        } catch (error) {
            console.error('Error fetching terms and conditions:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await dispatch(saveTermsConditions(content));
        } catch (error) {
            console.error('Error saving terms and conditions:', error);
            toast.error('Failed to save Terms & Conditions. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleEditorChange = (event, editor) => {
        setContent(editor.getData());
    };

    if (initialLoading) {
        return (
            <div style={{ background: '#fff', borderRadius: 10, padding: 24 }}>
                <h1>Settings</h1>
                <div style={{ textAlign: 'center', padding: '50px' }}>Loading...</div>
            </div>
        );
    }

    return (
        <div style={{ background: '#fff', borderRadius: 10, padding: 24 }}>
            <h1>Settings</h1>
            <div style={{ marginTop: 24 }}>
                <label style={{ fontWeight: 600, fontSize: 18, marginBottom: 8, display: 'block' }}>Term & Conditions</label>
                
                <SettingsEditor
                    data={content}
                    onChange={handleEditorChange}
                    placeholder="Enter Terms & Conditions content..."
                />

                {/* Save Button */}
                <div style={{ marginTop: 20, textAlign: 'right' }}>
                    <button
                        onClick={handleSave}
                        disabled={loading}
                        style={{
                            background: loading ? '#ccc' : '#007bff',
                            color: 'white',
                            border: 'none',
                            padding: '12px 24px',
                            borderRadius: '6px',
                            fontSize: '16px',
                            fontWeight: '600',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            transition: 'background-color 0.3s ease'
                        }}
                    >
                        {loading ? 'Saving...' : 'Save Changes'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PrivacyPolicy;
