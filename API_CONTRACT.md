# API Contract - Frontend Expectations

This document describes the API endpoints and response formats that the frontend expects from the Laravel backend.

## Base URL
```
http://localhost:8000/api
```

Configured in `.env` as `VITE_API_BASE_URL`

---

## Authentication

### Login
```http
POST /auth/login
Content-Type: application/json
```

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Success Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "role": "user",
    "department": "IT"
  }
}
```

**Error Response (401):**
```json
{
  "message": "Invalid credentials"
}
```

---

## Service Requests

### Get Service List (Paginated)
```http
GET /services?page=1&per_page=10
Authorization: Bearer {token}
```

**Query Parameters:**
- `page` (optional, default: 1) - Page number
- `per_page` (optional, default: 10) - Items per page
- `limit` (optional) - Max items to return
- `sort` (optional, default: created_at) - Sort field
- `order` (optional, default: desc) - Sort order (asc/desc)

**Success Response (200):**
```json
{
  "data": [
    {
      "id": 1,
      "device_type": "Laptop",
      "device": "Laptop",
      "brand": "Lenovo",
      "model": "V14",
      "device_model": "V14",
      "serial_number": "SN123456",
      "service_type": "Hardware",
      "description": "Keyboard rusak",
      "issue_description": "Keyboard rusak",
      "status": "Pending",
      "requester_name": "John Doe",
      "user_name": "John Doe",
      "department": "IT",
      "created_at": "2026-01-15T12:00:00Z",
      "approved_at": null,
      "updated_at": "2026-01-15T12:00:00Z"
    }
  ],
  "pagination": {
    "current_page": 1,
    "last_page": 5,
    "total": 48,
    "per_page": 10
  }
}
```

**Alternative pagination format (also supported):**
```json
{
  "data": {
    "data": [...],
    "meta": {
      "current_page": 1,
      "last_page": 5,
      "total": 48
    }
  }
}
```

---

### Get Service Detail
```http
GET /services/{id}
Authorization: Bearer {token}
```

**Success Response (200):**
```json
{
  "data": {
    "id": 1,
    "code": "REQ-001",
    "request_code": "REQ-001",
    "device_type": "Laptop",
    "device": "Laptop",
    "brand": "Lenovo",
    "model": "V14",
    "device_model": "V14",
    "device_brand": "Lenovo",
    "serial_number": "SN123456",
    "sn": "SN123456",
    "service_type": "Hardware",
    "service": "Hardware",
    "description": "Keyboard rusak",
    "issue_description": "Keyboard rusak",
    "status": "Pending",
    "requester_name": "John Doe",
    "user_name": "John Doe",
    "department": "IT",
    "created_at": "2026-01-15T12:00:00Z",
    "approved_at": null,
    "updated_at": "2026-01-15T12:00:00Z",
    "timeline": [
      {
        "id": 1,
        "label": "Menunggu Approval",
        "status": "Menunggu Approval",
        "date": "2026-01-15T12:00:00Z",
        "created_at": "2026-01-15T12:00:00Z",
        "note": "Request dibuat oleh John Doe",
        "description": "Request dibuat oleh John Doe",
        "state": "active"
      }
    ]
  }
}
```

**Error Response (404):**
```json
{
  "message": "Service request not found"
}
```

---

### Create Service Request
```http
POST /services
Authorization: Bearer {token}
Content-Type: multipart/form-data
```

**Request Body (FormData):**
```
device_type: "Laptop"
brand: "Lenovo"
model: "V14"
serial_number: "SN123456"
service_type: "Hardware"
description: "Keyboard rusak"
photo: [File] (optional)
```

**Success Response (201):**
```json
{
  "data": {
    "id": 1,
    "device_type": "Laptop",
    "brand": "Lenovo",
    "model": "V14",
    "serial_number": "SN123456",
    "service_type": "Hardware",
    "description": "Keyboard rusak",
    "status": "Pending",
    "created_at": "2026-01-15T12:00:00Z"
  }
}
```

**Error Response (422):**
```json
{
  "message": "Validation failed",
  "errors": {
    "serial_number": ["The serial number field is required."],
    "description": ["The description field is required."]
  }
}
```

---

## Field Mapping

The frontend supports multiple field name variations for compatibility:

| Frontend Display | Backend Options |
|-----------------|-----------------|
| Device Type     | `device_type`, `device` |
| Brand           | `brand`, `device_brand` |
| Model           | `model`, `device_model` |
| Serial Number   | `serial_number`, `sn` |
| Service Type    | `service_type`, `service` |
| Description     | `description`, `issue_description` |
| Requester       | `requester_name`, `user_name` |
| Request Code    | `code`, `request_code` |

**The backend can use any of these field names, and the frontend will handle it correctly.**

---

## 401 Handling

When any request returns a 401 status:
1. Frontend automatically logs out the user
2. Clears token from localStorage
3. Redirects to `/login`

No special backend configuration needed - just return 401 when token is invalid/expired.

---

## Date Formats

The frontend expects ISO 8601 format:
```
2026-01-15T12:00:00Z
```

The frontend will format dates for display automatically.

---

## Status Values

The frontend handles any status values but expects strings:
- "Pending"
- "Menunggu Approve"
- "Proses"
- "Selesai"
- etc.

---

## Photo Upload

When a photo is uploaded in the Create Request form:
- Field name: `photo`
- Type: File (image)
- Format: multipart/form-data
- Optional field

Backend should accept file uploads and store appropriately.

---

## Timeline Format

Timeline can be:
1. Returned in service detail response
2. Fetched separately with `GET /services/{id}/timeline`

Either approach works. The frontend expects an array of timeline events with:
```json
{
  "id": 1,
  "label": "Status label",
  "date": "2026-01-15T12:00:00Z",
  "note": "Description of this status change",
  "state": "active" // or "inactive"
}
```

---

## CORS Configuration

The backend should allow:
- Origin: `http://localhost:5173` (Vite dev server)
- Methods: GET, POST, PUT, DELETE, OPTIONS
- Headers: Authorization, Content-Type
- Credentials: true (for cookies if needed)

---

## Error Response Format

The frontend expects errors in this format:
```json
{
  "message": "Error message here"
}
```

For validation errors:
```json
{
  "message": "Validation failed",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}
```

---

## Testing with Postman

### 1. Login
```
POST http://localhost:8000/api/auth/login
Headers:
  Content-Type: application/json
Body:
{
  "email": "user@example.com",
  "password": "password"
}
```

### 2. Get Services (use token from login)
```
GET http://localhost:8000/api/services?page=1&per_page=10
Headers:
  Authorization: Bearer {your_token}
```

### 3. Create Service
```
POST http://localhost:8000/api/services
Headers:
  Authorization: Bearer {your_token}
  Content-Type: multipart/form-data
Body (form-data):
  device_type: Laptop
  brand: Lenovo
  model: V14
  serial_number: SN123
  service_type: Hardware
  description: Test request
```

---

## Summary

The frontend is flexible and will work with various field names and response structures. Key requirements:

1. ✅ Return JWT token on login
2. ✅ Accept Bearer token in Authorization header
3. ✅ Return 401 for invalid/expired tokens
4. ✅ Paginated responses with current_page/last_page/total
5. ✅ Support FormData for file uploads
6. ✅ ISO 8601 date format

**The frontend handles the rest!**
