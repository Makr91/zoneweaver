# Modal Close Button Standardization Scratchpad

Based on the search results, here are all the modal files found in the web/src directory that need to be reviewed and standardized:

## Target Close Button Format
```html
<button class="button is-small" title="Close Console"><span class="icon"><i class="fas fa-times"></i></span><span>Close</span></button>
```

## Files to Review and Update

### 1. web/src/components/Host/VnicDetailsModal.jsx
- Current: `<button className='button' onClick={onClose}>Close</button>`
- Status: ❌ Needs update

### 2. web/src/components/Host/VnicCreateModal.jsx  
- Status: 🔍 Need to examine

### 3. web/src/components/Host/SystemUpdatesSection.jsx
- Has modal structure
- Status: 🔍 Need to examine

### 4. web/src/components/Host/ServicePropertiesModal.jsx
- Current: `<button className='button' onClick={onClose}>Close</button>`
- Status: ❌ Needs update

### 5. web/src/components/Host/ServiceDetailsModal.jsx  
- Current: `<button className='button' onClick={onClose}>Close</button>`
- Status: ❌ Needs update

### 6. web/src/components/Host/PerformanceCharts/ExpandedChartModal.jsx
- Status: 🔍 Need to examine

### 7. web/src/components/Host/PackageDetailsModal.jsx
- Current: `<button className='button' onClick={onClose}>Close</button>`
- Status: ❌ Needs update

### 8. web/src/components/Host/PackageActionModal.jsx
- Status: 🔍 Need to examine

### 9. web/src/components/Host/NTPConfirmActionModal.jsx
- Status: 🔍 Need to examine

### 10. web/src/components/Host/IpAddressCreateModal.jsx
- Status: 🔍 Need to examine

### 11. web/src/components/Host/ExpandedChartModal.jsx
- Current: `className='modal-close is-large has-z-index-10001'`
- Status: ❌ Needs update (different pattern)

### 12. web/src/components/Host/EtherstubDetailsModal.jsx
- Status: 🔍 Need to examine

### 13. web/src/components/Host/EtherstubCreateModal.jsx
- Status: 🔍 Need to examine

### 14. web/src/components/Host/EditRepositoryModal.jsx
- Status: 🔍 Need to examine

### 15. web/src/components/Host/DeviceDetailsModal.jsx  
- Status: 🔍 Need to examine

### 16. web/src/components/Host/CreateBEModal.jsx
- Status: 🔍 Need to examine

### 17. web/src/components/Host/ConfirmActionModal.jsx
- Status: 🔍 Need to examine

### 18. web/src/components/Host/BridgeCreateModal.jsx
- Status: 🔍 Need to examine

### 19. web/src/components/Host/AggregateDetailsModal.jsx
- Current: `<button className='button' onClick={onClose}>Close</button>`
- Status: ❌ Needs update

### 20. web/src/components/Host/AggregateCreateModal.jsx
- Current: `<button className='delete' onClick={onClose}></button>` (header)
- Current: `<button type='button' className='button' onClick={onClose} disabled={creating}>Cancel</button>` (footer)
- Status: ❌ Needs update

### 21. web/src/components/Host/AddRepositoryModal.jsx
- Current: `<button className='delete' onClick={onClose}></button>` (header)  
- Current: `<button type='button' className='button' onClick={onClose} disabled={loading}>Cancel</button>` (footer)
- Status: ❌ Needs update

### 22. web/src/components/Dashboard.jsx
- Has modal structure
- Status: 🔍 Need to examine

### 23. web/src/components/ApiKeysTab.jsx
- Current: `<button className="delete" aria-label="close" onClick={() => setGeneratedKey(null)}></button>` (header)
- Current: `<button className="button" onClick={() => setGeneratedKey(null)}>Close</button>` (footer)
- Status: ❌ Needs update

### 24. web/src/components/Accounts.jsx
- Multiple modals with various close buttons
- Status: 🔍 Need to examine

### 25. web/src/components/ZoneweaverAPISettings.jsx
- Current: `<button className="delete" onClick={() => setShowBackupModal(false)}></button>` (header)
- Status: 🔍 Need to examine

### 26. web/src/components/Zones.jsx
- Has modal functionality
- Status: 🔍 Need to examine  

### 27. web/src/components/Zone/VncModal.jsx
- Modal component for VNC
- Status: 🔍 Need to examine

### 28. web/src/components/Zone/ZloginModal.jsx  
- Modal component for Zlogin
- Status: 🔍 Need to examine

### 29. web/src/components/Profile.jsx
- Has modal structure
- Status: 🔍 Need to examine

### 30. web/src/components/Navbar.jsx
- Has modal structure  
- Status: 🔍 Need to examine

### 31. web/src/components/ZoneweaverSettings.jsx
- Current: `<button className="delete" onClick={() => setShowBackupModal(false)}></button>` (header)
- Status: 🔍 Need to examine

## Notes
- Many modals use `<button className='delete' onClick={onClose}></button>` in the header
- Many modals use variations of `<button className='button' onClick={onClose}>Close</button>` in the footer
- Some modals have both header X button and footer Close button (inconsistent)
- Need to standardize to the target format with icon and text
