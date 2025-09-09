# REFAEL — Golden Patch v1 ✅

This bundle fixes:
- **Catalog** page fully restored (filters, categories, layout — no truncated code).
- **Admin login** page styled; uses `lib/api.js` (`NEXT_PUBLIC_API`).
- **Products API**: robust filters + `/categories` route (ordered before `/:id`).
- **Admin API**: defaults & readable errors (no server crash on invalid input or duplicate id).
- **Checkout API**: email send with dev fallback; clear errors.

## Replace these files (1:1):
Frontend:
- `frontend/components/Catalog.jsx`
- `frontend/app/admin/login/page.jsx`

Backend:
- `backend/src/routes/products.js`
- `backend/src/routes/admin.js`
- `backend/src/routes/checkout.js`

## ENV
Frontend `.env.local`:
```
NEXT_PUBLIC_API=http://localhost:4001/api
```

Backend `.env` (example):
```
PORT=4001
CORS_ORIGIN=http://localhost:3000
ADMIN_USER=admin
ADMIN_PASS=admin123
ADMIN_JWT_SECRET=change-me
ADMIN_JWT_EXPIRES=7d

# SMTP (dev fallback works even if not set)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=youruser@example.com
SMTP_PASS=yourpass
ORDER_DEST_EMAIL=orders@example.com
```

## Quick tests
- `/api/products/categories` → `{ categories: [...] }`
- Create duplicate id → **409** with `"מזהה (ID) כבר קיים"`
- Checkout with missing phone → **400** `"Name and phone are required"`
- In dev (no SMTP): checkout returns `{ ok:true }` and logs a JSON email to the backend console.
