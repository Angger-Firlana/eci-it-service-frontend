API Change Report

Location: C:\Users\trisb\tugasreactnative\eci-service\eci-it-service-api

Changes 1
- storeServiceType: Added `storeServiceType` in `app/Http/Controllers/ReferenceDataController.php` to create service types.
- routing: Added `POST /references/service-types` in `routes/api.php` to route to `storeServiceType`.
- import: Added `use App\Models\CostType;` in `app/Http/Controllers/ReferenceDataController.php` (fixes missing import for `getCostTypes()`).
---------
Changes 2
- service request detail: Expanded eager loading in `app/Services/ServiceRequest/ServiceRequestService.php` to include
  `service_request_details.device.device_model.device_type:id,name` so the frontend can show Perangkat
  (device_type comes from device_model).
- service request detail: Updated `service_request_details.device.device_model` select to include `device_type_id`
  so the `device_type` relation can resolve.
-----
Changes 3
- timeline payload: Added `vendor_approvals` with `status`, `approver`, and `assigned_by` to the service request detail eager loading,
  and exposed it as `service_request_approvals` on the response.
- user department: Added `user.departments:id,name` to the service request detail eager loading so the frontend can show department.
- audit log: Added `CREATE_REQUEST` audit log entry when a service request is created.
- audit log: Set `old_status_id` to the current status on create to satisfy non-null constraint.
- timeline payload: Added `timeline` array built from audit logs so the frontend timeline renders even without approvals.
- timeline payload: Use service request status as the label for the CREATE_REQUEST timeline item.
- timeline actor: Added `->with('actor:id,name')` in `AuditLogService::getAuditLogsForServiceRequest()` to eager load actor information.
- timeline description: Updated timeline mapping in `ServiceRequestService::getServiceRequestById()` to show "Request dibuat oleh {actor_name}" for CREATE_REQUEST actions.
----------

Changes 4
- approval policy eager load: Removed `approval_policy_steps.condition_type` eager load from `app/Services/ApprovalPolicyService.php` because `ApprovalPolicyStep` does not define a `condition_type` relationship.
- fix 500: This unblocks `/service-requests/{id}/approver` and `/service-requests/{id}/approvals` which were throwing "Call to undefined relationship [condition_type]".
----------

Changes 5
- approver endpoint: Fixed return type mismatch in `app/Services/ServiceRequest/ServiceRequestApprovalService.php` (`getApproverByServiceRequestId` now returns array).
- audit log: Added missing `use App\Models\Status;` import in `app/Services/AuditLogService.php` so `createStatusAuditLog()` typehint resolves correctly.
- approval policy: Updated `getApprovalPolicyByServiceRequestCost` return type in `app/Services/ApprovalPolicyService.php` to `?ApprovalPolicy` (it can return null).
----------

Changes 6
- audit_logs migration: Created migration `2026_01_29_100000_make_audit_logs_status_ids_nullable.php` to make `old_status_id` and `new_status_id` nullable.
- fix 500: This unblocks `CREATE_VENDOR_APPROVAL` and `UPDATE_VENDOR_APPROVAL` audit log entries which don't involve status changes.
----------

Changes 7
- atasan approval auto-transition: Updated `checkAndUpdateServiceRequestStatus()` in `app/Services/ServiceRequest/ServiceRequestApprovalService.php` so when ALL atasan approvals are no longer pending:
  - service request transitions to `APPROVED_BY_ABOVE` (status_id = 5)
  - then auto-transitions to `IN_PROGRESS` (status_id = 7)
- audit log: Added status audit log entries for BOTH transitions so timeline is consistent.
- rejection behavior unchanged: If ANY atasan approval is rejected, service request status becomes `REJECTED_BY_ABOVE` (status_id = 6) with audit log.
----------

Changes 8
- invoice preview (PDF): Added endpoint to generate invoice PDF on-the-fly (does NOT require stored Invoice record).
  - `GET /api/service-requests/{id}/preview-invoice` -> returns PDF (auth required)
  - rule: printable starting from `APPROVED_BY_ADMIN` and later
  - allowed for `REJECTED_BY_ABOVE` (admin can change vendor and reprocess)
  - NOT allowed for `REJECTED` and `CANCELLED`
- note: Stored Invoice creation still happens on `COMPLETED`; preview invoice is independent.
----------

Changes 9
- **Bug Fix: Admin-Created Request Shows Wrong Requester & Department**
- **Frontend Changes** (`src/pages/admin/Inbox/InboxDetail.jsx`):
  - Added `actualCreator` useMemo to extract creator from audit logs `CREATE_REQUEST` action's `actor` field
  - Updated `departmentLabel` to prioritize `actualCreator.departments` over `detail.user.departments`
  - Updated `requesterName` to use `actualCreator.name` instead of `detail.user.name`
  - This ensures when admin creates request, their name and department are shown (not "User" or "-")
  
