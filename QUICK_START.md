# Quick Start Guide

## Prerequisites

- Node.js 18+ installed
- Laravel backend running on `http://localhost:8000`
- Backend API available at `http://localhost:8000/api`

---

## Installation

```bash
cd C:\Users\trisb\tugasreactnative\service-test\eci-it-service-frontend
npm install
```

---

## Configuration

Create or update `.env` file:

```env
VITE_API_BASE_URL=http://localhost:8000/api
```

If your backend API is on a different URL, change it accordingly.

---

## Development

Start the dev server:

```bash
npm run dev
```

Open browser to: `http://localhost:5173`

---

## Build for Production

```bash
npm run build
```

Preview production build:

```bash
npm run preview
```

---

## Project Structure

```
src/
├── contexts/
│   ├── AuthContext.jsx          # Auth state management
│   └── ServiceCacheContext.jsx  # Service data cache
├── lib/
│   └── api.js                   # API utilities
├── pages/
│   ├── auth/
│   │   └── Login.jsx            # Login page
│   └── user/
│       ├── Dashboard/           # Dashboard (5 latest)
│       ├── ServiceList/         # Service list + detail
│       ├── CreateRequest/       # Create request form
│       └── Calendar/            # Calendar view
├── layouts/
│   ├── Layout/                  # Main layout
│   ├── Sidebar/                 # Navigation sidebar
│   └── Topbar/                  # Top bar with logout
├── components/                  # Reusable components
├── constants/                   # Constants and config
└── App.tsx                      # Main routing
```

---

## User Flow

### 1. Login
- URL: `/login`
- Enter email and password
- Click "Login"
- On success → Dashboard

### 2. Dashboard
- Shows 5 latest service requests
- Click "View All" → Service List
- Click any request → Service Detail

### 3. Service List
- Shows all your service requests (paginated)
- Use Prev/Next buttons to navigate pages
- Click "Detail" on any request → Service Detail

### 4. Service Detail
- URL: `/services/:id`
- Shows full details of the request
- Timeline of status changes
- Click "Back" → Service List

### 5. Create Request
- Click "Create Request" from sidebar
- **Step 1:** Select device, brand, model, enter serial number
- **Step 2:** Select service type, describe issue, upload photo (optional)
- **Step 3:** Review and confirm
- Click "Submit" → Redirects to created request detail

### 6. Calendar
- Shows all your requests on a calendar
- Blue dots = Request created
- Green dots = Request approved
- Click a date → See events for that day
- Click an event → Service detail

---

## Testing Without Backend

The app will show error messages if the backend is not available. To test:

1. Make sure backend is running
2. Make sure CORS is configured properly
3. Check browser console for API errors
4. Use browser Network tab to inspect API calls

---

## Common Issues

### Issue: "Failed to fetch"
**Cause:** Backend not running or CORS not configured
**Solution:**
1. Start Laravel backend: `php artisan serve`
2. Configure CORS in Laravel (`config/cors.php`)

### Issue: "401 Unauthorized"
**Cause:** Token expired or invalid
**Solution:** Log out and log in again

### Issue: TypeScript errors during build
**Cause:** Strict TypeScript settings
**Solution:** Already fixed with `allowJs: true` in `tsconfig.app.json`

### Issue: "Network Error"
**Cause:** Wrong API URL
**Solution:** Check `.env` file and ensure `VITE_API_BASE_URL` is correct

---

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API base URL | `http://localhost:8000/api` |

**Important:** After changing `.env`, restart the dev server!

---

## API Endpoints Used

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/login` | POST | User login |
| `/services` | GET | List service requests |
| `/services/:id` | GET | Get service detail |
| `/services` | POST | Create service request |

See `API_CONTRACT.md` for full API documentation.

---

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)

---

## Development Tips

### Hot Reload
Vite dev server supports hot reload. Changes to files automatically refresh the browser.

### Debug API Calls
Open browser DevTools → Network tab → Filter by XHR to see API requests.

### Clear Token
If you need to clear the stored token:
1. Open browser DevTools → Application tab
2. Go to Local Storage → `http://localhost:5173`
3. Delete `auth_token` and `auth_user` keys

### Check Auth State
In browser console:
```javascript
localStorage.getItem('auth_token')
localStorage.getItem('auth_user')
```

---

## Next Steps

1. ✅ Install and run: `npm install && npm run dev`
2. ✅ Configure `.env` with backend URL
3. ✅ Start Laravel backend
4. ✅ Test login with valid credentials
5. ✅ Explore the user flow
6. ✅ Check API calls in browser DevTools

---

## Need Help?

See:
- `IMPLEMENTATION_SUMMARY.md` - Full implementation details
- `API_CONTRACT.md` - API endpoint documentation
- Browser console for error messages
- Network tab for API call details

---

## Deployment

### Build
```bash
npm run build
```

This creates a `dist/` folder with optimized files.

### Deploy Options
1. **Static hosting:** Netlify, Vercel, GitHub Pages
2. **Server:** Apache, Nginx with proper routing
3. **Docker:** Create Dockerfile with Node.js

**Important:** Configure environment variables for production!

---

That's it! You're ready to use the ECI IT Service Frontend. 🚀
