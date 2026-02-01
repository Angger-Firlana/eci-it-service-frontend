Frontend Report

Location: C:\Users\trisb\tugasreactnative\service-test\eci-it-service-frontend

Notes
- Admin "Inbox" is treated as an admin work queue (only requests that require admin action by admin: approve/reject, set lokasi).
- Vendor lokasi form now matches backend validation for `location_type=external`: `vendor_id`, `address`, `city`, `province`, `postal_code`, `maps_url`.
- Backend naming: `vendor_approvals` is presented as "Approval Atasan" in UI; vendor-review statuses are ignored in the admin flow.

Changes
- Implemented Admin Inbox list backed by API + cached enrichment: `src/pages/admin/Inbox/Inbox.jsx`
- Implemented Admin Inbox Detail approval + set lokasi flow (workshop/vendor) + timeline from audit logs: `src/pages/admin/Inbox/InboxDetail.jsx`
- Added reference caching helpers for statuses/vendors/cost-types: `src/lib/referenceCache.js`
- Admin approve uses `PUT /service-requests/:id` to set `APPROVED_BY_ADMIN` so audit log/timeline is created reliably.
- Fixed Timeline in InboxDetail:
  - Always shows "Request dibuat" entry first (synthesized from created_at)
  - Matches ServiceDetail styling with proper vertical connector line
  - Better status labels: "Menunggu Approval", "Disetujui", "Menunggu Approve", etc.

---

## Session: 2026-01-31 - Atasan Role Implementation

### Overview
Implemented all 6 Atasan pages with real API integration, caching, and proper error handling.

### Changes Made

#### 1. Atasan Dashboard (`src/pages/atasan/Dashboard/Dashboard.jsx`)
- **Complete rewrite** - Now fetches real data from API
- Fetches approval stats from `/inbox-approvals/{statusId}` for pending(15), approved(16), rejected(17)
- Calculates and displays dynamic stats: Total, Menunggu Approve, Disetujui, Ditolak
- Shows 5 most recent pending approvals in RequestList
- Navigates to `/inbox/{id}` on detail click
- Added loading/error states with retry button
- Added CSS for loading/error/empty states in `Dashboard.css`

#### 2. Atasan Inbox (`src/pages/atasan/Inbox/Inbox.jsx`)
- **Complete rewrite** - Now fetches real data from API
- Fetches approvals from `/inbox-approvals/{statusId}` based on filter
- Status filter dropdown: Pending, Approved, Rejected, All
- Enriches each approval with service request detail, locations, and costs
- Displays device type, model, service type, location, cost, status
- Search functionality for filtering results
- AbortController for cleanup on unmount
- Added CSS for filter dropdown, status colors, pagination in `ServiceList.css`

#### 3. Atasan InboxDetail (`src/pages/atasan/Inbox/InboxDetail.jsx`)
- **Complete rewrite** - Main approval flow implementation
- Fetches service request detail + costs + locations
- Finds current user's approval from `vendor_approvals`
- **Action Card** - Shows when approval is pending:
  - Notes textarea
  - Reject button → `POST /service-requests/rejected/{approvalId}` (requires notes)
  - Approve button → `POST /service-requests/approved/{approvalId}`
- **Status Cards** - Shows when already approved/rejected
- **Approval Status Card** - Shows all approvers with progress bar
- **Timeline** - Built from `audit_logs` with proper status mapping
- **Cost Breakdown** - Shows service fee, cancellation fee, total
- Optimistic updates with cache invalidation
- Console logging for debugging
- Added extensive CSS for status cards, approval cards, error/success states in `ServiceDetail.css`

#### 4. Atasan ServiceList (`src/pages/atasan/ServiceList/ServiceList.jsx`)
- **Complete rewrite** - Now fetches ALL services from API
- Pagination support with page navigation
- Search functionality
- Enriches with device details, locations, costs
- Read-only view (no action buttons)
- AbortController for cleanup
- Added pagination CSS

#### 5. Atasan ServiceDetail (`src/pages/atasan/ServiceList/ServiceDetail.jsx`)
- **Complete rewrite** - Read-only view of any service request
- Fetches service request detail + costs + locations
- Shows device info, vendor info, cost breakdown
- Displays approval status with progress bar
- Builds timeline from `audit_logs`
- No action buttons (read-only)

#### 6. Atasan Calendar (`src/pages/atasan/Calendar/Calendar.jsx`)
- **Complete rewrite** - Filtered by atasan's approvals
- Fetches all approvals (pending, approved, rejected) from `/inbox-approvals/{statusId}`
- Gets unique service IDs and fetches their details
- Shows events: Request Created, Assigned (to atasan), Approved
- Click navigates to `/inbox/{serviceId}`
- Reuses user Calendar CSS

