import React from 'react';
import { formatSpeed } from './NetworkingUtils';

const InterfacesTable = ({
    networkInterfaces,
    interfaceSort,
    handleInterfaceSort,
    getSortIcon,
    resetInterfaceSort,
    sectionsCollapsed,
    toggleSection
}) => {
    return (
        <div className='box mb-4'>
            <div className='level is-mobile mb-3'>
                <div className='level-left'>
                    <h4
                        className='title is-5 mb-0'
                        style={{ cursor: 'pointer' }}
                        onClick={resetInterfaceSort}
                        title="Click to reset sorting to default"
                    >
                        <span className='icon-text'>
                            <span className='icon'><i className='fas fa-ethernet'></i></span>
                            <span>Network Interfaces ({networkInterfaces.length} interfaces)</span>
                            {interfaceSort.length > 1 && (
                                <span className='icon has-text-info ml-2'>
                                    <i className='fas fa-sort-amount-down'></i>
                                </span>
                            )}
                        </span>
                    </h4>
                </div>
                <div className='level-right'>
                    <button
                        className='button is-small is-ghost'
                        onClick={() => toggleSection('interfaces')}
                        title={sectionsCollapsed.interfaces ? 'Expand section' : 'Collapse section'}
                    >
                        <span className='icon'>
                            <i className={`fas ${sectionsCollapsed.interfaces ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                        </span>
                    </button>
                </div>
            </div>
            {!sectionsCollapsed.interfaces && (
                networkInterfaces.length > 0 ? (
                    <div className='table-container'>
                        <table className='table is-fullwidth is-striped'>
                            <thead>
                                <tr>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleInterfaceSort('link')}
                                        title="Click to sort by interface name"
                                    >
                                        Link <i className={`fas ${getSortIcon(interfaceSort, 'link')}`}></i>
                                    </th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleInterfaceSort('class')}
                                        title="Click to sort by interface class"
                                    >
                                        Class <i className={`fas ${getSortIcon(interfaceSort, 'class')}`}></i>
                                    </th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleInterfaceSort('state')}
                                        title="Click to sort by interface state"
                                    >
                                        State <i className={`fas ${getSortIcon(interfaceSort, 'state')}`}></i>
                                    </th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleInterfaceSort('speed')}
                                        title="Click to sort by interface speed"
                                    >
                                        Speed <i className={`fas ${getSortIcon(interfaceSort, 'speed')}`}></i>
                                    </th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleInterfaceSort('mtu')}
                                        title="Click to sort by MTU"
                                    >
                                        MTU <i className={`fas ${getSortIcon(interfaceSort, 'mtu')}`}></i>
                                    </th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleInterfaceSort('macaddress')}
                                        title="Click to sort by MAC address"
                                    >
                                        MAC Address <i className={`fas ${getSortIcon(interfaceSort, 'macaddress')}`}></i>
                                    </th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleInterfaceSort('vid')}
                                        title="Click to sort by VLAN ID"
                                    >
                                        VLAN <i className={`fas ${getSortIcon(interfaceSort, 'vid')}`}></i>
                                    </th>
                                    <th
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => handleInterfaceSort('zone')}
                                        title="Click to sort by zone"
                                    >
                                        Zone <i className={`fas ${getSortIcon(interfaceSort, 'zone')}`}></i>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {networkInterfaces.map((iface, index) => (
                                    <tr key={index}>
                                        <td><strong>{iface.link}</strong></td>
                                        <td>
                                            <span className={`tag ${iface.class === 'phys' ? 'is-primary' :
                                                    iface.class === 'vnic' ? 'is-info' : 'is-dark'
                                                }`}>
                                                {iface.class}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`tag ${iface.state === 'up' ? 'is-success' : 'is-danger'}`}>
                                                {iface.state}
                                            </span>
                                        </td>
                                        <td>{formatSpeed(iface.speed)}</td>
                                        <td>{iface.mtu || 'N/A'}</td>
                                        <td><code>{iface.macaddress || 'N/A'}</code></td>
                                        <td>{iface.vid || 'N/A'}</td>
                                        <td>
                                            {iface.zone && iface.zone !== '--' ? (
                                                <button
                                                    className='button is-small is-warning'
                                                    onClick={() => window.location.href = `/ui/zones?zone=${encodeURIComponent(iface.zone)}`}
                                                    title={`Go to zone: ${iface.zone}`}
                                                    style={{
                                                        border: 'none',
                                                        height: 'auto',
                                                        padding: '0.25rem 0.5rem',
                                                        fontSize: '0.75rem'
                                                    }}
                                                >
                                                    <span className='icon-text'>
                                                        <span className='icon is-small'>
                                                            <i className='fas fa-external-link-alt'></i>
                                                        </span>
                                                        <span>{iface.zone}</span>
                                                    </span>
                                                </button>
                                            ) : (
                                                <span className='has-text-grey'>Global</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className='notification is-info'>
                        <p>No network interface data available or monitoring endpoint not configured.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default InterfacesTable;
