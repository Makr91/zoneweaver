import { useState, useEffect } from 'react';
import FormModal from '../../common/FormModal';
import { isTextFile } from './FileManagerTransforms';

/**
 * Text File Editor Modal Component
 * Provides a modal interface for editing text files
 */
const TextFileEditor = ({ file, api, onClose, onSave }) => {
  const [content, setContent] = useState('');
  const [originalContent, setOriginalContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load file content on mount
  useEffect(() => {
    loadFileContent();
  }, [file]);

  // Track changes
  useEffect(() => {
    setHasChanges(content !== originalContent);
  }, [content, originalContent]);

  const loadFileContent = async () => {
    if (!file || !isTextFile(file)) {
      setError('This file cannot be edited as text');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.getFileContent(file);
      
      if (result.success && result.data) {
        const fileContent = result.data.content || '';
        setContent(fileContent);
        setOriginalContent(fileContent);
      } else {
        setError(result.message || 'Failed to load file content');
      }
    } catch (error) {
      console.error('Error loading file content:', error);
      setError('Failed to load file content: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!hasChanges) {
      onClose();
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onSave(content);
      // onSave will handle closing the modal and error handling
    } catch (error) {
      console.error('Error saving file:', error);
      setError('Failed to save file: ' + error.message);
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasChanges) {
      const confirmClose = window.confirm(
        'You have unsaved changes. Are you sure you want to close without saving?'
      );
      if (!confirmClose) return;
    }
    
    onClose();
  };

  const handleContentChange = (e) => {
    setContent(e.target.value);
  };

  // Get file size info
  const getFileSizeInfo = () => {
    const bytes = new Blob([content]).size;
    if (bytes > 100 * 1024 * 1024) { // 100MB limit for text editing
      return {
        warning: true,
        message: 'File size exceeds 100MB. Large files may cause performance issues.'
      };
    }
    return { warning: false, message: '' };
  };

  const sizeInfo = getFileSizeInfo();

  return (
    <FormModal
      isOpen={true}
      onClose={handleClose}
      onSubmit={handleSave}
      title={`Edit: ${file?.name || 'Unknown File'}`}
      icon="fas fa-edit"
      submitText={hasChanges ? 'Save Changes' : 'Close'}
      submitVariant={hasChanges ? 'is-primary' : 'is-info'}
      submitIcon={hasChanges ? 'fas fa-save' : null}
      loading={loading}
      disabled={false}
      showCancelButton={hasChanges}
      cancelText="Cancel"
      className="is-large"
    >
      <div className="field">
        {/* File info */}
        <div className="notification mb-4">
          <div className="columns is-mobile">
            <div className="column">
              <strong>File:</strong> {file?.path || 'Unknown'}
            </div>
            <div className="column">
              <strong>Size:</strong> {file?.size ? `${Math.round(file.size / 1024)} KB` : 'Unknown'}
            </div>
            <div className="column">
              <strong>Modified:</strong> {file?.updatedAt ? new Date(file.updatedAt).toLocaleString() : 'Unknown'}
            </div>
          </div>
          
          {hasChanges && (
            <div className="notification is-warning is-small mt-2">
              <strong>Unsaved Changes:</strong> You have made changes to this file.
            </div>
          )}
        </div>

        {/* Size warning */}
        {sizeInfo.warning && (
          <div className="notification is-warning mb-4">
            <strong>Warning:</strong> {sizeInfo.message}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="notification is-danger mb-4">
            <button className="delete is-small" onClick={() => setError('')}></button>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Content editor */}
        <label className="label">File Content</label>
        <div className="control">
          <textarea
            className="textarea"
            rows="25"
            value={content}
            onChange={handleContentChange}
            placeholder="File content will appear here..."
            disabled={loading || !!error}
            style={{
              fontFamily: 'Monaco, Menlo, "Ubuntu Mono", monospace',
              fontSize: '13px',
              lineHeight: '1.4'
            }}
          />
        </div>
        
        {/* Content stats */}
        <p className="help">
          Lines: {content.split('\n').length} | 
          Characters: {content.length} | 
          Size: ~{Math.round(new Blob([content]).size / 1024)} KB
        </p>
      </div>

      {/* Keyboard shortcuts help */}
      <div className="field">
        <div className="notification is-info">
          <div className="content is-small">
            <strong>Keyboard Shortcuts:</strong><br />
            <div className="columns is-mobile">
              <div className="column">
                <kbd>Ctrl</kbd> + <kbd>S</kbd> - Save<br />
                <kbd>Ctrl</kbd> + <kbd>Z</kbd> - Undo
              </div>
              <div className="column">
                <kbd>Ctrl</kbd> + <kbd>Y</kbd> - Redo<br />
                <kbd>Ctrl</kbd> + <kbd>A</kbd> - Select All
              </div>
              <div className="column">
                <kbd>Ctrl</kbd> + <kbd>F</kbd> - Find<br />
                <kbd>Tab</kbd> - Insert tab
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File type detection info */}
      {file?._zwMetadata && (
        <div className="field">
          <div className="notification is-small">
            <div className="columns is-mobile is-vcentered">
              <div className="column">
                <strong>Detected Type:</strong> {file._zwMetadata.mimeType || 'text/plain'}
              </div>
              {file._zwMetadata.syntax && (
                <div className="column">
                  <strong>Syntax:</strong> {file._zwMetadata.syntax}
                </div>
              )}
              <div className="column">
                <strong>Permissions:</strong> {file._zwMetadata.permissions?.octal || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
      )}
    </FormModal>
  );
};

export default TextFileEditor;
