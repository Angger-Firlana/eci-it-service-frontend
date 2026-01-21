# Project Notes for Next Agent

## Overview
- Frontend-only UI build for ECI IT Service. Roles: user/admin/atasan are implemented.
- Layout now lives in `src/layouts` (Layout/Sidebar/Topbar).
- Routing is a simple state switch in `src/App.tsx` (no React Router yet).
- Login is the initial screen; selecting a role sets `role` state and shows role-specific UI.

## Current Pages
- Login: `src/pages/auth/Login.jsx` + `Login.css`
  - Uses `src/assets/images/loginpageimage.png` as full background
  - Uses `src/assets/images/login_maskot.png` for mascot
- User Dashboard: `src/pages/user/Dashboard`
- User Create Request (3-step flow): `src/pages/user/CreateRequest`
  - Styles are scoped under `.create-request` to avoid bleeding into dashboard
- User Service List: `src/pages/user/ServiceList/ServiceList.jsx` + CSS
- User Service Detail: `src/pages/user/ServiceList/ServiceDetail.jsx` + CSS
- User Calendar: `src/pages/user/Calendar/Calendar.jsx` + CSS
- Atasan Dashboard: `src/pages/atasan/Dashboard/Dashboard.jsx` + CSS
- Atasan Service List: `src/pages/atasan/ServiceList/ServiceList.jsx` + CSS
- Atasan Service Detail (approval + progress variants): `src/pages/atasan/ServiceList/ServiceDetail.jsx` + CSS
- Atasan Calendar: `src/pages/atasan/Calendar/Calendar.jsx`
- Atasan Inbox placeholder: `src/pages/atasan/Inbox/Inbox.jsx`
- Admin Dashboard: `src/pages/admin/Dashboard/Dashboard.jsx` + CSS
- Admin Service List: `src/pages/admin/ServiceList/ServiceList.jsx` + CSS
- Admin Service Detail (wrapper to atasan progress): `src/pages/admin/ServiceList/ServiceDetail.jsx`
- Admin Inbox List + Detail (multi-variant + modals): `src/pages/admin/Inbox/Inbox.jsx` + `src/pages/admin/Inbox/InboxDetail.jsx` + CSS
- Admin Calendar: `src/pages/admin/Calendar/Calendar.jsx` + CSS
- Admin Manage Users: `src/pages/admin/ManageUsers/ManageUsers.jsx` + CSS
- Admin Master Data (Perangkat/Model/Service + modals): `src/pages/admin/MasterData/MasterData.jsx` + CSS

## Behavior / State
- `src/App.tsx`:
  - `role` state controls login vs app view
  - `activeRoute` state controls page switch
  - `sidebarRoute` keeps Service List and Inbox highlighted during detail view
  - `detailVariant` controls atasan detail view variant (approval vs progress)
  - `adminInboxVariant` controls admin inbox detail variant
  - `menuItems` changes based on role (user vs atasan vs admin)
  - `onLogout` sets `role` to null and returns to login
  - Admin routes: `/manage-users`, `/master-data`, `/inbox/detail`, `/service-list/detail`

## Assets
- Images: `src/assets/images`
  - `loginpageimage.png`, `login_maskot.png`, `admin_maskot.png`, `atasan_maskot.png`, `logo-removebg-preview.png`, `maskot-eci-rmeove 1.png`
- Icons already in `src/assets/icons`
  - Added `inbox.svg` for atasan sidebar

## What's Left / TODO
- Real routing (React Router) if needed
- Backend integration (API hooks) for list/detail/calendar data
- Login form validation/auth
- Atasan inbox implementation (still placeholder)

## Styling Notes
- Keep dashboard styles unchanged
- Create Request is intentionally larger; all styles are scoped to `.create-request`
- Timeline and calendar are pixel-matched to provided references, but may need fine-tuning if new designs arrive
- Admin UI styles use `admin-` prefixed classes; shared modal styling lives in `src/components/common/Modal/Modal.css`
