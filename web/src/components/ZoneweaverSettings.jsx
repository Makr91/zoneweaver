import { useState, useEffect } from "react";
import { Helmet } from "@dr.pogodin/react-helmet";
import { useNavigate, useSearchParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import { canManageSettings } from "../utils/permissions";
import ServerTable from "./Host/ServerTable";
import ServerForm from "./Host/ServerForm";
import ServerHelpPanel from "./Host/ServerHelpPanel";
import ServerStatusCard from "./Host/ServerStatusCard";

const ZoneweaverSettings = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState('');
  const [sections, setSections] = useState({});
  const [values, setValues] = useState({});
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [requiresRestart, setRequiresRestart] = useState(false);

  // Subsection collapse state
  const [collapsedSubsections, setCollapsedSubsections] = useState({});

  // SSL file upload state
  const [sslFiles, setSslFiles] = useState({});
  const [uploadingFiles, setUploadingFiles] = useState({});

  // Backup management state
  const [backups, setBackups] = useState([]);
  const [showBackupModal, setShowBackupModal] = useState(false);

  // Server management state
  const [servers, setServers] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [hostname, setHostname] = useState("");
  const [port, setPort] = useState("5001");
  const [protocol, setProtocol] = useState("https");
  const [entityName, setEntityName] = useState("Zoneweaver-Production");
  const [apiKey, setApiKey] = useState("");
  const [useExistingApiKey, setUseExistingApiKey] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const { servers: allServers, getServers, removeServer, addServer, testServer, refreshServers, selectServer } = useServers();

  // Load settings on component mount
  useEffect(() => {
    if (user && canManageSettings(user.role)) {
      loadSettings();
      loadServers();
    }
  }, [user]);

  // Load servers when allServers changes (avoid unnecessary calls)
  useEffect(() => {
    if (user && canManageSettings(user.role)) {
      loadServers();
    }
  }, [allServers, user]);

  // Handle URL parameter for direct tab navigation
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) {
      setActiveTab(tab);
      if (tab === 'servers') {
        setShowAddForm(true);
      }
      setSearchParams({}); // Clear URL parameter after processing
    } else if (!activeTab && Object.keys(sections).length > 0) {
      // Set first section as default active tab
      setActiveTab(Object.keys(sections)[0]);
    }
  }, [searchParams, setSearchParams, sections, activeTab]);

  const loadServers = async () => {
    try {
      // Load servers with API keys for settings page display
      const response = await axios.get('/api/servers?includeApiKeys=true');
      if (response.data.success) {
        setServers(response.data.servers);
      } else {
        const serverList = getServers(); // Fallback to context
        setServers(serverList);
      }
    } catch (error) {
      console.warn('Failed to load servers with API keys, using fallback:', error.message);
      const serverList = getServers();
      setServers(serverList);
    }
  };

  // Server management functions
  const deleteServer = async (serverId) => {
    if (!window.confirm('Are you sure you want to remove this server? This will remove the server connection.')) {
      return;
    }
    try {
      setLoading(true);
      setMsg("");
      const result = await removeServer(serverId);
      if (result.success) {
        setMsg("Server removed successfully!");
      } else {
        setMsg(result.message || "Failed to remove server");
      }
    } catch (error) {
      setMsg("Error removing server. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const editServer = (hostname) => {
    const server = servers.find(s => s.hostname === hostname);
    if (server) {
      selectServer(server);
      navigate('/ui/host-manage');
    }
  };

  const testConnection = async () => {
    if (!hostname || !port || !protocol) {
      setMsg('Please fill in hostname, port, and protocol first');
      return;
    }
    try {
      setLoading(true);
      setMsg('Testing connection...');
      setTestResult(null);
      const result = await testServer({ hostname, port: parseInt(port), protocol });
      if (result.success) {
        setTestResult('success');
        setMsg('Connection test successful! Server is reachable and ready for bootstrap.');
      } else {
        setTestResult('error');
        setMsg(`Connection test failed: ${result.message}`);
      }
    } catch (error) {
      setTestResult('error');
      setMsg('Connection test failed. Please check your server details.');
    } finally {
      setLoading(false);
    }
  };

  const addServerHandler = async (e) => {
    e.preventDefault();
    if (!hostname || !port || !protocol) {
      setMsg('Hostname, port, and protocol are required');
      return;
    }
    if (useExistingApiKey && !apiKey) {
      setMsg('API key is required when using existing API key option');
      return;
    }
    if (!useExistingApiKey && !entityName) {
      setMsg('Entity name is required when bootstrapping');
      return;
    }
    const isDuplicate = servers.some(server =>
      server.hostname === hostname &&
      server.port === parseInt(port) &&
      server.protocol === protocol
    );
    if (isDuplicate) {
      setTestResult('error');
      setMsg(`Server ${protocol}://${hostname}:${port} is already registered.`);
      return;
    }
    try {
      setLoading(true);
      setMsg('');
      setTestResult(null);
      const serverData = {
        hostname,
        port: parseInt(port),
        protocol,
        entityName: entityName || 'Zoneweaver-Production'
      };
      if (useExistingApiKey) {
        serverData.apiKey = apiKey;
      }
      const result = await addServer(serverData);
      if (result.success) {
        setTestResult('success');
        setMsg('Server added successfully! Refreshing servers...');
        await refreshServers();
        setShowAddForm(false);
        resetForm();
      } else {
        setTestResult('error');
        setMsg(result.message);
      }
    } catch (error) {
      setTestResult('error');
      setMsg('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setHostname('');
    setPort('5001');
    setProtocol('https');
    setEntityName('Zoneweaver-Production');
    setApiKey('');
    setUseExistingApiKey(false);
    setTestResult(null);
    setMsg('');
  };

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings');
      
      if (response.data.success) {
        const { extractedValues, organizedSections } = processConfig(response.data.config);
        setValues(extractedValues);
        setSections(organizedSections);
      } else {
        setMsg('Failed to load settings: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      setMsg('Error loading settings: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Process configuration to extract values and organize by sections and subsections
  const processConfig = (config) => {
    const extractedValues = {};
    const organizedSections = {};
    const sectionMetadata = config._sections || {};

    const processObject = (obj, path = '', sectionName = 'General') => {
      for (const [key, value] of Object.entries(obj || {})) {
        // Skip metadata sections
        if (key === '_sections') continue;
        
        const fullPath = path ? `${path}.${key}` : key;
        
        if (value && typeof value === 'object' && value.type && value.hasOwnProperty('value')) {
          // This is a metadata field
          extractedValues[fullPath] = value.value;
          
          // Determine section from metadata or infer from path
          const section = value.section || inferSection(fullPath) || sectionName;
          const subsection = value.subsection || inferSubsection(fullPath, section);
          
          if (!organizedSections[section]) {
            const metadata = sectionMetadata[section] || {};
            organizedSections[section] = {
              title: section,
              icon: metadata.icon || getSectionIcon(section),
              description: metadata.description || '',
              fields: [],
              subsections: {}
            };
          }
          
          const fieldData = {
            key: fullPath,
            path: fullPath,
            type: value.type,
            label: value.label || generateLabel(key),
            description: value.description || '',
            placeholder: value.placeholder || '',
            required: value.required || false,
            options: value.options || null,
            validation: value.validation || {},
            conditional: value.conditional || null,
            order: value.order || 0,
            value: value.value
          };

          if (subsection) {
            // Organize into subsections
            if (!organizedSections[section].subsections[subsection]) {
              organizedSections[section].subsections[subsection] = {
                title: subsection,
                fields: []
              };
            }
            organizedSections[section].subsections[subsection].fields.push(fieldData);
          } else {
            // Add to main section
            organizedSections[section].fields.push(fieldData);
          }
        } else if (value && typeof value === 'object' && !Array.isArray(value) && !value.hasOwnProperty('type')) {
          // This is a nested object, recurse with section inference
          const inferredSection = inferSection(fullPath) || sectionName;
          processObject(value, fullPath, inferredSection);
        } else if (Array.isArray(value) || typeof value !== 'object') {
          // This is a direct value (backward compatibility)
          extractedValues[fullPath] = value;
        }
      }
    };

    processObject(config);

    // Sort fields within each section and subsection by order
    Object.values(organizedSections).forEach(section => {
      section.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
      Object.values(section.subsections).forEach(subsection => {
        subsection.fields.sort((a, b) => (a.order || 0) - (b.order || 0));
      });
    });

    return { extractedValues, organizedSections };
  };

  // Infer section from field path
  const inferSection = (path) => {
    const sectionMap = {
      'frontend': 'Frontend',
      'server': 'Server',
      'database': 'Database',
      'mail': 'Mail',
      'authentication': 'Authentication',
      'cors': 'Security',
      'logging': 'Logging',
      'limits': 'Performance',
      'environment': 'Environment',
      'integrations': 'Integrations',
      'gravatar': 'Integrations'  // Map gravatar to Integrations
    };
    
    const pathParts = path.split('.');
    return sectionMap[pathParts[0]];
  };
  
  // Infer subsection from field path for integrations
  const inferSubsection = (path, section) => {
    if (section === 'Integrations') {
      const pathParts = path.split('.');
      if (pathParts[0] === 'integrations' && pathParts[1]) {
        // Convert subsection name to title case
        return pathParts[1].charAt(0).toUpperCase() + pathParts[1].slice(1);
      }
      if (pathParts[0] === 'gravatar') {
        return 'Gravatar';
      }
    }
    return null;
  };

  // Generate human-readable label from field name
  const generateLabel = (fieldName) => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get icon for section
  const getSectionIcon = (section) => {
    const iconMap = {
      'Application': 'fas fa-cogs',
      'Server': 'fas fa-server',
      'Frontend': 'fas fa-desktop',
      'Database': 'fas fa-database',
      'Mail': 'fas fa-envelope',
      'Authentication': 'fas fa-shield-alt',
      'Security': 'fas fa-lock',
      'Logging': 'fas fa-file-alt',
      'Performance': 'fas fa-tachometer-alt',
      'Environment': 'fas fa-globe',
      'Integrations': 'fas fa-puzzle-piece'
    };
    return iconMap[section] || 'fas fa-cog';
  };

  // Handle field value changes
  const handleFieldChange = (fieldPath, value) => {
    setValues(prev => ({
      ...prev,
      [fieldPath]: value
    }));
  };

  // Toggle subsection collapse state
  const toggleSubsection = (sectionName, subsectionName) => {
    const key = `${sectionName}-${subsectionName}`;
    setCollapsedSubsections(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  // Check if subsection is collapsed
  const isSubsectionCollapsed = (sectionName, subsectionName) => {
    const key = `${sectionName}-${subsectionName}`;
    return collapsedSubsections[key] || false;
  };

  // SSL file upload handlers
  const handleSslFileUpload = async (fieldPath, file) => {
    if (!file) return;
    
    setUploadingFiles(prev => ({ ...prev, [fieldPath]: true }));
    
    try {
      const formData = new FormData();
      formData.append('sslFile', file);
      formData.append('fieldPath', fieldPath);
      
      const response = await axios.post('/api/settings/ssl/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      if (response.data.success) {
        handleFieldChange(fieldPath, response.data.filePath);
        setSslFiles(prev => ({ 
          ...prev, 
          [fieldPath]: { 
            name: file.name, 
            size: file.size, 
            uploadedPath: response.data.filePath 
          } 
        }));
        setMsg(`SSL certificate uploaded successfully: ${file.name}`);
      } else {
        setMsg(`Failed to upload SSL certificate: ${response.data.message}`);
      }
    } catch (error) {
      console.error('SSL file upload error:', error);
      setMsg(`Error uploading SSL certificate: ${error.response?.data?.message || error.message}`);
    } finally {
      setUploadingFiles(prev => ({ ...prev, [fieldPath]: false }));
    }
  };

  // Check if field should be shown based on conditional logic
  const shouldShowField = (field) => {
    if (!field.conditional) return true;
    
    const { field: dependsOn, value: showWhen } = field.conditional;
    const dependentValue = values[dependsOn];
    
    if (Array.isArray(showWhen)) {
      return showWhen.includes(dependentValue);
    }
    
    return dependentValue === showWhen;
  };

  // Check if subsection should be shown based on conditional logic of its fields
  const shouldShowSubsection = (subsection) => {
    // If any field in the subsection should be shown, show the subsection
    return subsection.fields.some(field => shouldShowField(field));
  };

  // SSL file field renderer for certificate, key, and CA files
  const renderSSLFileField = (field) => {
    // Skip field if conditional logic says to hide it
    if (!shouldShowField(field)) {
      return null;
    }

    const currentValue = values[field.path] !== undefined ? values[field.path] : field.value;
    const isUploading = uploadingFiles[field.path];
    const uploadedFile = sslFiles[field.path];
    
    // Determine SSL file type and appropriate settings
    const getSSLFileConfig = (path) => {
      if (path.includes('ssl_key_path')) {
        return {
          type: 'Private Key',
          icon: 'fas fa-key',
          color: 'is-danger',
          accept: '.key,.pem',
          description: 'Private key file (.key or .pem format)'
        };
      } else if (path.includes('ssl_cert_path')) {
        return {
          type: 'Certificate',
          icon: 'fas fa-certificate',
          color: 'is-success', 
          accept: '.crt,.pem,.cer',
          description: 'SSL certificate file (.crt, .pem, or .cer format)'
        };
      } else if (path.includes('ssl_ca_path') || path.includes('ca_cert') || path.includes('ca_certificate')) {
        return {
          type: 'CA Certificate',
          icon: 'fas fa-shield-alt',
          color: 'is-info',
          accept: '.ca,.crt,.pem,.cer',
          description: 'Certificate Authority file (.ca, .crt, .pem, or .cer format)'
        };
      }
      return {
        type: 'SSL File',
        icon: 'fas fa-file',
        color: 'is-primary',
        accept: '.pem,.crt,.key,.cer,.ca',
        description: 'SSL certificate file'
      };
    };

    const config = getSSLFileConfig(field.path);

    return (
      <div className='field' key={field.path}>
        <label className='label'>
          <span className='icon is-small mr-2'>
            <i className={config.icon}></i>
          </span>
          {field.label}
        </label>
        
        {/* Current file path display */}
        {currentValue && (
          <div className='field'>
            <label className='label is-small'>Current File Path:</label>
            <div className='control'>
              <input 
                className='input is-small'
                type='text'
                value={currentValue || ''}
                onChange={(e) => handleFieldChange(field.path, e.target.value)}
                placeholder={field.placeholder}
                disabled={loading}
              />
            </div>
          </div>
        )}

        {/* File upload component */}
        <div className={`file has-name ${config.color} ${isUploading ? 'is-loading' : ''}`}>
          <label className='file-label'>
            <input 
              className='file-input'
              type='file'
              accept={config.accept}
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) {
                  handleSslFileUpload(field.path, file);
                }
              }}
              disabled={loading || isUploading}
            />
            <span className='file-cta'>
              <span className='file-icon'>
                <i className={isUploading ? 'fas fa-spinner fa-pulse' : config.icon}></i>
              </span>
              <span className='file-label'>
                {isUploading ? 'Uploading...' : `Upload ${config.type}`}
              </span>
            </span>
            <span className='file-name'>
              {uploadedFile ? uploadedFile.name : 'No file selected'}
            </span>
          </label>
        </div>

        {/* File status and info */}
        {uploadedFile && (
          <div className='notification is-success is-small mt-2'>
            <div className='columns is-mobile is-vcentered'>
              <div className='column'>
                <p className='is-size-7'>
                  <strong>{uploadedFile.name}</strong> ({(uploadedFile.size / 1024).toFixed(1)} KB)
                </p>
                <p className='is-size-7 has-text-grey'>
                  Uploaded to: <code className='is-size-7'>{uploadedFile.uploadedPath}</code>
                </p>
              </div>
              <div className='column is-narrow'>
                <span className='icon has-text-success'>
                  <i className='fas fa-check-circle'></i>
                </span>
              </div>
            </div>
          </div>
        )}

        {field.description && (
          <p className='help has-text-grey'>
            {field.description}
            <br />
            <small><strong>Supported formats:</strong> {config.accept.replace(/\./g, '').toUpperCase()}</small>
          </p>
        )}
      </div>
    );
  };

  // Dynamic field renderer based on metadata type
  const renderField = (field) => {
    // Skip field if conditional logic says to hide it
    if (!shouldShowField(field)) {
      return null;
    }
    
    const currentValue = values[field.path] !== undefined ? values[field.path] : field.value;
    
    const fieldProps = {
      key: field.path,
      value: currentValue || '',
      onChange: (e) => {
        const value = field.type === 'boolean' ? e.target.checked : e.target.value;
        handleFieldChange(field.path, value);
      },
      placeholder: field.placeholder,
      required: field.required,
      disabled: loading
    };

    let inputElement;

    switch (field.type) {
      case 'boolean':
        inputElement = (
          <div className='field'>
            <input
              id={`switch-${field.path}`}
              type='checkbox'
              name={`switch-${field.path}`}
              className='switch is-medium is-success'
              checked={!!currentValue}
              onChange={fieldProps.onChange}
              disabled={fieldProps.disabled}
            />
            <label htmlFor={`switch-${field.path}`} className='has-text-weight-semibold'>
              {field.label}
            </label>
          </div>
        );
        break;

      case 'integer':
        inputElement = (
          <input
            className='input'
            type='number'
            {...fieldProps}
            min={field.validation?.min}
            max={field.validation?.max}
          />
        );
        break;

      case 'password':
        inputElement = (
          <input
            className='input'
            type='password'
            {...fieldProps}
          />
        );
        break;

      case 'email':
        inputElement = (
          <input
            className='input'
            type='email'
            {...fieldProps}
          />
        );
        break;

      case 'select':
        inputElement = (
          <div className='select is-fullwidth'>
            <select {...fieldProps}>
              {field.options && field.options.map((option, index) => {
                // Handle both string and object options
                const optionValue = typeof option === 'object' ? option.value : option;
                let optionLabel = typeof option === 'object' ? option.label : option;
                
                // Skip empty/null values unless they're intentionally empty strings
                if (optionValue === null || optionValue === undefined) {
                  return null;
                }
                
                // Special handling for CORS allow_origin field
                if (field.path === 'security.cors.allow_origin') {
                  if (optionValue === true) {
                    optionLabel = 'Allow all origins in whitelist';
                  } else if (optionValue === false) {
                    optionLabel = 'Deny all origins';
                  } else if (optionValue === 'specific') {
                    optionLabel = 'Use exact whitelist matching';
                  }
                }
                
                return (
                  <option key={`${optionValue}-${index}`} value={optionValue}>
                    {optionLabel}
                  </option>
                );
              }).filter(Boolean)}
            </select>
          </div>
        );
        break;

      case 'textarea':
        inputElement = (
          <textarea
            className='textarea'
            {...fieldProps}
            rows={field.validation?.rows || 3}
          />
        );
        break;

      case 'array':
        const arrayValue = Array.isArray(currentValue) ? currentValue.join('\n') : (currentValue || '');
        inputElement = (
          <textarea
            className='textarea'
            value={arrayValue}
            onChange={(e) => handleFieldChange(field.path, e.target.value.split('\n'))}
            placeholder={field.placeholder || 'One item per line'}
            disabled={fieldProps.disabled}
            rows={field.validation?.rows || 4}
          />
        );
        break;

      default: // 'string', 'host', etc.
        inputElement = (
          <input
            className='input'
            type='text'
            {...fieldProps}
          />
        );
    }

    return (
      <div className='field' key={field.path}>
        {field.type !== 'boolean' && (
          <label className='label'>{field.label}</label>
        )}
        <div className='control'>
          {inputElement}
        </div>
        {field.description && (
          <p className='help has-text-grey'>{field.description}</p>
        )}
      </div>
    );
  };

  // Save all settings
  const saveSettings = async () => {
    setLoading(true);
    setMsg("");
    setRequiresRestart(false);
    
    try {
      // Convert flat values back to nested structure for backend
      const nestedSettings = {};
      
      Object.entries(values).forEach(([path, value]) => {
        const keys = path.split('.');
        let current = nestedSettings;
        
        for (let i = 0; i < keys.length - 1; i++) {
          if (!current[keys[i]]) {
            current[keys[i]] = {};
          }
          current = current[keys[i]];
        }
        
        current[keys[keys.length - 1]] = value;
      });

      const response = await axios.put('/api/settings', nestedSettings);
      
      if (response.data.success) {
        setMsg(response.data.message);
        setRequiresRestart(response.data.requiresRestart);
        // Reload settings to get any server-side changes
        await loadSettings();
      } else {
        setMsg('Failed to save settings: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('Error saving settings:', error);
      setMsg("Error saving settings: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Are you sure you want to reset all settings to defaults? This cannot be undone.')) {
      return;
    }
    
    try {
      setLoading(true);
      setMsg("");
      
      const response = await axios.post('/api/settings/reset');
      
      if (response.data.success) {
        setMsg(response.data.message);
        await loadSettings();
      } else {
        setMsg('Failed to reset settings: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('Error resetting settings:', error);
      setMsg("Error resetting settings: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const restartServer = async () => {
    if (!window.confirm('Are you sure you want to restart the server? This will briefly interrupt service for all users.')) {
      return;
    }
    
    try {
      setLoading(true);
      setMsg("Initiating server restart...");
      
      const response = await axios.post('/api/settings/restart');
      
      if (response.data.success) {
        setMsg(response.data.message + " The page will reload automatically.");
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        setMsg('Failed to restart server: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('Error restarting server:', error);
      setMsg("Error restarting server: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Backup management functions
  const loadBackups = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/settings/backups');
      
      if (response.data.success) {
        setBackups(response.data.backups);
      } else {
        setMsg('Failed to load backups: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error loading backups:', error);
      setMsg('Error loading backups: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const createManualBackup = async () => {
    try {
      setLoading(true);
      setMsg("Creating backup...");
      
      // Create backup by saving current settings (which auto-creates backup)
      const response = await axios.put('/api/settings', {});
      
      if (response.data.success) {
        setMsg('Manual backup created successfully!');
        await loadBackups(); // Refresh backup list
      } else {
        setMsg('Failed to create backup: ' + response.data.message);
      }
    } catch (error) {
      console.error('Error creating backup:', error);
      setMsg('Error creating backup: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const restoreFromBackup = async (backupFilename) => {
    if (!window.confirm(`Are you sure you want to restore settings from backup "${backupFilename}"? Current settings will be lost.`)) {
      return;
    }
    
    try {
      setLoading(true);
      setMsg(`Restoring from backup ${backupFilename}...`);
      
      const response = await axios.post(`/api/settings/restore/${backupFilename}`);
      
      if (response.data.success) {
        setMsg('Settings restored successfully. Page will reload to reflect changes.');
        await loadSettings();
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      } else {
        setMsg('Failed to restore backup: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('Error restoring backup:', error);
      setMsg('Error restoring backup: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const deleteBackup = async (backupFilename) => {
    if (!window.confirm(`Are you sure you want to delete backup "${backupFilename}"? This cannot be undone.`)) {
      return;
    }
    
    try {
      setLoading(true);
      setMsg(`Deleting backup ${backupFilename}...`);
      
      const response = await axios.delete(`/api/settings/backups/${backupFilename}`);
      
      if (response.data.success) {
        setMsg('Backup deleted successfully.');
        await loadBackups(); // Refresh backup list
      } else {
        setMsg('Failed to delete backup: ' + response.data.message);
      }
      
    } catch (error) {
      console.error('Error deleting backup:', error);
      setMsg('Error deleting backup: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const createBackup = async () => {
    try {
      setLoading(true);
      setMsg("Creating backup...");
      
      // Trigger a save which creates a backup automatically
      await saveSettings();
      await loadBackups();
      setMsg("Backup created successfully");
    } catch (error) {
      console.error('Error creating backup:', error);
      setMsg("Error creating backup: " + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Check permissions - only super-admin can access
  if (!user || !canManageSettings(user.role)) {
    return (
      <div className='zw-page-content-scrollable'>
        <Helmet>
          <meta charSet='utf-8' />
          <title>System Settings - Zoneweaver</title>
          <link rel='canonical' href={window.location.origin} />
        </Helmet>
        <div className='container is-fluid p-0'>
          <div className='box p-0 is-radiusless'>
            <div className='titlebar box active level is-mobile mb-0 p-3'>
              <div className='level-left'>
                <strong>Access Denied</strong>
              </div>
            </div>
            <div className='p-4'>
              <div className='notification is-danger'>
                <h2 className='title is-4'>Super Admin Access Required</h2>
                <p>Only super administrators can modify Zoneweaver system settings.</p>
                <p className='mt-2'>Your current role: <span className='tag is-warning'>{user?.role || 'Unknown'}</span></p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='zw-page-content-scrollable'>
      <Helmet>
        <meta charSet='utf-8' />
        <title>Zoneweaver Settings - Zoneweaver</title>
        <link rel='canonical' href={window.location.origin} />
      </Helmet>
      <div className='container is-fluid p-0'>
        <div className='box p-0 is-radiusless'>
          <div className='titlebar box active level is-mobile mb-0 p-3'>
            <div className='level-left'>
              <strong>Zoneweaver System Settings</strong>
            </div>
            <div className='level-right'>
              {/* Action buttons for settings pages (not servers) */}
              {activeTab !== 'servers' && Object.keys(sections).length > 0 && (
                <>
                  <button 
                    className="button is-small is-primary mr-2" 
                    onClick={saveSettings}
                    disabled={loading || !Object.keys(values).length}
                  >
                    <span className="icon is-small">
                      <i className="fas fa-save"></i>
                    </span>
                    <span>Save</span>
                  </button>
                  <button 
                    className="button is-small is-info mr-2" 
                    onClick={createBackup}
                    disabled={loading}
                  >
                    <span className="icon is-small">
                      <i className="fas fa-download"></i>
                    </span>
                    <span>Backup</span>
                  </button>
                  <button 
                    className="button is-small is-warning mr-2" 
                    onClick={async () => {
                      await loadBackups();
                      setShowBackupModal(true);
                    }}
                    disabled={loading}
                  >
                    <span className="icon is-small">
                      <i className="fas fa-history"></i>
                    </span>
                    <span>Restore</span>
                  </button>
                  <button 
                    className="button is-small is-danger mr-2" 
                    onClick={restartServer}
                    disabled={loading}
                  >
                    <span className="icon is-small">
                      <i className="fas fa-redo"></i>
                    </span>
                    <span>Restart</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Dynamic Tab Navigation */}
          <div className='tabs is-boxed'>
            <ul>
              {/* API Servers Tab - Always First */}
              <li className={activeTab === 'servers' ? 'is-active' : ''}>
                <a onClick={() => setActiveTab('servers')}>
                  <span className='icon is-small'><i className='fas fa-server'></i></span>
                  <span>API Servers</span>
                </a>
              </li>
              {/* Dynamic Tabs from Sections */}
              {Object.entries(sections).map(([sectionName, section]) => (
                <li key={sectionName} className={activeTab === sectionName ? 'is-active' : ''}>
                  <a onClick={() => setActiveTab(sectionName)}>
                    <span className='icon is-small'><i className={section.icon}></i></span>
                    <span>{section.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          <div className='p-0'>
            {msg && (
              <div className={`notification ${
                msg.includes('successfully') ? 'is-success' : 
                msg.includes('Error') ? 'is-danger' : 
                'is-warning'
              } mb-4 mx-4 mt-4`}>
                <p>{msg}</p>
              </div>
            )}

            {/* Server Management Tab */}
            {activeTab === 'servers' && (
              <>
                <div className='level is-mobile mb-4'>
                  <div className='level-left'>
                    <h2 className='title is-5'>Zoneweaver API Servers</h2>
                  </div>
                  <div className='level-right'>
                    <button className='button is-primary' onClick={() => { setShowAddForm(!showAddForm); resetForm(); }}>
                      <span className='icon'>
                        <i className={`fas ${showAddForm ? 'fa-minus' : 'fa-plus'}`}></i>
                      </span>
                      <span>{showAddForm ? 'Cancel' : 'Add Server'}</span>
                    </button>
                  </div>
                </div>

                {showAddForm ? (
                  <form onSubmit={addServerHandler} autoComplete='off'>
                    <div className='columns'>
                      <div className='column is-8'>
                        <ServerForm
                          hostname={hostname} setHostname={setHostname}
                          port={port} setPort={setPort}
                          protocol={protocol} setProtocol={setProtocol}
                          entityName={entityName} setEntityName={setEntityName}
                          apiKey={apiKey} setApiKey={setApiKey}
                          useExistingApiKey={useExistingApiKey} setUseExistingApiKey={setUseExistingApiKey}
                          loading={loading}
                        />
                      </div>
                      <div className='column is-4'>
                        <ServerHelpPanel useExistingApiKey={useExistingApiKey} />
                        <ServerStatusCard testResult={testResult} useExistingApiKey={useExistingApiKey} />
                      </div>
                    </div>
                    <div className='buttons is-centered'>
                      <button type="button" className={`button is-info ${loading ? 'is-loading' : ''}`} onClick={testConnection} disabled={loading}>
                        Test Connection
                      </button>
                      <button type="submit" className={`button is-primary ${loading ? 'is-loading' : ''}`} disabled={loading}>
                        {useExistingApiKey ? 'Add Server' : 'Bootstrap Server'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <ServerTable servers={servers} onEdit={editServer} onDelete={deleteServer} loading={loading} />
                )}
              </>
            )}

            {/* Dynamic Configuration Sections */}
            {Object.entries(sections).map(([sectionName, section]) => 
              activeTab === sectionName && (
                <div key={sectionName}>
                  {/* Main Section Fields */}
                  {section.fields.length > 0 && (
                    <div className='box mb-4'>
                      <h2 className='title is-5'>
                        <span className='icon is-small mr-2'>
                          <i className={section.icon}></i>
                        </span>
                        {section.title} Settings
                      </h2>
                      
                      {/* Section description from config */}
                      {section.description && (
                        <p className='subtitle is-6 has-text-grey mt-2 mb-4'>
                          {section.description}
                        </p>
                      )}
                      
                      {/* Special formatting for Logging section */}
                      {sectionName === 'Logging' ? (
                        <div className='columns is-vcentered'>
                          {/* Logging Level - Left Column */}
                          <div className='column is-6'>
                            <div className='field'>
                              <label className='label has-text-weight-semibold'>
                                <span className='icon is-small mr-2'>
                                  <i className='fas fa-layer-group'></i>
                                </span>
                                Logging Level
                              </label>
                              <div className='control has-icons-left'>
                                <div className='select is-fullwidth'>
                                  <select 
                                    value={values['logging.level'] || 'info'}
                                    onChange={(e) => handleFieldChange('logging.level', e.target.value)}
                                    disabled={loading}
                                  >
                                    <option value="error">Error - Critical issues only</option>
                                    <option value="warn">Warning - Errors + warnings</option>
                                    <option value="info">Info - General operations</option>
                                    <option value="debug">Debug - Detailed diagnostics</option>
                                  </select>
                                </div>
                                <span className='icon is-small is-left'>
                                  <i className='fas fa-list-ul'></i>
                                </span>
                              </div>
                              <p className='help has-text-grey'>
                                Controls the minimum level of messages that will be logged to console and files
                              </p>
                            </div>
                          </div>
                          
                          {/* Logging Enabled - Right Column */}
                          <div className='column is-6'>
                            <div className='field'>
                              <label className='label has-text-weight-semibold'>
                                <span className='icon is-small mr-2'>
                                  <i className='fas fa-power-off'></i>
                                </span>
                                Enable Logging
                              </label>
                              <div className='control'>
                                <div className='field'>
                                  <input
                                    id='switch-logging-enabled'
                                    type='checkbox'
                                    name='switch-logging-enabled'
                                    className='switch is-medium is-success'
                                    checked={!!values['logging.enabled']}
                                    onChange={(e) => handleFieldChange('logging.enabled', e.target.checked)}
                                    disabled={loading}
                                  />
                                  <label htmlFor='switch-logging-enabled' className='has-text-weight-semibold'>
                                    {values['logging.enabled'] ? 
                                      <span className='has-text-success'>
                                        <span className='icon is-small mr-2'>
                                          <i className='fas fa-check-circle'></i>
                                        </span>
                                        Logging is enabled
                                      </span> : 
                                      <span className='has-text-danger'>
                                        <span className='icon is-small mr-2'>
                                          <i className='fas fa-times-circle'></i>
                                        </span>
                                        Logging is disabled
                                      </span>
                                    }
                                  </label>
                                </div>
                              </div>
                              <p className='help has-text-grey'>
                                Disable only for testing - logging is essential for troubleshooting
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : sectionName === 'Server' ? (
                        /* Special SSL file upload layout for Server section */
                        <div className='columns is-multiline'>
                          {section.fields.map((field) => {
                            // Check if this is an SSL certificate field
                            const isSSLField = field.path.includes('ssl_') && field.path.includes('_path');
                            
                            if (isSSLField) {
                              return (
                                <div key={field.path} className='column is-full'>
                                  {renderSSLFileField(field)}
                                </div>
                              );
                            }
                            
                            return (
                              <div 
                                key={field.path} 
                                className={field.type === 'textarea' || field.type === 'array' ? 'column is-full' : 'column is-half'}
                              >
                                {renderField(field)}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        /* Standard column layout for other sections */
                        <div className='columns is-multiline'>
                          {section.fields.map((field) => (
                            <div 
                              key={field.path} 
                              className={field.type === 'textarea' || field.type === 'array' ? 'column is-full' : 'column is-half'}
                            >
                              {renderField(field)}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Subsections with Collapsible Cards */}
                  {Object.entries(section.subsections || {}).map(([subsectionName, subsection]) => {
                    // Skip subsection if none of its fields should be shown
                    if (!shouldShowSubsection(subsection)) {
                      return null;
                    }
                    
                    const isCollapsed = isSubsectionCollapsed(sectionName, subsectionName);
                    return (
                      <div key={subsectionName} className='box mb-4'>
                        <div 
                          className='is-clickable pb-2'
                          onClick={() => toggleSubsection(sectionName, subsectionName)}
                        >
                          <h3 className='title is-6 mb-2'>
                            <span className='icon is-small mr-2'>
                              <i className={`fas ${isCollapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`}></i>
                            </span>
                            <span className='icon is-small mr-2'>
                              <i className={section.icon}></i>
                            </span>
                            {subsection.title}
                            <span className='tag is-light is-small ml-2'>
                              {subsection.fields.length} setting{subsection.fields.length !== 1 ? 's' : ''}
                            </span>
                          </h3>
                        </div>

                        {/* Collapsible Content */}
                        {!isCollapsed && (
                          <div className='mt-3'>
                            <div className='columns is-multiline'>
                              {subsection.fields.map((field) => (
                                <div 
                                  key={field.path} 
                                  className={field.type === 'textarea' || field.type === 'array' ? 'column is-full' : 'column is-half'}
                                >
                                  {renderField(field)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Show default message if section has no fields or subsections */}
                  {section.fields.length === 0 && Object.keys(section.subsections || {}).length === 0 && (
                    <div className='box mb-4'>
                      <h2 className='title is-5'>
                        <span className='icon is-small mr-2'>
                          <i className={section.icon}></i>
                        </span>
                        {section.title} Settings
                      </h2>
                      
                      {section.description && (
                        <p className='subtitle is-6 has-text-grey mb-4'>
                          {section.description}
                        </p>
                      )}

                      <div className='notification is-info'>
                        <p>No settings available in this section yet.</p>
                      </div>
                    </div>
                  )}
                </div>
              )
            )}

            {/* Restart Warning */}
            {requiresRestart && (
              <div className='notification is-warning mt-4'>
                <h3 className='title is-6'>Server Restart Required</h3>
                <p>Some of your changes require a server restart to take effect.</p>
                <div className='mt-3'>
                  <button 
                    className='button is-danger'
                    onClick={restartServer}
                    disabled={loading}
                  >
                    <span className='icon'>
                      <i className='fas fa-power-off'></i>
                    </span>
                    <span>Restart Server Now</span>
                  </button>
                </div>
              </div>
            )}

            {/* Help Section */}
            <div className='box mt-4'>
              <h2 className='title is-6'>Settings Information</h2>
              <div className='content is-size-7'>
                <p><strong>Important:</strong> These settings affect the entire Zoneweaver application for all users.</p>
                <ul>
                  <li>Changes require super-admin privileges and take effect immediately</li>
                  <li>Some settings may require users to refresh their browsers</li>
                  <li>Performance settings affect resource usage and responsiveness</li>
                  <li>Security settings impact user sessions and authentication</li>
                </ul>
                <p className='mt-3'><strong>Current User:</strong> {user.username} <span className='tag is-danger is-small'>Super Admin</span></p>
              </div>
            </div>
          </div>

          {/* Backup Modal */}
          <div className={`modal ${showBackupModal ? 'is-active' : ''}`}>
            <div className="modal-background" onClick={() => setShowBackupModal(false)}></div>
            <div className="modal-card">
              <header className="modal-card-head">
                <p className="modal-card-title">Configuration Backups</p>
                <button className="delete" onClick={() => setShowBackupModal(false)}></button>
              </header>
              <section className="modal-card-body">
                {backups.length === 0 ? (
                  <p className="has-text-grey">No backups available</p>
                ) : (
                  <table className="table is-fullwidth is-striped">
                    <thead>
                      <tr>
                        <th>Filename</th>
                        <th>Created</th>
                        <th className="has-text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {backups.map(backup => (
                        <tr key={backup.filename}>
                          <td>
                            <code className="is-size-7">{backup.filename}</code>
                          </td>
                          <td>{new Date(backup.created).toLocaleString()}</td>
                          <td className="has-text-right">
                            <div className="field is-grouped is-grouped-right">
                              <p className="control is-expanded">
                                <button 
                                  className="button is-small is-warning is-fullwidth" 
                                  onClick={() => {
                                    restoreFromBackup(backup.filename);
                                    setShowBackupModal(false);
                                  }}
                                  disabled={loading}
                                >
                                  Restore
                                </button>
                              </p>
                              <p className="control is-expanded">
                                <button 
                                  className="button is-small is-danger is-fullwidth" 
                                  onClick={() => deleteBackup(backup.filename)}
                                  disabled={loading}
                                >
                                  Delete
                                </button>
                              </p>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ZoneweaverSettings;