- **Backend Changes** (for department eager loading):
  - **File**: `app/Services/AuditLogService.php`
    - Updated `getAuditLogsForServiceRequest()` to eager load `actor.departments:id,name` (was only loading `actor:id,name`)
    - This populates department data in audit log actor objects
  
  - **File**: `app/Services/ServiceRequest/ServiceRequestService.php`
    - Added `'admin.departments:id,name'` to `showWith()` method
    - This ensures admin's department is loaded when admin is assigned to service request
  
- **Other Fixes in Same Session**:
  - Fixed Kode Pos validation: Now accepts numbers only (strips non-numeric chars)
  - Fixed date picker: Removed duplicate calendar icon wrapper
  - Added date validation: Cannot select dates before today (min attribute)
  - Timeline now shows actual creator name instead of generic "User"

- **Impact**: Admin-created requests now correctly display admin name and department in Detail Request card and Timeline
----------

Changes 10
- **UI/UX Improvements: Location Modal Defaults & Validation**
- **Frontend Changes** (`src/pages/admin/Inbox/InboxDetail.jsx`):
  - **Default Location Type**: Location type now defaults to "Workshop IT (Internal)" when opening the modal (line 141 - state already set to 'internal')
  - **Google Maps URL Optional**: 
    - Removed `mapsUrl` from required validation (line 731-733)
    - Updated error message to not mention "link maps"
    - Modified payload to only include `maps_url` if value is provided (line 747-759)
    - Updated URL normalization to handle empty string (line 735-738)
  
