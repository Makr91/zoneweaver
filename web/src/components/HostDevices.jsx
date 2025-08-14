import React from "react";
import { Helmet } from "react-helmet-async";
import { useHostDevicesData } from "./Host/useHostDevicesData";
import DeviceHeader from "./Host/DeviceHeader";
import DeviceSummary from "./Host/DeviceSummary";
import DeviceFilters from "./Host/DeviceFilters";
import DeviceInventoryTable from "./Host/DeviceInventoryTable";
import PptDevicesTable from "./Host/PptDevicesTable";
import DeviceDetailsModal from "./Host/DeviceDetailsModal";

const HostDevices = () => {
    const {
        devices,
        deviceCategories,
        pptStatus,
        devicesSummary,
        loading,
        error,
        selectedServer,
        selectedDevice,
        setSelectedDevice,
        filters,
        setFilters,
        sectionsCollapsed,
        toggleSection,
        deviceSort,
        handleDeviceSort,
        getSortedDevices,
        getSortIcon,
        user,
        getServers,
        handleServerChange,
        handleDeviceRefresh,
        applyFilters,
        loadDeviceData
    } = useHostDevicesData();

    if (!user) {
        return (
            <div className='hero-body mainbody p-0 is-align-items-stretch'>
                <Helmet>
                    <meta charSet='utf-8' />
                    <title>Device Monitoring - Zoneweaver</title>
                    <link rel='canonical' href={window.location.origin} />
                </Helmet>
                <div className='container is-fluid m-2'>
                    <div className='box p-0'>
                        <div className='titlebar box active level is-mobile mb-0 p-3'>
                            <div className='level-left'>
                                <strong>Access Denied</strong>
                            </div>
                        </div>
                        <div className='p-4'>
                            <div className='notification is-danger'>
                                <p>Please log in to access device monitoring.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const serverList = getServers();
    if (serverList.length === 0) {
        return (
            <div className='hero-body mainbody p-0 is-align-items-stretch'>
                <Helmet>
                    <meta charSet='utf-8' />
                    <title>Device Monitoring - Zoneweaver</title>
                    <link rel='canonical' href={window.location.origin} />
                </Helmet>
                <div className='container is-fluid m-2'>
                    <div className='box p-0'>
                        <div className='titlebar box active level is-mobile mb-0 p-3'>
                            <div className='level-left'>
                                <strong>Device Monitoring</strong>
                            </div>
                        </div>
                        <div className='p-4'>
                            <div className='notification is-info'>
                                <h2 className='title is-4'>No Zoneweaver API Servers</h2>
                                <p>You haven't added any Zoneweaver API Servers yet. Add a server to start monitoring hardware devices.</p>
                                <div className='mt-4'>
                                    <a href='/ui/settings/zoneweaver?tab=servers' className='button is-primary'>
                                        <span className='icon'>
                                            <i className='fas fa-plus'></i>
                                        </span>
                                        <span>Add Zoneweaver API Server</span>
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    const filteredDevices = getSortedDevices(applyFilters(devices));

    return (
        <div className='hero-body mainbody p-0 is-align-items-stretch'>
            <Helmet>
                <meta charSet='utf-8' />
                <title>Device Monitoring - Zoneweaver</title>
                <link rel='canonical' href={window.location.origin} />
            </Helmet>
            <div className='container is-fluid m-2'>
                <div className='box p-0'>
                    <DeviceHeader
                        selectedServer={selectedServer}
                        loading={loading}
                        loadDeviceData={loadDeviceData}
                    />

                    <div className='p-4'>
                        {error && (
                            <div className='notification is-danger mb-4'>
                                <p>{error}</p>
                            </div>
                        )}

                        <DeviceSummary
                            deviceCategories={deviceCategories}
                            devicesSummary={devicesSummary}
                            pptStatus={pptStatus}
                            sectionsCollapsed={sectionsCollapsed}
                            toggleSection={toggleSection}
                        />

                        <DeviceFilters
                            filters={filters}
                            setFilters={setFilters}
                            deviceCategories={deviceCategories}
                            sectionsCollapsed={sectionsCollapsed}
                            toggleSection={toggleSection}
                            devices={filteredDevices}
                            selectedServer={selectedServer}
                        />

                        <DeviceInventoryTable
                            devices={filteredDevices}
                            deviceSort={deviceSort}
                            handleDeviceSort={handleDeviceSort}
                            getSortIcon={getSortIcon}
                            setSelectedDevice={setSelectedDevice}
                            sectionsCollapsed={sectionsCollapsed}
                            toggleSection={toggleSection}
                            loading={loading}
                            handleDeviceRefresh={handleDeviceRefresh}
                        />

                        <PptDevicesTable
                            pptStatus={pptStatus}
                            sectionsCollapsed={sectionsCollapsed}
                            toggleSection={toggleSection}
                            setSelectedDevice={setSelectedDevice}
                        />
                    </div>
                </div>
            </div>

            <DeviceDetailsModal
                selectedDevice={selectedDevice}
                setSelectedDevice={setSelectedDevice}
            />
        </div>
    );
};

export default HostDevices;
