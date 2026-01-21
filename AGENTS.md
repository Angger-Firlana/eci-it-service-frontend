# Project Notes for Next Agent

## Overview
- Frontend-only UI build for ECI IT Service. Roles: user/admin/atasan, user and atasan pages are implemented.
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

## Behavior / State
- `src/App.tsx`:
  - `role` state controls login vs app view
  - `activeRoute` state controls page switch
  - `sidebarRoute` keeps Service List highlighted during detail view
  - `detailVariant` controls atasan detail view variant (approval vs progress)
  - `menuItems` changes based on role (user vs atasan)
  - `onLogout` sets `role` to null and returns to login

## Assets
- Images: `src/assets/images`
  - `loginpageimage.png`, `login_maskot.png`, `admin_maskot.png`, `atasan_maskot.png`, `logo-removebg-preview.png`, `maskot-eci-rmeove 1.png`
- Icons already in `src/assets/icons`
  - Added `inbox.svg` for atasan sidebar

## What's Left / TODO
- Admin pages (currently placeholders only via login role state)
- Real routing (React Router) if needed
- Backend integration (API hooks) for list/detail/calendar data
- Login form validation/auth

## Styling Notes
- Keep dashboard styles unchanged
- Create Request is intentionally larger; all styles are scoped to `.create-request`
- Timeline and calendar are pixel-matched to provided references, but may need fine-tuning if new designs arrive
