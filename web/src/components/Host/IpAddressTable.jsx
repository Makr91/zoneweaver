import React from 'react';

const IpAddressTable = ({ ipAddresses, sectionsCollapsed, toggleSection }) => {
    return (
        <div className='box mb-4'>
            <div className='level is-mobile mb-3'>
                <div className='level-left'>
                    <h4 className='title is-5 mb-0'>
                        <span className='icon-text'>
                            <span className='icon'><i className='fas fa-globe'></i></span>
                            <span>IP Addresses</span>
                        </span>
                    </h4>
                </div>
                <div className='level-right'>
                    <button
                        className='button is-small is-ghost'
                        onClick={() => toggleSection('ipAddresses')}
                        title={sectionsCollapsed.ipAddresses ? 'Expand section' : 'Collapse section'}
                    >
                        <span className='icon'>
                            <i className={`fas ${sectionsCollapsed.ipAddresses ? 'fa-chevron-down' : 'fa-chevron-up'}`}></i>
                        </span>
                    </button>
                </div>
            </div>
            {!sectionsCollapsed.ipAddresses && (
                ipAddresses.length > 0 ? (
                    <div className='table-container'>
                        <table className='table is-fullwidth is-striped'>
                            <thead>
                                <tr>
                                    <th>Interface</th>
                                    <th>IP Address</th>
                                    <th>Netmask/Prefix</th>
                                    <th>Type</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {ipAddresses.map((ip, index) => (
                                    <tr key={index}>
                                        <td><strong>{ip.interface || ip.name}</strong></td>
                                        <td><code>{ip.ip_address || ip.address || ip.addr}</code></td>
                                        <td><code>{ip.prefix_length ? `/${ip.prefix_length}` : ip.netmask || ip.prefix || 'N/A'}</code></td>
                                        <td>
                                            <span className='tag is-info'>
                                                {ip.ip_version || ip.type || ip.family || 'IPv4'}
                                            </span>
                                        </td>
                                        <td>
                                            <span className={`tag ${ip.state === 'ok' || ip.status === 'active' || ip.state === 'up' ? 'is-success' : 'is-warning'}`}>
                                                {ip.state || ip.status || 'Active'}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className='notification is-info'>
                        <p>No IP address data available or monitoring endpoint not configured.</p>
                    </div>
                )
            )}
        </div>
    );
};

export default IpAddressTable;
