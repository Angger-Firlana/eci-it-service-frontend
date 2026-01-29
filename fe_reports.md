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
