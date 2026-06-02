# Troubleshooting: net::ERR_CONNECTION_CLOSED

## Error Symptoms
- `Failed to fetch` in browser console
- `net::ERR_CONNECTION_CLOSED` 
- Cannot create listings

## Root Causes & Solutions

### 1. ✅ Backend Not Running
**Check:** Is the server running on `http://localhost:5000`?

```bash
# Terminal 1: Start the backend
cd server
npm start
# Should see: "Server running on port 5000"
```

**Test it:**
```bash
# Terminal 2: Test the connection
curl http://localhost:5000
# Should see: "API running"
```

---

### 2. ✅ Cloudinary Credentials Missing
**Check:** Does your `server/.env` have these set?

```bash
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**If not, add them:**
```bash
# 1. Go to https://cloudinary.com/console
# 2. Copy your Cloud Name, API Key, API Secret
# 3. Paste into server/.env
# 4. Save and restart server
```

---

### 3. ✅ Frontend API URL Wrong
**Check:** Does `client/.env` have the correct backend URL?

```bash
# For local development:
VITE_API_URL=http://localhost:5000/api

# For production (Render):
# VITE_API_URL=https://swapsphere-backend-bg1p.onrender.com/api
```

**If changed, restart frontend:**
```bash
cd client
npm run dev
```

---

### 4. ✅ Port 5000 Already In Use
**Check:** Is something else using port 5000?

```bash
# Windows - Find process on port 5000
netstat -ano | findstr :5000

# If found, kill it:
taskkill /PID <PID> /F

# Then restart server:
cd server && npm start
```

---

### 5. ✅ JWT Token Not Sent
**Check:** Are you logged in?

```javascript
// Open browser console and run:
localStorage.getItem('token')
// Should return a long JWT token string
```

**If empty:**
- Go to `/login`
- Log in with your account
- Then try creating a listing

---

### 6. ✅ Multer/Cloudinary Issue
**Check:** Backend logs for errors

```bash
# If you see errors like:
# "TypeError: Cannot read property 'path' of undefined"
# "CLOUDINARY_CLOUD_NAME is missing"

# Solution: Restart server after adding Cloudinary credentials
cd server
npm start
```

---

## Quick Checklist

- [ ] Backend running? (`npm start` in `server/` folder)
- [ ] Cloudinary credentials in `server/.env`?
- [ ] Frontend pointing to correct API URL in `client/.env`?
- [ ] User logged in? (check localStorage.getItem('token'))
- [ ] Port 5000 not blocked?
- [ ] Both `node_modules` installed? (`npm install` in server & client)

---

## Complete Reset (Nuclear Option)

```bash
# Kill all processes
taskkill /F /IM node.exe

# Clear and reinstall
cd server
rm -r node_modules package-lock.json
npm install
npm start

# In another terminal:
cd client
rm -r node_modules package-lock.json
npm install
npm run dev
```

---

## Still Broken?

1. Check exact error in browser DevTools Console (F12)
2. Check backend terminal for errors
3. Verify `server/.env` exists and has all required variables
4. Test with `curl http://localhost:5000` from terminal
