# QuickStart - Local Testing

## What Was Fixed
✅ CreateListingPage now uses axios (sends JWT token automatically)  
✅ user_id is now from JWT, not from form (secure)  
✅ FormData properly handled with multipart/form-data  
✅ Better error messages for debugging

## Step-by-Step: Get It Running

### Step 1: Add Cloudinary Credentials
Edit `server/.env` and add:

```env
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Get these from: https://cloudinary.com/console

### Step 2: Verify Frontend Configuration
Check `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
```

### Step 3: Start Backend
```bash
cd server
npm start
# Should show: "Server running on port 5000"
```

### Step 4: Start Frontend (New Terminal)
```bash
cd client
npm run dev
# Should show: "Local: http://localhost:5173"
```

### Step 5: Test
1. Go to http://localhost:5173
2. Click "Login"
3. Enter test credentials
4. Go to "Create Listing"
5. Fill in form + select image
6. Click "Create"

### Expected Success
- Image uploads to Cloudinary (not local)
- Listing appears with Cloudinary image URL
- No `net::ERR_CONNECTION_CLOSED` errors

---

## If Still Getting `net::ERR_CONNECTION_CLOSED`

### Check 1: Backend Running?
```bash
# In new terminal:
curl http://localhost:5000
# Should return: "API running"
```

### Check 2: Port 5000 In Use?
```bash
netstat -ano | findstr :5000
```
If something is there, kill it or use different port.

### Check 3: Check Backend Logs
Look in terminal where you ran `npm start` for any errors.  
Common issues:
- "Cannot find module" → run `npm install`
- "CLOUDINARY_CLOUD_NAME is undefined" → add to .env
- "ECONNREFUSED" → database not running

### Check 4: Frontend Env Variable
```javascript
// Open browser console (F12) and run:
import.meta.env.VITE_API_URL
// Should return: "http://localhost:5000/api"
```

### Check 5: JWT Token
```javascript
// In browser console:
localStorage.getItem('token')
// Should return a long string starting with "eyJ..."
// If empty, log in first
```

---

## Common Issues

| Error | Solution |
|-------|----------|
| `net::ERR_CONNECTION_CLOSED` | Backend not running. Run `cd server && npm start` |
| `Failed to fetch` | Check VITE_API_URL in `client/.env` |
| `Cloudinary image fails` | Add credentials to `server/.env` and restart |
| `401 Unauthorized` | Not logged in. Log in first. |
| `400 Missing fields` | Make sure image is selected |
| `413 Payload Too Large` | Image is >5MB. Use smaller image. |

---

## Production Deployment
Once local testing works, follow:
- Upload to GitHub
- Deploy backend to Render
- Deploy frontend to Vercel
- Add env vars to each platform
- See TROUBLESHOOTING.md for full guide
