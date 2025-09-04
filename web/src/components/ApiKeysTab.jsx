import React, { useState, useEffect } from 'react';
import { useServers } from '../contexts/ServerContext';

const ApiKeysTab = () => {
    const { getApiKeys, generateApiKey, deleteApiKey, bootstrapApiKey } = useServers();
    const [apiKeys, setApiKeys] = useState([]);
    const [newKeyName, setNewKeyName] = useState('');
    const [newKeyDescription, setNewKeyDescription] = useState('');
    const [generatedKey, setGeneratedKey] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');

    useEffect(() => {
        loadApiKeys();
    }, []);

    const loadApiKeys = async () => {
        setLoading(true);
        const result = await getApiKeys();
        if (result.success) {
            setApiKeys(result.data.entities);
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleGenerateKey = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setMessage('');
        setGeneratedKey(null);

        const result = await generateApiKey(newKeyName, newKeyDescription);
        if (result.success) {
            setGeneratedKey(result.data.api_key);
            setMessage('API Key generated successfully. Please copy it now, you will not be able to see it again.');
            setNewKeyName('');
            setNewKeyDescription('');
            loadApiKeys();
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleBootstrapKey = async () => {
        setLoading(true);
        setError('');
        setMessage('');
        setGeneratedKey(null);

        const result = await bootstrapApiKey();
        if (result.success) {
            setGeneratedKey(result.data.api_key);
            setMessage('Bootstrap API Key generated successfully. Please copy it now.');
            loadApiKeys();
        } else {
            setError(result.message);
        }
        setLoading(false);
    };

    const handleDeleteKey = async (id) => {
        if (window.confirm('Are you sure you want to delete this API key? This action cannot be undone.')) {
            setLoading(true);
            setError('');
            setMessage('');

            const result = await deleteApiKey(id);
            if (result.success) {
                setMessage('API Key deleted successfully.');
                loadApiKeys();
            } else {
                setError(result.message);
            }
            setLoading(false);
        }
    };

    return (
        <div>
            {error && <div className="notification is-danger">{error}</div>}
            {message && <div className="notification is-success">{message}</div>}
            {generatedKey && (
                <div className="modal is-active">
                    <div className="modal-background" onClick={() => setGeneratedKey(null)}></div>
                    <div className="modal-card">
                        <header className="modal-card-head">
                            <p className="modal-card-title">API Key</p>
                            <button className="delete" aria-label="close" onClick={() => setGeneratedKey(null)}></button>
                        </header>
                        <section className="modal-card-body">
                            <pre>{generatedKey}</pre>
                        </section>
                        <footer className="modal-card-foot">
                            <button className="button" onClick={() => setGeneratedKey(null)}>Close</button>
                        </footer>
                    </div>
                </div>
            )}

            <div className="box">
                <h4 className="title is-4">Generate New API Key</h4>
                <form onSubmit={handleGenerateKey}>
                    <div className="field">
                        <label className="label">Name</label>
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                value={newKeyName}
                                onChange={(e) => setNewKeyName(e.target.value)}
                                placeholder="e.g., My-App"
                                required
                            />
                        </div>
                    </div>
                    <div className="field">
                        <label className="label">Description</label>
                        <div className="control">
                            <input
                                className="input"
                                type="text"
                                value={newKeyDescription}
                                onChange={(e) => setNewKeyDescription(e.target.value)}
                                placeholder="e.g., API access for my application"
                            />
                        </div>
                    </div>
                    <div className="field is-grouped">
                        <div className="control">
                            <button type="submit" className="button is-primary" disabled={loading}>
                                {loading ? 'Generating...' : 'Generate Key'}
                            </button>
                        </div>
                        <div className="control">
                            <button type="button" className="button is-warning" onClick={handleBootstrapKey} disabled={loading}>
                                Generate Bootstrap Key
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            <div className="box">
                <h4 className="title is-4">Existing API Keys</h4>
                {loading && <p>Loading keys...</p>}
                <div className="table-container">
                    <table className="table is-fullwidth is-striped">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Description</th>
                                <th>Active</th>
                                <th>Last Used</th>
                                <th>Created At</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {apiKeys.map(key => (
                                <tr key={key.id}>
                                    <td>{key.name}</td>
                                    <td>{key.description}</td>
                                    <td>
                                        <span className={`tag ${key.is_active ? 'is-success' : 'is-danger'}`}>
                                            {key.is_active ? 'Yes' : 'No'}
                                        </span>
                                    </td>
                                    <td>{key.last_used ? new Date(key.last_used).toLocaleString() : 'Never'}</td>
                                    <td>{new Date(key.created_at).toLocaleString()}</td>
                                    <td>
                                        <div className="buttons">
                                            <button
                                                className="button is-primary is-small"
                                                onClick={() => {
                                                    setGeneratedKey(key.api_key);
                                                }}
                                            >
                                                <span className="icon is-small">
                                                    <i className="fas fa-eye"></i>
                                                </span>
                                                <span>View</span>
                                            </button>
                                            <button
                                                className="button is-danger is-small"
                                                onClick={() => handleDeleteKey(key.id)}
                                                disabled={loading}
                                            >
                                                <span className="icon is-small">
                                                    <i className="fas fa-trash"></i>
                                                </span>
                                                <span>Delete</span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ApiKeysTab;
