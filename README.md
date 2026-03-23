# StreamFlix - Video Streaming Platform

A full-stack video streaming platform with HLS support, M3U playlist management, and a secure admin panel.

## Features

- **Netflix-Style UI**: Modern, responsive interface built with React and Tailwind CSS
- **HLS Video Streaming**: Supports HTTP Live Streaming with hls.js
- **M3U Playlist Import**: Upload and parse M3U files to bulk import channels
- **Secure Admin Panel**: JWT-protected admin routes with role-based access
- **Subscription Management**: Manage user subscriptions (Basic, Premium, Expired)
- **Playlist Management**: Create and manage channel playlists
- **Channel Gallery**: Browse channels by category with search functionality

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- React Router DOM
- hls.js for HLS playback
- Axios for API calls

### Backend
- Node.js + Express
- MongoDB + Mongoose
- JWT Authentication
- Multer for file uploads
- iptv-playlist-parser for M3U parsing

## Project Structure

```
streamflix/
├── backend/                    # Node.js/Express backend
│   ├── src/
│   │   ├── models/            # Mongoose schemas
│   │   │   ├── User.js
│   │   │   ├── Channel.js
│   │   │   └── Playlist.js
│   │   ├── middleware/        # Express middleware
│   │   │   ├── auth.js        # JWT authentication
│   │   │   ├── admin.js       # Admin authorization
│   │   │   └── upload.js      # File upload config
│   │   ├── routes/            # API routes
│   │   │   ├── auth.js
│   │   │   ├── channels.js
│   │   │   └── admin.js
│   │   └── utils/
│   │       └── m3uParser.js   # M3U parsing utilities
│   ├── uploads/               # Upload directory
│   ├── server.js              # Entry point
│   └── package.json
├── src/                       # React frontend
│   ├── components/
│   │   ├── Header.tsx
│   │   ├── ChannelCard.tsx
│   │   ├── ChannelRow.tsx
│   │   ├── VideoPlayer.tsx
│   │   └── admin/            # Admin components
│   │       ├── DashboardStats.tsx
│   │       ├── UserManagement.tsx
│   │       ├── ChannelManagement.tsx
│   │       ├── M3UUpload.tsx
│   │       └── PlaylistManagement.tsx
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   └── Admin.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── hooks/
│   │   ├── useChannels.ts
│   │   └── useAdmin.ts
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
└── package.json
```

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB (local or Atlas)

### 1. Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd backend && npm install
```

### 2. Environment Setup

Create `.env` file in the `backend` folder:

```env
MONGODB_URI=mongodb://localhost:27017/streamflix
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
PORT=5000
```

### 3. Seed Admin User

Create an admin user by registering with email `admin@streamflix.com` and then manually updating the `isAdmin` field in MongoDB:

```javascript
// In MongoDB shell or Compass
db.users.updateOne(
  { email: "admin@streamflix.com" },
  { $set: { isAdmin: true } }
)
```

### 4. Start the Application

```bash
# Start backend (from backend folder)
npm run dev

# Start frontend (from root folder)
npm run dev
```

The app will be available at:
- Frontend: http://localhost:5173
- Backend: http://localhost:5000

## API Documentation

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user
- `POST /api/auth/refresh` - Refresh JWT token

### Channels (Requires Subscription)
- `GET /api/channels` - Get all channels
- `GET /api/channels/categories` - Get channel categories
- `GET /api/channels/:id` - Get channel by ID
- `GET /api/channels/:id/stream` - Get stream URL

### Admin (Requires Admin Role)
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/:id/subscription` - Update user subscription
- `PUT /api/admin/users/:id/revoke` - Revoke user access
- `PUT /api/admin/users/:id/restore` - Restore user access
- `GET /api/admin/channels` - Get all channels (admin)
- `POST /api/admin/channels` - Create channel
- `PUT /api/admin/channels/:id` - Update channel
- `DELETE /api/admin/channels/:id` - Delete channel
- `PUT /api/admin/channels/:id/toggle` - Toggle channel status
- `POST /api/admin/m3u/parse` - Parse M3U file
- `POST /api/admin/m3u/import` - Import parsed channels
- `GET /api/admin/playlists` - Get all playlists
- `POST /api/admin/playlists` - Create playlist
- `PUT /api/admin/playlists/:id` - Update playlist
- `DELETE /api/admin/playlists/:id` - Delete playlist

## M3U Upload Workflow

1. **Upload M3U File**: Admin uploads an M3U file through the Admin Panel
2. **Parse Channels**: Backend parses the file using `iptv-playlist-parser`
3. **Preview & Select**: Admin sees a preview of parsed channels and selects which to import
4. **Import to Database**: Selected channels are saved to MongoDB
5. **User Playback**: Users can browse and play imported channels

## Security Features

- **JWT Authentication**: Secure token-based authentication
- **Admin Middleware**: Routes protected by `requireAdmin` middleware
- **Subscription Check**: Video playback requires valid subscription
- **Password Hashing**: bcryptjs for secure password storage
- **Input Validation**: Request validation on all endpoints

## Demo Credentials

- **Admin**: admin@streamflix.com / admin123
- **User**: user@streamflix.com / user123

## License

MIT
