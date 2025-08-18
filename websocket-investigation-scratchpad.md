# WebSocket Investigation Scratchpad

## 🎯 **COMPREHENSIVE LOGGING IMPLEMENTED** 

### **Current Status: INVESTIGATION READY**
We have implemented detailed state tracking logging to identify the exact point where zlogin session state gets corrupted.

## 📊 **Logging Coverage Added**

### **1. Session State Change Tracking (`🔵 ZLOGIN STATE CHANGE`)**
**Location**: `web/src/components/Zones.jsx` - `refreshZloginSessionStatus()`

**Triggers**:
- `refreshZloginSessionStatus-found-active`: When active session found in API
- `refreshZloginSessionStatus-no-active-found`: When no active session in API response  
- `refreshZloginSessionStatus-api-error-no-sessions`: When API fails or returns empty
- `refreshZloginSessionStatus-catch-error`: When exception thrown

**Data Logged**:
```javascript
{
  zoneName: zoneName,
  trigger: 'specific-trigger-name',
  from: {
    zlogin_session: prev.zlogin_session?.id || null,
    active_zlogin_session: prev.active_zlogin_session
  },
  to: {
    zlogin_session: newSessionId || null,
    active_zlogin_session: true/false
  },
  sessionData: activeZoneSession, // Full session object when found
  apiResponse: sessionsResult,     // API response when error
  error: error.message,            // Error details when caught
  timestamp: new Date().toISOString()
}
```

### **2. Modal Lifecycle Tracking (`🟡 MODAL LIFECYCLE`)**
**Location**: `web/src/components/Zones.jsx` - Modal close button

**Triggers**:
- Modal close events

**Data Logged**:
```javascript
{
  action: 'close',
  modalType: 'zlogin',
  zoneName: selectedZone,
  sessionStateBefore: zoneDetails.zlogin_session?.id || null,
  activeZloginSession: zoneDetails.active_zlogin_session,
  trigger: 'exit-button-click',
  timestamp: new Date().toISOString()
}
```

## 🔍 **User Reproduction Scenario**

**Expected Sequence**:
1. **Page Load**: `refreshZloginSessionStatus-found-active` ✅
2. **Switch to zlogin**: Preview works fine ✅
3. **Toggle read-only**: Should not affect session state ✅ 
4. **Switch to VNC**: Should not affect zlogin session (defensive merging) ✅
5. **Switch back to zlogin**: Should still be active ✅
6. **Click Expand**: `🟡 MODAL LIFECYCLE: action=close` when opening modal
7. **Modal Terminal Blank**: **← KEY INVESTIGATION POINT**
8. **Close Modal**: `🟡 MODAL LIFECYCLE: action=close`
9. **State Corruption**: **← Should see which `🔵 ZLOGIN STATE CHANGE` trigger**
10. **Page Refresh**: `refreshZloginSessionStatus-found-active` (proves backend OK)

## 📋 **Investigation Questions to Answer**

### **Q1: Which API call is corrupting the state?**
- Look for `🔵 ZLOGIN STATE CHANGE` entries that show `from: active → to: inactive`
- Check the `trigger` field to see which function caused it
- Verify if it's during modal operations or after

### **Q2: Is the modal terminal WebSocket connecting?** 
- Look for WebSocket connection logs in ZoneTerminalContext
- Compare preview vs modal context WebSocket behavior

### **Q3: Is there a race condition during modal open?**
- Check timing between modal lifecycle events and status checks
- Look for overlapping `refreshZloginSessionStatus` calls

## 🛡️ **Defensive Fixes Already Applied**

### **1. Race Condition Prevention**
- ✅ Serialized VNC/zlogin status checks (no more parallel execution)
- ✅ Defensive state merging (explicit preservation of session states)

### **2. Circular Dependency Fixes** 
- ✅ Removed `term` from `attachTerminal` dependencies
- ✅ Added `React.memo` to `ZoneShell` component
- ✅ Stabilized console type switching logic

### **3. Modal Close Reconnection**
- ✅ Added state transition tracking for modal closes
- ✅ Added preview terminal reconnection after modal close

## 🎯 **Next Steps**

1. **Run the reproduction scenario** and collect console logs
2. **Filter for the logging markers**: `🔵`, `🟡`, `🟠`, `🟢`
3. **Find the corruption point**: Look for the transition `active → inactive`
4. **Identify the root cause**: Which function/trigger caused the corruption
5. **Apply targeted fix**: Based on the specific corruption mechanism found

The comprehensive logging will show us exactly when, where, and why the zlogin session state gets incorrectly marked as inactive during the modal workflow.
