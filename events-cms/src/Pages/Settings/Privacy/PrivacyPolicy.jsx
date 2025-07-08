import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { getPrivacyPolicy, savePrivacyPolicy } from '../../../store/actions/settingsActions';
import { useDispatch, useSelector } from 'react-redux';
import SettingsEditor from '../../../App/components/CkEditor/SettingsEditor';

const defaultContent = `
    <h2>Privacy Policy</h2>
    <p>Welcome to <b>RGTechno!</b> This Privacy Policy describes how we collect, use, and protect your information...</p>
`;

const PrivacyPolicy = () => {
    const dispatch = useDispatch();
    const { privacyPolicy } = useSelector(state => state.settings);
    const [content, setContent] = useState(defaultContent);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Fetch existing privacy policy on component mount
    useEffect(() => {
        fetchPrivacyPolicy();
    }, []);

    // Update content when privacyPolicy data is loaded
    useEffect(() => {
        if (privacyPolicy && privacyPolicy.content) {
            setContent(privacyPolicy.content);
        }
    }, [privacyPolicy]);

    const fetchPrivacyPolicy = async () => {
        try {
            await dispatch(getPrivacyPolicy());
        } catch (error) {
            console.error('Error fetching privacy policy:', error);
        } finally {
            setInitialLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            await dispatch(savePrivacyPolicy(content));
        } catch (error) {
            console.error('Error saving privacy policy:', error);
            toast.error('Failed to save Privacy Policy. Please try again.');
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
                <label style={{ fontWeight: 600, fontSize: 18, marginBottom: 8, display: 'block' }}>Privacy Policy</label>
                
                <SettingsEditor
                    data={content}
                    onChange={handleEditorChange}
                    placeholder="Enter Privacy Policy content..."
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