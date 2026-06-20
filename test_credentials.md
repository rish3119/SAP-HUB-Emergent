
Action: file_editor create /app/memory/test_credentials.md --file-text "# Test Credentials - TCS SAP Hub

## Admin
- Email: `admin@tcs.com`
- Password: `Admin@123`
- Role: admin
- Seeded name: Priya Iyer

## Associate (test user)
- Email: `associate@tcs.com`
- Password: `Associate@123`
- Role: associate
- Seeded name: Arjun Mehta

## Auth Endpoints
- POST `/api/auth/register` - body: `{email, password, name}` (sets httpOnly cookie, also returns token)
- POST `/api/auth/login` - body: `{email, password}`
- POST `/api/auth/logout`
- GET  `/api/auth/me` (auth required)

## Notes
- Auth via httpOnly cookie `access_token` (12h). Frontend uses `withCredentials: true`.
- A `token` is also returned for Authorization Bearer header fallback.
"
Observation: Overwrite successful: /app/memory/test_credentials.md