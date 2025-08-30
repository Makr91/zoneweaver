import React from 'react';
import { getDeviceStatusColor, getDeviceStatusText, getPPTStatusColor, getPPTStatusText } from './DeviceUtils';

const DeviceInventoryTable = ({
    devices,
    deviceSort,
    handleDeviceSort,
    getSortIcon,
    setSelectedDevice,
    sectionsCollapsed,
    toggleSection,
    loading,
    handleDeviceRefresh
}) => {
    return (
        <div className='box mb-4'>
            <div className='level is-mobile mb-3'>
                <div className='level-left'>
                    <h4
                        className='title is-5 mb-0 is-clickable'
                        onClick={() => handleDeviceSort('device_name')}
                        title="Click to reset sorting to default"
                    >
                        <span className='icon-text'>
                            <span className='icon'><i className='fas fa-microchip'></i></span>
                            <span>PCI Device Inventory ({devices.length} devices)</span>
                            {deviceSort.length > 1 && (
                                <span className='icon has-text-info ml-2'>
                                    <i className='fas fa-sort-amount-down'></i>
                                </span>
                            )}
                        </span>
                    </h4>
                </div>
                <div className='level-right'>
                    <div className='field is-grouped'>
                        <div className='control'>
                            <button
                                className={`button is-small is-warning ${loading ? 'is-loading' : ''}`}
                                onClick={handleDeviceRefresh}
                                disabled={loading}
                                title="Refresh device discovery"
                            >
                                <span className='icon'>
                                    <i className='fas fa-sync'></i>
                                </span>
                                <span>Discover</span>
                            </button>
                        </div>
                        <div className='control'>
                            <button
                                className='button is-small is-ghost'
                                onClick={() => toggleSection('inventory')}
                                title={sectionsCollapsed.inventory ? 'Expand section' : 'Collapse section'}
                            >
                                <span className='icon'>
                                    <i className={`fas ${sectionsCollapsed.inventory ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
            {!sectionsCollapsed.inventory && (
                devices.length > 0 ? (
                    <div className='table-container'>
                        <table className='table is-fullwidth is-striped'>
                            <thead>
                                <tr>
                                    <th
                                        className="is-clickable"
                                        onClick={() => handleDeviceSort('device_name')}
                                        title="Click to sort by device name"
                                    >
                                        Device Name <i className={`fas ${getSortIcon(deviceSort, 'device_name')}`}></i>
                                    </th>
                                    <th
                                        className="is-clickable"
                                        onClick={() => handleDeviceSort('vendor_name')}
                                        title="Click to sort by vendor"
                                    >
                                        Vendor <i className={`fas ${getSortIcon(deviceSort, 'vendor_name')}`}></i>
                                    </th>
                                    <th
                                        className="is-clickable"
                                        onClick={() => handleDeviceSort('pci_address')}
                                        title="Click to sort by PCI address"
                                    >
                                        PCI Address <i className={`fas ${getSortIcon(deviceSort, 'pci_address')}`}></i>
                                    </th>
                                    <th
                                        className="is-clickable"
                                        onClick={() => handleDeviceSort('device_category')}
                                        title="Click to sort by category"
                                    >
                                        Category <i className={`fas ${getSortIcon(deviceSort, 'device_category')}`}></i>
                                    </th>
                                    <th
                                        className="is-clickable"
                                        onClick={() => handleDeviceSort('driver_name')}
                                        title="Click to sort by driver"
                                    >
                                        Driver <i className={`fas ${getSortIcon(deviceSort, 'driver_name')}`}></i>
                                    </th>
                                    <th
                                        className="is-clickable"
                                        onClick={() => handleDeviceSort('driver_attached')}
                                        title="Click to sort by driver status"
                                    >
                                        Status <i className={`fas ${getSortIcon(deviceSort, 'driver_attached')}`}></i>
                                    </th>
                                    <th
                                        className="is-clickable"
                                        onClick={() => handleDeviceSort('ppt_enabled')}
                                        title="Click to sort by PPT status"
                                    >
                                        PPT Status <i className={`fas ${getSortIcon(deviceSort, 'ppt_enabled')}`}></i>
                                    </th>
                                    <th>Assigned To</th>
                                </tr>
                            </thead>
                            <tbody>
                                {devices.map((device, index) => (
                                    <tr
                                        key={device.id || index}
                                        className="is-clickable"
                                        onClick={() => setSelectedDevice(device)}
                                        title="Click to view device details"
                                    >
                                        <td><strong>{device.device_name || 'Unknown Device'}</strong></td>
                                        <td>{device.vendor_name || 'Unknown'}</td>
                                        <td><code>{device.pci_address || 'N/A'}</code></td>
                                        <td>
                                            <span className={`tag ${device.device_category === 'network' ? 'is-info' :
                                                    device.device_category === 'storage' ? 'is-primary' :
                                                        device.device_category === 'display' ? 'is-success' :
                                                            'is-dark'
                                                }`}>
                                                {device.device_category || 'other'}
                                            </span>
                                        </td>
                                        <td>{device.driver_name || 'None'}</td>
                                        <td>
                                            <span className={`tag ${getDeviceStatusColor(device)}`}>
                                                {getDeviceStatusText(device)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`tag ${getPPTStatusColor(device)}`}>
                                                {getPPTStatusText(device)}
                                            </span>
                                        </td>
                                        <td>
                                            {device.assigned_to_zones?.length ? (
                                                <div className='tags'>
                                                    {device.assigned_to_zones.map(zone => (
                                                        <span key={zone} className='tag is-warning is-small'>
                                                            {zone}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className='has-text-grey'>None</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className='notification is-info'>
                        <p>No devices found matching the current filters.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default DeviceInventoryTable;