- **Impact**: 
  - Users no longer need to enter Google Maps URL for vendor locations (it's now optional)
  - Modal opens with Workshop (Internal) selected by default for better UX
  - **Note**: Backend still requires `maps_url` for external locations - needs backend permission to make fully optional
----------

Changes 11
- **UI Fixes: Action Card Labels & Timeline Display**
- **Frontend Changes** (`src/pages/admin/Inbox/InboxDetail.jsx`):
  - **Action Card Label Fix** (line 1098-1111):
    - Changed "Set Lokasi Service" to "Pilih Lokasi Service"
    - Added description: "Pilih lokasi workshop atau vendor untuk service"
    - Changed button text from "Set Lokasi" to "Pilih Lokasi"
    - This makes it clearer that admin is choosing initial location, not moving
  
  - **Timeline Location Changes Fix** (line 393-406):
    - Added logic to detect location change from audit log notes
    - When `IN_PROGRESS` status + notes contain "Dipindah ke vendor" → shows "Diset ke vendor (eksternal)"
    - When `IN_PROGRESS` status + notes contain "Dipindah ke workshop" → shows "Dipindah ke workshop (internal)"
    - Fixes bug where timeline didn't show location change entries
  
- **Impact**: 
  - Timeline now correctly shows when service is moved between vendor and workshop
  - Action cards have clearer, more accurate labels
  - Better UX - users understand what action they're taking
----------

Changes 12
- **Performance Fix: Manage Users - Caching & Optimistic Updates**
- **Frontend Changes** (`src/pages/admin/ManageUsers/ManageUsers.jsx`):
  
  - **Search Debouncing** (line 13-24, 121-136):
    - Added 300ms debounce for search input
    - Prevents API calls on every keystroke
    - Uses `debouncedSearch` state with setTimeout
    - Cleanup on unmount to prevent memory leaks
  
  - **Caching System** (line 7-9, 144-156):
    - Added `userCache` Map to cache user lists per tab/filter
    - Cache TTL: 60 seconds
    - Cache key: `{activeTab}-{departmentId}-{search}`
    - Returns cached data immediately if valid (no loading state)
    - Significantly improves perceived performance
  
  - **Optimistic Updates - CREATE** (line 339-375):
    - Creates temporary user with `temp-${Date.now()}` ID
    - Adds to list immediately before API responds
    - Replaces temp user with real data on success
    - Removes temp user and shows error on failure
    - Instant feedback - no waiting
  
  - **Optimistic Updates - UPDATE** (line 239-251, 271):
    - Already had optimistic update
    - Added cache clear on update
    - Rollback on error already implemented
  
  - **Optimistic Updates - DELETE** (line 295-321):
    - Removes user from list immediately
    - Selects next user in list
    - Rollback (restore deleted user) on error
    - Instant feedback - no waiting
  
  - **Cache Invalidation**:
    - Cache cleared on CREATE/UPDATE/DELETE
    - Ensures fresh data after mutations

- **Impact**: 
  - ✅ No more lag when typing in search
  - ✅ Instant UI updates for create/update/delete operations
  - ✅ Cached data loads instantly when switching tabs
  - ✅ Much better perceived performance - feels instant
  - ✅ Proper error handling with rollback on failure
----------

Changes 13
- **Global Cache System - Persistent Across Navigation**
- **New File**: `src/lib/globalCache.js`
  - Created centralized cache manager singleton
  - **Persistent**: Survives component unmounts and navigation
  - **Auto-cleanup**: Removes expired entries every 5 minutes
  - **Pattern matching**: Can delete multiple cache keys by regex
  - **Methods**:
    - `get(key)` - Returns value or null if expired
    - `set(key, value, ttl)` - Store with custom TTL
    - `has(key)` - Check if valid cache exists
    - `delete(key)` - Remove specific key
    - `deletePattern(regex)` - Remove keys matching pattern
    - `clear()` - Clear all cache
    - `getStats()` - Get cache statistics
    - `cleanup()` - Manual cleanup of expired entries

- **Applied To Pages**:
  
  1. **Manage Users** (`src/pages/admin/ManageUsers/ManageUsers.jsx`):
     - Migrated from local Map to globalCache
     - Cache key: `manage-users:{tab}:{dept}:{search}`
     - TTL: 60 seconds
     - Pattern delete on mutations: `/^manage-users:/`
  
  2. **Admin Dashboard** (`src/pages/admin/Dashboard/Dashboard.jsx`):
     - Cache key: `admin-dashboard:{adminId}`
     - TTL: 30 seconds (faster refresh for dashboard)
     - Caches enriched request list
  
  3. **Master Data** (`src/pages/admin/MasterData/MasterData.jsx`):
     - Migrated from localStorage to globalCache
     - Cache keys: `master-data:{type}` (device-types, device-models, etc.)
     - TTL: 5 minutes (stable reference data)
     - Wrapper functions for backward compatibility
  
  4. **Admin Inbox** (`src/pages/admin/Inbox/Inbox.jsx`):
     - Cache key: `admin-inbox:list`
     - TTL: 30 seconds
     - Caches enriched inbox items with details
  
  5. **Admin Service List** (`src/pages/admin/ServiceList/ServiceList.jsx`):
     - Cache key: `admin-service-list:{page}:{search}`
     - TTL: 30 seconds
     - Caches paginated service list with locations and costs

- **Debug Logging**:
  - Added console logs for cache HIT/MISS/EXPIRED/SET
  - Easy to track cache performance in browser console
  - Logs show: `[GlobalCache] HIT: admin-inbox:list`

- **Key Benefits**:
  - ✅ **Persistent across navigation**: Cache survives page changes
  - ✅ **Memory-based**: Faster than localStorage
  - ✅ **Automatic expiry**: No manual cleanup needed
  - ✅ **Global singleton**: Shared across entire app
  - ✅ **Pattern matching**: Easy to invalidate related caches
  - ✅ **Stats tracking**: Can monitor cache performance

- **Impact**:
  - Navigate away from Manage Users → come back → instant load from cache!
  - Same for Dashboard and Master Data
  - Reduced API calls significantly
  - Better UX - feels like a native app
----------

Changes 14
- **Calendar Implementation - Real Data & Interactive**
- **File**: `src/pages/admin/Calendar/Calendar.jsx`
  
  - **Real API Data**:
    - Fetches service requests from `/service-requests` with date range filters
    - Groups events by date for calendar display
    - Caches calendar data for 5 minutes per month
    - Cache key: `admin-calendar:{year}-{month}`
  
  - **Month Navigation**:
    - Previous/Next month buttons fully functional
    - Dynamic calendar grid based on current month
    - Auto-adjusts for different month lengths and start days
  
  - **Clickable Events**:
    - Click on calendar day → shows events for that date
    - Click on event card → navigates to `/inbox/detail/{id}`
    - Hover effects on event cards
  
  - **Color Coding by Action Type**:
    | Status | Action Text | Color | Background |
    |--------|-------------|-------|------------|
    | PENDING / IN_REVIEW_ADMIN | Approve | Red (#DC2626) | Light Red |
    | APPROVED_BY_ADMIN | Set Lokasi | Green (#16A34A) | Light Green |
    | IN_REVIEW_ABOVE | Set Atasan | Blue (#2563EB) | Light Blue |
    | IN_PROGRESS / APPROVED_BY_ABOVE | Selesaikan | Purple (#9333EA) | Light Purple |
    | COMPLETED | Selesai | Gray (#6B7280) | Light Gray |
  
  - **Visual Indicators**:
    - Blue dot under dates with events
    - Red dot on selected date
    - Hover effect on clickable days
    - Empty state: "Tidak ada event"
    - Loading state: "Loading..."

- **CSS Updates** (`src/pages/admin/Calendar/Calendar.css`):
  - Added `.admin-side-status.{type}` classes for color coding
  - Added `.has-event::after` for event indicator dot
  - Added hover effects for interactive elements
  - Added `.admin-side-loading` and `.admin-side-empty` states

- **Impact**:
  - ✅ Calendar shows real service request data
  - ✅ Color-coded actions make it easy to see what needs to be done
  - ✅ Click event → navigate directly to detail page
  - ✅ Month navigation works properly
  - ✅ Cached data for fast navigation
  - ✅ Clear visual hierarchy with colors

- **Bug Fixes**:
  - Fixed: Calendar now enriches event data with full details via `getServiceRequestDetailCached`
  - Fixed: Device info extraction now tries multiple data sources (device, device_model, firstDetail)
  - Fixed: Status detection now uses `event.status.code` instead of statusById lookup
  - Added: Debug console logs for troubleshooting device info and status
  - Changed: Default device label from "Device" to "Perangkat"
  - Changed: Default model label from "-" to "Model tidak tersedia"
----------
