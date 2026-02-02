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
----------
