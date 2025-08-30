import { useState } from 'react';

/**
 * Hook for managing console settings and display preferences
 * Handles VNC settings, console type switching, and preview states
 */
const useConsoleSettings = () => {
  const [activeConsoleType, setActiveConsoleType] = useState('vnc'); // 'vnc' or 'zlogin'
  const [previewReadOnly, setPreviewReadOnly] = useState(true); // Track preview terminal read-only state
  const [previewReconnectKey, setPreviewReconnectKey] = useState(0); // Force preview reconnection
  const [previewVncViewOnly, setPreviewVncViewOnly] = useState(true); // Track preview VNC view-only state
  const [vncReconnectKey, setVncReconnectKey] = useState(0); // Force VNC reconnection after kill→start
  
  // VNC Display Settings
  const [vncSettings, setVncSettings] = useState({
    quality: 6,
    compression: 2,
    resize: 'scale', // 'none', 'scale', 'remote'
    showDot: true
  });
  
  // VNC Settings Change Handlers
  const handleVncQualityChange = (quality) => {
    setVncSettings(prev => ({ ...prev, quality }));
    console.log(`🎛️ VNC SETTINGS: Quality changed to ${quality}`);
  };
  
  const handleVncCompressionChange = (compression) => {
    setVncSettings(prev => ({ ...prev, compression }));
    console.log(`🎛️ VNC SETTINGS: Compression changed to ${compression}`);
  };
  
  const handleVncResizeChange = (resize) => {
    setVncSettings(prev => ({ ...prev, resize }));
    console.log(`🎛️ VNC SETTINGS: Resize mode changed to ${resize}`);
    // Force VNC component remount with new settings
    setVncReconnectKey(prev => prev + 1);
  };
  
  const handleVncShowDotChange = (showDot) => {
    setVncSettings(prev => ({ ...prev, showDot }));
    console.log(`🎛️ VNC SETTINGS: Show cursor dot changed to ${showDot}`);
    // Force VNC component remount for cursor dot setting to take effect
    setVncReconnectKey(prev => prev + 1);
  };
  
  const handleVncClipboardPaste = (text) => {
    console.log(`📋 VNC CLIPBOARD: Attempting to paste text of length ${text.length}`);
    // This will be passed to VNC components that have the ref to call clipboardPaste
  };

  return {
    // Console type management
    activeConsoleType,
    setActiveConsoleType,
    
    // Preview states
    previewReadOnly,
    setPreviewReadOnly,
    previewReconnectKey,
    setPreviewReconnectKey,
    previewVncViewOnly,
    setPreviewVncViewOnly,
    vncReconnectKey,
    setVncReconnectKey,
    
    // VNC settings
    vncSettings,
    setVncSettings,
    
    // VNC settings handlers
    handleVncQualityChange,
    handleVncCompressionChange,
    handleVncResizeChange,
    handleVncShowDotChange,
    handleVncClipboardPaste
  };
};

export default useConsoleSettings;
