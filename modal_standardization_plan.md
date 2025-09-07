# Modal Standardization Plan

Based on search results, here are ALL files containing modal references and our decision on each:

## **📈 CHART MODALS** (Apply Chart Modal Pattern)
| File | Status | Notes |
|------|--------|-------|
| `web/src/components/Host/ExpandedChartModal.jsx` | ✅ **UPDATE** | Primary chart modal - uses custom CSS classes |
| `web/src/components/Host/PerformanceCharts/ExpandedChartModal.jsx` | ✅ **UPDATE** | Performance charts modal |

## **⚙️ CONFIGURATION MODALS** (Apply Configuration Modal Pattern)
| File | Status | Notes |
|------|--------|-------|
| `web/src/components/Host/AddRepositoryModal.jsx` | ✅ **UPDATE** | Has header delete + footer Cancel button |
| `web/src/components/Host/AggregateCreateModal.jsx` | ✅ **UPDATE** | Has header delete + footer Cancel button |
| `web/src/components/Host/AggregateDetailsModal.jsx` | ✅ **UPDATE** | Has header delete + footer Close button |
| `web/src/components/Host/BridgeCreateModal.jsx` | ✅ **UPDATE** | Has modal structure |
| `web/src/components/Host/ConfirmActionModal.jsx` | ✅ **UPDATE** | Has modal structure |
| `web/src/components/Host/CreateBEModal.jsx` | ✅ **UPDATE** | Has modal structure |
| `web/src/components/Host/DeviceDetailsModal.jsx` | ✅ **UPDATE** | Has modal structure |
| `web/src/components/Host/EditRepositoryModal.jsx` | ✅ **UPDATE** | Has modal structure |
| `web/src/components/Host/EtherstubCreateModal.jsx` | ✅ **UPDATE** | Has modal structure |
| `web/src/components/Host/EtherstubDetailsModal.jsx` | ✅ **UPDATE** | Has modal structure |
| `web/src/components/Host/IpAddressCreateModal.jsx` | ✅ **UPDATE** | Has modal structure |
| `web/src/components/Host/NTPConfirmActionModal.jsx` | ✅ **UPDATE** | Has modal structure |
| `web/src/components/Host/PackageActionModal.jsx` | ✅ **UPDATE** | Has header delete + footer Cancel button |
| `web/src/components/Host/PackageDetailsModal.jsx` | ✅ **UPDATE** | Has footer Close button |
| `web/src/components/Host/ServiceDetailsModal.jsx` | ✅ **UPDATE** | Has footer Close button |
| `web/src/components/Host/ServicePropertiesModal.jsx` | ✅ **UPDATE** | Has footer Close button |
| `web/src/components/Host/SystemUpdatesSection.jsx` | ✅ **UPDATE** | Has modal structure |
| `web/src/components/Host/VnicCreateModal.jsx` | ✅ **UPDATE** | Has header delete + footer Cancel button |
| `web/src/components/Host/VnicDetailsModal.jsx` | ✅ **UPDATE** | Has header delete + footer Close button |
| `web/src/components/Accounts.jsx` | ✅ **UPDATE** | Multiple modals with various buttons |
| `web/src/components/ApiKeysTab.jsx` | ✅ **UPDATE** | Has header delete + footer Close button |
| `web/src/components/Dashboard.jsx` | ✅ **UPDATE** | Health status modal |
| `web/src/components/Navbar.jsx` | ✅ **UPDATE** | Confirmation modal |
| `web/src/components/Profile.jsx` | ✅ **UPDATE** | Delete account modal |
| `web/src/components/ZoneweaverAPISettings.jsx` | ✅ **UPDATE** | Backup modal |
| `web/src/components/ZoneweaverSettings.jsx` | ✅ **UPDATE** | Multiple modals (backup, OIDC) |

## **🖥️ CONSOLE MODALS** (❌ DO NOT TOUCH - Per User Request)
| File | Status | Notes |
|------|--------|-------|
| `web/src/components/Zone/VncModal.jsx` | ❌ **SKIP** | Complex console modal - don't break |
| `web/src/components/Zone/ZloginModal.jsx` | ❌ **SKIP** | Complex console modal - don't break |
| `web/src/components/Zones.jsx` | ❌ **SKIP** | References console modals - don't touch |

## **📝 NON-MODAL FILES** (Just References/Comments)
| File | Status | Notes |
|------|--------|-------|
| `web/src/components/Hosts.jsx` | ❌ **SKIP** | Just references closeExpandedChart function |
| `web/src/components/HostNetworking.jsx` | ❌ **SKIP** | Just TODO comments about modals |
| `web/src/components/VncActionsDropdown.jsx` | ❌ **SKIP** | Just CSS class references |
| `web/src/components/Host/NetworkTopology/NetworkTopologyViewer.jsx` | ❌ **SKIP** | Just CSS class references |

## **📊 SUMMARY**
- **Chart Modals to Update:** 2 files
- **Configuration Modals to Update:** 25 files  
- **Console Modals to Skip:** 3 files
- **Non-modal Files to Skip:** 4 files
- **Total Files to Process:** 27 files

## **🎯 STANDARDIZATION RULES**
1. **Chart Modals:** Use `<button className='modal-close is-large' aria-label='close' onClick={close}></button>`
2. **Configuration Modals:** Use `<button className='delete' aria-label='close' onClick={onClose}></button>` in header
3. **Remove ALL footer close/cancel buttons**
4. **Keep action buttons in footer** (Save, Create, etc.)
5. **Use pure Bulma classes only**