### API Endpoints Used
- `GET /inbox-approvals/15` - Pending approvals for current user
- `GET /inbox-approvals/16` - Approved approvals for current user
- `GET /inbox-approvals/17` - Rejected approvals for current user
- `POST /service-requests/approved/{approvalId}` - Approve request
- `POST /service-requests/rejected/{approvalId}` - Reject request (with notes)
- `GET /service-requests/{id}` - Get service request detail
- `GET /service-requests/{id}/costs` - Get costs
- `GET /service-requests/{id}/locations` - Get locations

### Frontend Best Practices Applied
1. **Caching** - Uses `getServiceRequestDetailCached`, `getStatusMapsCached`, etc.
2. **AbortController** - All async effects use AbortController for cleanup
3. **Error Handling** - `getErrorMessage()` helper for extracting meaningful errors
4. **Console Logging** - Contextual logging like `[Atasan/InboxDetail] Approving: {id}`
5. **Cache Invalidation** - `invalidateServiceRequestCache(id)` after mutations
6. **Loading States** - Granular loading states for different operations
7. **Optimistic Updates** - UI updates immediately, rollback on failure

### Files Modified
- `src/pages/atasan/Dashboard/Dashboard.jsx` - Complete rewrite
- `src/pages/atasan/Dashboard/Dashboard.css` - Added loading/error/empty states
- `src/pages/atasan/Inbox/Inbox.jsx` - Complete rewrite
- `src/pages/atasan/Inbox/InboxDetail.jsx` - Complete rewrite
- `src/pages/atasan/ServiceList/ServiceList.jsx` - Complete rewrite
- `src/pages/atasan/ServiceList/ServiceList.css` - Added filter, pagination, status styles
- `src/pages/atasan/ServiceList/ServiceDetail.jsx` - Complete rewrite
- `src/pages/atasan/ServiceList/ServiceDetail.css` - Added approval cards, status cards, error styles
- `src/pages/atasan/Calendar/Calendar.jsx` - Complete rewrite

### No Backend Changes Required
All APIs already existed. No backend modifications were needed.

---

## Session: 2026-02-01 - Invoice Feature & Dashboard Fixes

### Overview
Completed invoice download functionality for all detail pages and fixed dashboard flickering issue.

### Bug Fix
- Fixed "Cetak Invoice" not showing on some detail pages because `GET /service-requests/{id}` returns `status` without `code`. UI now derives `status_code` via `status_id` + `getStatusMapsCached({ entityTypeId: 1 })`.

### Changes Made

#### 1. Admin InboxDetail Invoice Download (`src/pages/admin/Inbox/InboxDetail.jsx`)
- Added `buildApiUrl` import from `../../../lib/api`
- Added `PRINTABLE_STATUS_CODES` constant for status validation
- Added `isDownloading` state for download button loading state
- Added `canPrintInvoice` useMemo to check if current status allows invoice printing
- Added `handlePrintInvoice` function to download PDF via `GET /service-requests/{id}/preview-invoice`
- Added "Cetak Invoice" button in timeline card (uses existing `admin-invoice-btn` CSS class)

**Printable Status Codes:**
- `APPROVED_BY_ADMIN`
- `IN_REVIEW_ABOVE`
- `APPROVED_BY_ABOVE`
- `REJECTED_BY_ABOVE`
- `IN_PROGRESS`
- `COMPLETED`

#### 2. Dashboard Flickering Fix (`src/components/user/dashboard/RequestList/RequestList.jsx`)
- Added `emptyMessage` prop (default: "Belum ada request")
- Added `hideWhenEmpty` prop (default: false) to optionally hide entire component when empty
- Added `hasRequests` computed variable to check array validity
- Added empty state rendering with `request-list-empty` class
- Prevents flickering by properly handling empty state

**CSS Added (`RequestList.css`):**
```css
.request-list-empty {
  text-align: center;
  padding: 40px 20px;
  color: #666;
  font-size: 14px;
  font-family: 'Poppins', sans-serif;
}
```

#### 3. Atasan Dashboard Cleanup (`src/pages/atasan/Dashboard/Dashboard.jsx`)
- Removed duplicate empty state div (now handled by RequestList component)
- Added `emptyMessage` prop to RequestList: "Tidak ada request yang menunggu approval"

