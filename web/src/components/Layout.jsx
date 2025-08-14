import React, { useEffect, useState, useContext, useRef, Suspense } from "react";
import { Route, Routes, useNavigate, useSearchParams } from "react-router-dom";
import { ResizableBox } from "react-resizable";
import Navbar from "./Navbar";
import SideMenu from "./Sidemenu";
import Footer from "./Footer";
import { useAuth } from "../contexts/AuthContext";
import { useServers } from "../contexts/ServerContext";
import { UserSettings } from "../contexts/UserSettingsContext";
import { FooterProvider } from "../contexts/FooterContext";

// Lazy load heavy components to reduce main bundle size
const Dashboard = React.lazy(() => import("./Dashboard"));
const ZoneweaverSettings = React.lazy(() => import("./ZoneweaverSettings"));
const ZoneweaverAPISettings = React.lazy(() => import("./ZoneweaverAPISettings"));
const Hosts = React.lazy(() => import("./Hosts"));
const Zones = React.lazy(() => import("./Zones"));
const HostManage = React.lazy(() => import("./HostManage"));
const HostNetworking = React.lazy(() => import("./HostNetworking"));
const HostStorage = React.lazy(() => import("./HostStorage"));
const HostDevices = React.lazy(() => import("./HostDevices"));
const ZoneRegister = React.lazy(() => import("./ZoneRegister"));
const Accounts = React.lazy(() => import("./Accounts"));
const Profile = React.lazy(() => import("./Profile"));

// Loading component for lazy-loaded routes
const LoadingSpinner = () => (
  <div className="hero">
    <div className="hero-body">
      <div className="container has-text-centered">
        <div className="is-size-4">
          <i className="fas fa-spinner fa-spin"></i>
        </div>
        <p className="mt-3">Loading...</p>
      </div>
    </div>
  </div>
);

