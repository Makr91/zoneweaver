import { useState, useEffect } from 'react';
import FormModal from '../../common/FormModal';
import { isArchiveFile, getArchiveFormat, getPathFromFile } from './FileManagerTransforms';

/**
 * Archive Creation Modal
 */
const CreateArchiveModal = ({ isOpen, onClose, selectedFiles, currentPath, api, onSuccess }) => {
  const [archiveName, setArchiveName] = useState('');
  const [format, setFormat] = useState('tar.gz');
  const [destination, setDestination] = useState(currentPath);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && selectedFiles.length > 0) {
      // Generate default archive name based on selection
      const baseName = selectedFiles.length === 1 
        ? selectedFiles[0].name 
        : 'archive';
      setArchiveName(`${baseName}.${format}`);
    }
  }, [isOpen, selectedFiles, format]);

  useEffect(() => {
    setDestination(currentPath);
  }, [currentPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!archiveName.trim()) {
      setError('Archive name is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const archivePath = `${destination}/${archiveName}`;
      const result = await api.createArchive(selectedFiles, archivePath, format);
      
      if (result.success) {
        onSuccess(result);
        onClose();
      } else {
        setError(result.message || 'Failed to create archive');
      }
    } catch (error) {
      console.error('Error creating archive:', error);
      setError('Failed to create archive: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleFormatChange = (newFormat) => {
    setFormat(newFormat);
    // Update archive name with new extension
    const nameWithoutExt = archiveName.replace(/\.(tar\.gz|tar\.bz2|zip|tar|gz)$/i, '');
    setArchiveName(`${nameWithoutExt}.${newFormat}`);
  };

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Create Archive"
      icon="fas fa-file-archive"
      submitText="Create Archive"
      submitVariant="is-primary"
      submitIcon="fas fa-plus"
      loading={loading}
      showCancelButton={true}
      className="is-medium"
    >
      {/* Selected files info */}
      <div className="field">
        <div className="notification is-info is-light">
          <strong>Creating archive from {selectedFiles.length} item(s):</strong>
          <ul className="mt-2">
            {selectedFiles.slice(0, 5).map((file, index) => (
              <li key={index}>📁 {file.name}</li>
            ))}
            {selectedFiles.length > 5 && (
              <li>... and {selectedFiles.length - 5} more items</li>
            )}
          </ul>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="notification is-danger">
          <button className="delete is-small" onClick={() => setError('')}></button>
          {error}
        </div>
      )}

      {/* Archive name */}
      <div className="field">
        <label className="label">Archive Name</label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={archiveName}
            onChange={(e) => setArchiveName(e.target.value)}
            placeholder="Enter archive name..."
            required
          />
        </div>
        <p className="help">The archive will be created in the current directory</p>
      </div>

      {/* Format selection */}
      <div className="field">
        <label className="label">Archive Format</label>
        <div className="control">
          <div className="select is-fullwidth">
            <select value={format} onChange={(e) => handleFormatChange(e.target.value)}>
              <option value="tar.gz">tar.gz (Compressed tar archive)</option>
              <option value="tar.bz2">tar.bz2 (BZip2 compressed tar)</option>
              <option value="tar">tar (Uncompressed tar archive)</option>
              <option value="zip">zip (ZIP archive)</option>
              <option value="gz">gz (GZip compressed)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Destination path */}
      <div className="field">
        <label className="label">Destination Directory</label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="/path/to/destination"
            required
          />
        </div>
        <p className="help">Directory where the archive will be created</p>
      </div>
    </FormModal>
  );
};

/**
 * Archive Extraction Modal
 */
const ExtractArchiveModal = ({ isOpen, onClose, archiveFile, currentPath, api, onSuccess }) => {
  const [destination, setDestination] = useState(currentPath);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setDestination(currentPath);
  }, [currentPath]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!destination.trim()) {
      setError('Destination path is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await api.extractArchive(archiveFile, destination);
      
      if (result.success) {
        onSuccess(result);
        onClose();
      } else {
        setError(result.message || 'Failed to extract archive');
      }
    } catch (error) {
      console.error('Error extracting archive:', error);
      setError('Failed to extract archive: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!archiveFile) return null;

  return (
    <FormModal
      isOpen={isOpen}
      onClose={onClose}
      onSubmit={handleSubmit}
      title="Extract Archive"
      icon="fas fa-file-archive"
      submitText="Extract Archive"
      submitVariant="is-success"
      submitIcon="fas fa-expand-arrows-alt"
      loading={loading}
      showCancelButton={true}
      className="is-medium"
    >
      {/* Archive info */}
      <div className="field">
        <div className="notification is-light">
          <div className="columns is-mobile is-vcentered">
            <div className="column">
              <strong>Archive:</strong> {archiveFile.name}
            </div>
            <div className="column">
              <strong>Size:</strong> {archiveFile.size ? `${Math.round(archiveFile.size / 1024)} KB` : 'Unknown'}
            </div>
            <div className="column">
              <strong>Format:</strong> {getArchiveFormat(archiveFile.name)}
            </div>
          </div>
        </div>
      </div>

      {/* Error display */}
      {error && (
        <div className="notification is-danger">
          <button className="delete is-small" onClick={() => setError('')}></button>
          {error}
        </div>
      )}

      {/* Destination path */}
      <div className="field">
        <label className="label">Extract To Directory</label>
        <div className="control">
          <input
            className="input"
            type="text"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            placeholder="/path/to/extraction/directory"
            required
          />
        </div>
        <p className="help">Directory where the archive contents will be extracted</p>
      </div>

      {/* Quick destination options */}
      <div className="field">
        <label className="label">Quick Options</label>
        <div className="buttons">
          <button
            type="button"
            className="button is-small"
            onClick={() => setDestination(currentPath)}
          >
            Current Directory ({currentPath})
          </button>
          <button
            type="button"
            className="button is-small"
            onClick={() => {
              const archiveNameWithoutExt = archiveFile.name.replace(/\.(tar\.gz|tar\.bz2|zip|tar|gz)$/i, '');
              setDestination(`${currentPath}/${archiveNameWithoutExt}`);
            }}
          >
            New Folder ({archiveFile.name.replace(/\.(tar\.gz|tar\.bz2|zip|tar|gz)$/i, '')})
          </button>
        </div>
      </div>
    </FormModal>
  );
};

/**
 * Combined Archive Modals Component
 */
const ArchiveModals = ({ 
  showCreateModal, 
  showExtractModal, 
  onCloseCreate, 
  onCloseExtract, 
  selectedFiles, 
  archiveFile, 
  currentPath, 
  api, 
  onArchiveSuccess 
}) => {
  return (
    <>
      {showCreateModal && (
        <CreateArchiveModal
          isOpen={showCreateModal}
          onClose={onCloseCreate}
          selectedFiles={selectedFiles}
          currentPath={currentPath}
          api={api}
          onSuccess={onArchiveSuccess}
        />
      )}
      
      {showExtractModal && archiveFile && (
        <ExtractArchiveModal
          isOpen={showExtractModal}
          onClose={onCloseExtract}
          archiveFile={archiveFile}
          currentPath={currentPath}
          api={api}
          onSuccess={onArchiveSuccess}
        />
      )}
    </>
  );
};

export default ArchiveModals;
