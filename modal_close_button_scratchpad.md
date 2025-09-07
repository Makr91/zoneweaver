# Modal Close Button Standardization Scratchpad

Based on the search results, here are all the modal files found in the web/src directory that need to be reviewed and standardized:

## Target Close Button Format
```html
<button class="button is-small" title="Close Console"><span class="icon"><i class="fas fa-times"></i></span><span>Close</span></button>
```

## Files to Review and Update

### 1. web/src/components/Host/VnicDetailsModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Close" button ✅ (removed)
- Status: ✅ Complete

### 2. web/src/components/Host/VnicCreateModal.jsx  
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 3. web/src/components/Host/SystemUpdatesSection.jsx
- Header: `<button className='delete' onClick={() => setShowInstallModal(false)} disabled={installing}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 4. web/src/components/Host/ServicePropertiesModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Close" button ✅ (removed)
- Status: ✅ Complete

### 5. web/src/components/Host/ServiceDetailsModal.jsx  
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Close" button ✅ (removed)
- Status: ✅ Complete

### 6. web/src/components/Host/PerformanceCharts/ExpandedChartModal.jsx
- Header: `<button className='delete' aria-label='close' onClick={closeExpandedChart}></button>` ✅ (correct)
- Footer: No footer ✅ (correct)
- Status: ✅ Complete

### 7. web/src/components/Host/PackageDetailsModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Close" button ✅ (removed)
- Status: ✅ Complete

### 8. web/src/components/Host/PackageActionModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 9. web/src/components/Host/NTPConfirmActionModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 10. web/src/components/Host/IpAddressCreateModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 11. web/src/components/Host/ExpandedChartModal.jsx
- Header: `<button className='delete' onClick={close}></button>` ✅ (converted from modal-close pattern)
- Footer: No footer ✅ (correct)
- Status: ✅ Complete

### 12. web/src/components/Host/EtherstubDetailsModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Close" button ✅ (removed)
- Status: ✅ Complete

### 13. web/src/components/Host/EtherstubCreateModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 14. web/src/components/Host/EditRepositoryModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 15. web/src/components/Host/DeviceDetailsModal.jsx  
- Header: `<button className='delete' aria-label='close' onClick={() => setSelectedDevice(null)}></button>` ✅ (correct)
- Footer: Had "Close" button ✅ (removed)
- Status: ✅ Complete

### 16. web/src/components/Host/CreateBEModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 17. web/src/components/Host/ConfirmActionModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 18. web/src/components/Host/BridgeCreateModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 19. web/src/components/Host/AggregateDetailsModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Close" button ✅ (removed)
- Status: ✅ Complete

### 20. web/src/components/Host/AggregateCreateModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 21. web/src/components/Host/AddRepositoryModal.jsx
- Header: `<button className='delete' onClick={onClose}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 23. web/src/components/Dashboard.jsx
- Header: `<button className="delete" aria-label="close" onClick={() => setShowHealthModal(false)}></button>` ✅ (correct)
- Footer: Had "Close" button ✅ (removed)
- Status: ✅ Complete

### 22. web/src/components/ApiKeysTab.jsx
- Header: `<button className="delete" aria-label="close" onClick={() => setGeneratedKey(null)}></button>` ✅ (correct)
- Footer: Had "Close" button ✅ (removed)
- Status: ✅ Complete

### 24. web/src/components/Accounts.jsx
- Header: All 5 modals have correct `<button className="delete" aria-label="close" onClick={handler}></button>` ✅ (correct)
- Footer: All 5 modals had "Cancel" buttons ✅ (removed)
- Status: ✅ Complete (5 modals standardized)

### 25. web/src/components/ZoneweaverAPISettings.jsx
- Header: `<button className="delete" onClick={() => setShowBackupModal(false)}></button>` ✅ (correct)
- Footer: No footer ✅ (correct)
- Status: ✅ Complete

### 26. web/src/components/Zones.jsx
- No direct modals (delegates to VncModal and ZloginModal components)
- Status: ✅ Complete (no modals to standardize)

### 27. web/src/components/Zone/VncModal.jsx
- Header: Custom modal structure with close button ✅ (standardized "Exit" to "Close")
- Footer: No footer ✅ (correct)
- Status: ✅ Complete

### 28. web/src/components/Zone/ZloginModal.jsx  
- Header: Custom modal structure with close button ✅ (standardized "Exit" to "Close")
- Footer: No footer ✅ (correct)
- Status: ✅ Complete

### 29. web/src/components/Profile.jsx
- Header: `<button className="delete" aria-label="close" onClick={closeDeleteModal}></button>` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 30. web/src/components/Navbar.jsx
- Header: `<button onClick={handleModalClick} className='delete' aria-label='close' />` ✅ (correct)
- Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete

### 31. web/src/components/ZoneweaverSettings.jsx
- Backup Modal: `<button className="delete" onClick={() => setShowBackupModal(false)}></button>` ✅ (correct header, no footer)
- OIDC Modal: `<button className="delete" onClick={() => setShowOidcProviderModal(false)}></button>` ✅ (correct header)
- OIDC Modal Footer: Had "Cancel" button ✅ (removed)
- Status: ✅ Complete (2 modals standardized)

## Notes
- Many modals use `<button className='delete' onClick={onClose}></button>` in the header
- Many modals use variations of `<button className='button' onClick={onClose}>Close</button>` in the footer
- Some modals have both header X button and footer Close button (inconsistent)
- Need to standardize to the target format with icon and text