// Layout content component that uses UserSettings context - moved outside to prevent remounting
const LayoutContent = () => {
  // Add mount/unmount debugging for LayoutContent
  useEffect(() => {
    console.log('🔄 LAYOUT CONTENT: Component mounted', {
      timestamp: new Date().toISOString()
    });
    
    return () => {
      console.log('🔄 LAYOUT CONTENT: Component unmounting', {
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  const { isAuthenticated } = useAuth();
  const userSettings = useContext(UserSettings);
  const [isResizing, setIsResizing] = useState(false);

  // Simple URL Parameter Reader (one-time on load only)
  const URLParameterReader = () => {
    const [searchParams] = useSearchParams();
    const processedParamsRef = useRef(new Set());
    const { 
      servers, 
      selectServer, 
      selectZone,
      currentServer,
      currentZone
    } = useServers();

    /**
     * Read URL parameters ONCE on initial load to support shared links
     */
    useEffect(() => {
      if (!isAuthenticated || servers.length === 0) return;

      const hostParam = searchParams.get('host');
      const zoneParam = searchParams.get('zone');
      
      // Create a unique key for this parameter combination
      const paramKey = `${hostParam || 'null'}-${zoneParam || 'null'}`;
      
      // Check if we've already processed this exact combination
      if (processedParamsRef.current.has(paramKey)) {
        return;
      }
      
      console.log('🔗 LAYOUT: URLParameterReader processing new params', {
        host: hostParam,
        zone: zoneParam,
        paramKey,
        timestamp: new Date().toISOString()
      });
      
      if (!hostParam && !zoneParam) {
        console.log('🔗 LAYOUT: No URL parameters to process');
        processedParamsRef.current.add(paramKey);
        return; // No parameters to process
      }
      
      console.log('🔗 URL LOAD: Reading URL parameters:', { host: hostParam, zone: zoneParam });
      
      // Find server by hostname if specified in URL
      if (hostParam) {
        const matchingServer = servers.find(server => server.hostname === hostParam);
        if (matchingServer && (!currentServer || currentServer.hostname !== hostParam)) {
          console.log('🔗 URL LOAD: Setting server from URL:', hostParam);
          selectServer(matchingServer);
        }
        
        // Set zone if specified, server matches, and zone isn't already set
        if (zoneParam && matchingServer && (!currentZone || currentZone !== zoneParam)) {
          console.log('🔗 URL LOAD: Setting zone from URL:', zoneParam);
          selectZone(zoneParam);
        }
      }
      
      // Mark this parameter combination as processed
      processedParamsRef.current.add(paramKey);
    }, [isAuthenticated, servers.length, searchParams]);

    return null; // This component doesn't render anything
  };

  // Handle resize events
  const handleResize = (e, { size }) => {
    userSettings.setSidebarWidth(size.width);
    // Sync the sidebarMinimized state with the actual width
    if (size.width <= 60 && !userSettings.sidebarMinimized) {
      userSettings.setSidebarMinimized(true);
    } else if (size.width > 60 && userSettings.sidebarMinimized) {
      userSettings.setSidebarMinimized(false);
    }
  };

  const handleResizeStart = () => {
    setIsResizing(true);
  };

  const handleResizeStop = () => {
    setIsResizing(false);
  };

  // Use actual width for ResizableBox, but collapse to 60px when minimized
  const effectiveWidth = userSettings.sidebarMinimized ? 60 : Math.max(userSettings.sidebarWidth, 60);

  return (
    <div className='columns is-gapless'>
      <URLParameterReader />
      <ResizableBox
        onResize={handleResize}
        onResizeStart={handleResizeStart}
        onResizeStop={handleResizeStop}
        width={effectiveWidth}
        height={Infinity}
        resizeHandles={["e"]}
        axis='x'
        maxConstraints={[400, Infinity]}
        minConstraints={[60, Infinity]}
      >
        <SideMenu />
      </ResizableBox>
      <section className='hero column has-background-grey is-fullheight'>
        <Navbar />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path='' element={<Dashboard />} />
            <Route path='dashboard' element={<Dashboard />} />
            <Route path='accounts' element={<Accounts />} />
            <Route path='settings/zoneweaver' element={<ZoneweaverSettings />} />
            <Route path='settings/zapi' element={<ZoneweaverAPISettings />} />
            <Route path='zones' element={<Zones />} />
            <Route path='hosts' element={<Hosts />} />
            <Route path='host-manage' element={<HostManage />} />
            <Route path='host-networking' element={<HostNetworking />} />
            <Route path='host-storage' element={<HostStorage />} />
            <Route path='host-devices' element={<HostDevices />} />
            <Route path='zone-register' element={<ZoneRegister />} />
            <Route path='profile' element={<Profile />} />
          </Routes>
        </Suspense>
        <Footer />
      </section>
    </div>
  );
};

/**
 * Layout component for authenticated users
 * @returns {JSX.Element} Layout component
 */
const Layout = () => {
  // Add mount/unmount debugging
  useEffect(() => {
    console.log('🔄 LAYOUT: Component mounted', {
      timestamp: new Date().toISOString()
    });
    
    return () => {
      console.log('🔄 LAYOUT: Component unmounting', {
        timestamp: new Date().toISOString()
      });
    };
  }, []);

  const navigate = useNavigate();
  const { isAuthenticated, loading, user } = useAuth();
  const { loadServers } = useServers();

  /**
   * Check authentication and redirect if necessary
   */
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Store the current URL (including parameters) for post-login redirect
      const currentUrl = window.location.pathname + window.location.search;
      if (currentUrl !== '/ui' && currentUrl !== '/ui/') {
        localStorage.setItem('zoneweaver_intended_url', currentUrl);
      }
      navigate("/login");
    }
  }, [isAuthenticated, loading, navigate]);

  /**
   * Load servers only once when user becomes authenticated
   */
  useEffect(() => {
    if (isAuthenticated) {
      loadServers();
    }
  }, [isAuthenticated]); // Removed loadServers from dependencies to prevent loops

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="hero is-fullheight">
        <div className="hero-body">
          <div className="container has-text-centered">
            <div className="is-size-3">
              <i className="fas fa-spinner fa-spin"></i>
            </div>
            <p className="mt-3">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Don't render layout if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  return (
    <FooterProvider>
      <LayoutContent />
    </FooterProvider>
  );
};
export default Layout;
