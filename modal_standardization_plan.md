# Modal Standardization Plan

Based on search results, here are ALL files containing modal references and our decision on each:

## **📈 CHART MODALS** (Apply Chart Modal Pattern)
| File | Status | Notes |
|------|--------|-------|
| `web/src/components/Host/ExpandedChartModal.jsx` | ✅ **COMPLETED** | ✅ Converted to pure Bulma with modal-close is-large |
| `web/src/components/Host/PerformanceCharts/ExpandedChartModal.jsx` | ✅ **COMPLETED** | ✅ Standardized with Bulma modal-close pattern |

## **⚙️ CONFIGURATION MODALS** (Apply Configuration Modal Pattern)
| File | Status | Notes |
|------|--------|-------|
| `web/src/components/Host/AddRepositoryModal.jsx` | 🔄 **NEXT** | Has header delete + footer Cancel button |
| `web/src/components/Host/AggregateCreateModal.jsx` | 🔄 **NEXT** | Has header delete + footer Cancel button |
| `web/src/components/Host/AggregateDetailsModal.jsx` | 🔄 **NEXT** | Has header delete + footer Close button |
| `web/src/components/Host/BridgeCreateModal.jsx` | 🔄 **NEXT** | Has modal structure |
| `web/src/components/Host/ConfirmActionModal.jsx` | 🔄 **NEXT** | Has modal structure |
| `web/src/components/Host/CreateBEModal.jsx` | 🔄 **NEXT** | Has modal structure |
| `web/src/components/Host/DeviceDetailsModal.jsx` | 🔄 **NEXT** | Has modal structure |
| `web/src/components/Host/EditRepositoryModal.jsx` | 🔄 **NEXT** | Has modal structure |
| `web/src/components/Host/EtherstubCreateModal.jsx` | 🔄 **NEXT** | Has modal structure |
| `web/src/components/Host/EtherstubDetailsModal.jsx` | 🔄 **NEXT** | Has modal structure |
| `web/src/components/Host/IpAddressCreateModal.jsx` | 🔄 **NEXT** | Has modal structure |
| `web/src/components/Host/NTPConfirmActionModal.jsx` | 🔄 **NEXT** | Has modal structure |
| `web/src/components/Host/PackageActionModal.jsx` | ✅ **COMPLETED** | ✅ Fixed delete button, removed footer Cancel |
| `web/src/components/Host/PackageDetailsModal.jsx` | ✅ **COMPLETED** | ✅ Standardized close pattern, removed footer close |
| `web/src/components/Host/ServiceDetailsModal.jsx` | ✅ **COMPLETED** | ✅ Standardized close pattern, removed footer close |
| `web/src/components/Host/ServicePropertiesModal.jsx` | ✅ **COMPLETED** | ✅ Fixed delete button, removed footer close |
| `web/src/components/Host/SystemUpdatesSection.jsx` | ✅ **COMPLETED** | ✅ Fixed delete button, removed footer Cancel |
| `web/src/components/Host/VnicCreateModal.jsx` | ✅ **COMPLETED** | ✅ Fixed header delete button, removed footer Cancel |
| `web/src/components/Host/VnicDetailsModal.jsx` | ✅ **COMPLETED** | ✅ Standardized header delete button, removed footer close |
| `web/src/components/Accounts.jsx` | 🔄 **NEXT** | Multiple modals with various buttons |
| `web/src/components/ApiKeysTab.jsx` | ✅ **COMPLETED** | ✅ Removed footer close button |
| `web/src/components/Dashboard.jsx` | 🔄 **NEXT** | Health status modal |
| `web/src/components/Navbar.jsx` | 🔄 **NEXT** | Confirmation modal |
| `web/src/components/Profile.jsx` | 🔄 **NEXT** | Delete account modal |
| `web/src/components/ZoneweaverAPISettings.jsx` | 🔄 **NEXT** | Backup modal |
| `web/src/components/ZoneweaverSettings.jsx` | 🔄 **NEXT** | Multiple modals (backup, OIDC) |

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
