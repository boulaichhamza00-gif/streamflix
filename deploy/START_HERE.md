# StreamFlix - Deployment Guide

## Quick Start

### Option 1: Local Deployment (Zorin OS / Ubuntu)

1. **Install MongoDB** (if not already installed):
```bash
sudo systemctl start mongod
```

2. **Install dependencies**:
```bash
cd backend
npm install
```

3. **Update environment variables**:
Edit `backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/streamflix
JWT_SECRET=your-secret-key-here
PORT=5000
```

4. **Start the server**:
```bash
cd backend
npm start
```

5. **Access the app**:
Open browser to: http://localhost:5000

---

### Option 2: Deploy to Render/Railway/Heroku

1. **Push to GitHub**:
```bash
git init
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Connect to Render/Railway**:
- Create account on render.com or railway.app
- Connect your GitHub repo
- Set environment variables (MONGODB_URI, JWT_SECRET)
- Deploy

---

### Option 3: Deploy with Docker

1. **Build and run**:
```bash
docker-compose up -d
```

---

## First Time Setup

### Create Admin User

1. Register at `/register` with your email
2. Run this in MongoDB to make yourself admin:

```javascript
db.users.updateOne(
  { email: "your-email@example.com" },
  { $set: { isAdmin: true, subscriptionStatus: "premium" } }
)
```

### Upload M3U Playlist

1. Login as admin
2. Go to Admin Panel
3. Click "M3U Upload"
4. Upload your .m3u or .m3u8 file
5. Select channels to import
6. Click "Import"

---

## File Structure

```
deploy/
├── backend/           # Node.js API
│   ├── src/
│   │   ├── models/   # Database schemas
│   │   ├── routes/   # API endpoints
│   │   └── middleware/ # Auth & admin checks
│   ├── uploads/      # M3U upload directory
│   ├── server.js     # Entry point
│   └── package.json
└── public/           # React frontend (built)
    ├── index.html
    └── assets/
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login user |
| GET | /api/channels | Get all channels |
| GET | /api/admin/stats | Admin dashboard stats |
| POST | /api/admin/m3u/parse | Parse M3U file |

---

## Troubleshooting

**Port already in use:**
```bash
sudo kill -9 $(sudo lsof -t -i:5000)
```

**MongoDB not connecting:**
```bash
sudo systemctl restart mongod
```

**Clear database:**
```bash
mongo streamflix --eval "db.dropDatabase()"
```