### Files Modified
- `src/pages/admin/Inbox/InboxDetail.jsx` - Added invoice download functionality
- `src/components/user/dashboard/RequestList/RequestList.jsx` - Added empty state handling
- `src/components/user/dashboard/RequestList/RequestList.css` - Added empty state styles
- `src/pages/atasan/Dashboard/Dashboard.jsx` - Removed duplicate empty state

### Invoice Feature Summary (All Pages Complete)
| Page | Status |
|------|--------|
| User ServiceDetail | ✅ Complete |
| Atasan ServiceDetail | ✅ Complete |
| Atasan InboxDetail | ✅ Complete |
| Admin InboxDetail | ✅ Complete |

### API Used
- `GET /service-requests/{id}/preview-invoice` - Downloads PDF invoice on-the-fly (deprecated)
- `GET /service-requests/{id}/download-invoice` - Downloads stored invoice PDF

---

## Session: 2026-02-01 - Bug Fixes (Admin ID & Invoice URL)

### Overview
Fixed critical bugs: admin_id not being set when admin approves, wrong invoice URL, and improved auth redirect handling.

### Changes Made

#### 1. Admin ID Not Set on Approval (`src/pages/admin/Inbox/InboxDetail.jsx`)
**Problem:** When admin approves/rejects a request, `admin_id` field was not being populated on the service request.

**Root Cause:** Backend `ServiceRequestService::updateServiceRequest()` expects `admin_id` in the request body:
```php
if(auth()->user()->roles->contains('id', Role::ADMIN)){
    $serviceRequest->update([
        'admin_id' => $data['admin_id'] ?? $serviceRequest->admin_id,
    ]);
}
```
If `admin_id` is not provided, it keeps the old value (null for user-created requests).

**Fix:**
- Added `import { useAuth } from '../../../contexts/AuthContext'`
- Added `const { user } = useAuth()` to component
- Updated `handleAdminApprove()` to include `admin_id: user?.id` in PUT body
- Updated `handleAdminReject()` to include `admin_id: user?.id` in PUT body

#### 2. Wrong Invoice URL - Hybrid Approach (All Detail Pages)
**Problem:** Frontend was using `/service-requests/{id}/preview-invoice` instead of `/download-invoice`.

**Backend Routes:**
- `/download-invoice` → Returns stored Invoice PDF (requires COMPLETED status, Invoice record must exist)
- `/preview-invoice` → Generates PDF on-the-fly (works from APPROVED_BY_ADMIN onwards, no Invoice record needed)

**Initial Fix Attempt:** Changed to use `/download-invoice` exclusively → **Failed for non-COMPLETED requests** (no Invoice record exists, returns "Data Not Found").

**Final Solution - Hybrid Approach:**
```javascript
const isCompleted = serviceStatusCode === 'COMPLETED';
const endpoint = isCompleted ? 'download-invoice' : 'preview-invoice';
```

- **COMPLETED status** → Uses `/download-invoice` (stored Invoice with final data)
- **Earlier statuses** (APPROVED_BY_ADMIN, IN_PROGRESS, etc.) → Uses `/preview-invoice` (generates on-the-fly)

**Files Updated:**
- `src/pages/user/ServiceList/ServiceDetail.jsx`
- `src/pages/atasan/ServiceList/ServiceDetail.jsx`
- `src/pages/atasan/Inbox/InboxDetail.jsx`
- `src/pages/admin/Inbox/InboxDetail.jsx`

#### 3. Enhanced Auth Redirect (`src/App.tsx`)
**Problem:** User wanted better handling when not authenticated - should immediately redirect to login instead of showing error.

**Improvements:**
- Already had redirect in place: `!isAuthenticated` → `<Navigate to="/login" />`
- Already had 401 handler: `setUnauthorizedHandler()` calls `logout()` + redirect
- **Added**: Clear corrupted auth state check - if token exists but user data is missing, auto-logout and redirect

### Files Modified
- `src/pages/admin/Inbox/InboxDetail.jsx` - Added admin_id to approve/reject, changed invoice URL
- `src/pages/user/ServiceList/ServiceDetail.jsx` - Changed invoice URL
- `src/pages/atasan/ServiceList/ServiceDetail.jsx` - Changed invoice URL
- `src/pages/atasan/Inbox/InboxDetail.jsx` - Changed invoice URL
- `src/App.tsx` - Enhanced auth state validation

### API Used
- `PUT /service-requests/{id}` with `{ admin_id, status_id, log_notes }` - Admin approve/reject with admin_id
- `GET /service-requests/{id}/download-invoice` - Download stored invoice PDF
