# TeamConnect - Attendance & Chat Management System

## Overview
TeamConnect is a comprehensive attendance tracking and team communication platform built with React, Firebase, and TypeScript. It provides role-based access control, geolocation-based attendance marking, and real-time group chat functionality.

## Tech Stack
- **Frontend**: React with Vite, TypeScript
- **Backend/Database**: Firebase (Authentication, Firestore, Realtime Database, Storage)
- **Styling**: Tailwind CSS with Shadcn UI components
- **State Management**: TanStack Query (React Query)
- **Routing**: Wouter
- **Charts**: Recharts for attendance statistics

## Architecture

### Data Model
All schemas are defined in `shared/schema.ts`:
- **User**: email, displayName, role, photoURL, createdAt, createdBy
- **Attendance**: userId, userName, timestamp, date, coordinates, distance, status
- **ChatGroup**: name, createdBy, members, createdAt
- **ChatMessage**: groupId, senderId, senderName, message, timestamp

### User Roles
1. **Admin**: Can create all user types, view all data, access all features
2. **Manager**: Can create HR and Employee accounts, manage groups, view reports
3. **HR**: Can view attendance reports, message employees
4. **Employee**: Can mark attendance, participate in chats
5. **Client**: Can only access assigned chat groups

### Firebase Structure

**Firestore Collections**:
- `users` - User profiles and role information
- `chatGroups` - Chat group metadata and member lists
- `chatMessages` - All chat messages with real-time updates

**Realtime Database**:
- `attendance/{userId}/{year}/{month}` - Attendance records organized by user, year, and month

## Features Implemented

### Authentication
- Email/password authentication via Firebase Auth
- Public registration page with first-user bootstrap
- **First User Setup**: The first registered user automatically becomes Admin
- **Subsequent Users**: New registrations default to Employee role (Admin can change roles)
- Role-based access control
- Protected routes based on user roles
- Persistent auth state with context provider

### First-Time Setup (Bootstrap)
1. Navigate to `/register` to create the first account
2. First user automatically gets Administrator privileges
3. **Registration is automatically disabled** after the first admin is created (security measure)
4. Admin can then create other users with appropriate roles via the Users page
5. No self-registration after bootstrap - all accounts must be created by Admin/Manager

### Attendance Tracking
- Geolocation-based check-in (1km radius from office)
- Haversine formula for distance calculation
- Office coordinates: 11.2036529, 77.8042980 (Bangalore, India)
- Year-based filtering of attendance history
- Real-time location status display
- Prevent duplicate attendance for same day

### Chat System
- Real-time group messaging with Firestore
- Group creation by Admin/Manager roles
- Member selection and management
- Live message updates using Firestore snapshots
- Message bubbles with sender info and timestamps
- Unread count and group list

### Reports & Analytics
- Monthly attendance statistics with Recharts
- Year-based filtering
- Total attendance, monthly average, peak month calculations
- Visual bar chart showing attendance trends
- Detailed monthly breakdown

### User Management
- Admin/Manager can create new users
- Role-based account creation permissions
- User listing with profile information
- Avatar display with fallback initials

### Dashboard
- Role-specific quick actions
- Statistics cards (attendance count, chat groups, total users)
- Activity overview
- Personalized welcome message

## Project Structure

```
client/src/
├── components/
│   ├── ui/              # Shadcn UI components
│   ├── app-sidebar.tsx  # Main navigation sidebar
│   └── protected-route.tsx # Route protection wrapper
├── lib/
│   ├── firebase.ts      # Firebase configuration
│   ├── auth-context.tsx # Auth state management
│   ├── location.ts      # Geolocation utilities
│   ├── queryClient.ts   # React Query setup
│   └── utils.ts         # Utility functions
├── pages/
│   ├── login.tsx        # Login page
│   ├── dashboard.tsx    # Home dashboard
│   ├── attendance.tsx   # Attendance tracking
│   ├── chat.tsx         # Chat interface
│   ├── reports.tsx      # Attendance reports
│   ├── users.tsx        # User management
│   └── settings.tsx     # User settings
├── App.tsx              # Main app with routing
├── main.tsx             # App entry point
└── index.css            # Global styles

shared/
└── schema.ts            # TypeScript schemas and types
```

## Design System

### Colors
- Primary: Blue (#3B82F6) - used for branding and primary actions
- Charts: Multi-color palette for data visualization
- Role colors: Unique colors for each user role badge

### Typography
- Font: Inter (system-ui fallback)
- Hierarchy: 3xl (page titles), xl (section headers), lg (card titles), base (body)

### Components
- Uses Shadcn UI component library
- Consistent spacing (p-4, p-6, gap-4, gap-6)
- Rounded corners (rounded-md)
- Hover and active states with elevation system

### Responsive Design
- Mobile: Single column, collapsible sidebar
- Tablet: Two-column grids
- Desktop: Full sidebar, three-column grids

## Key Features

### Geolocation Attendance
1. Requests browser location permission
2. Calculates distance using Haversine formula
3. Shows distance from office in km
4. Enables attendance button only within 1km radius
5. Prevents duplicate marking for same day
6. Stores coordinates and distance with each record

### Real-time Chat
1. Firestore snapshots for live updates
2. Message bubbles with sender identification
3. Group member management
4. Timestamp display
5. Separate styling for sent vs received messages

### Role-based Permissions
- Navigation items filtered by role
- Feature access controlled at route level
- Account creation restricted by role hierarchy
- Admin > Manager > HR/Employee > Client

## Environment Setup

### Firebase Configuration
Firebase is already configured with the provided credentials in `client/src/lib/firebase.ts`.

### Office Location
Set in `shared/schema.ts`:
- Latitude: 11.2036529
- Longitude: 77.8042980
- Radius: 1km

## Current Status

**Phase 1 (Schema & Frontend)**: ✅ Complete
- All data models defined
- All React components built
- Firebase configuration set up
- Design system implemented
- Routing configured

**Phase 2 (Backend)**: Pending
- Firebase operations need to be connected
- Error handling to be enhanced

**Phase 3 (Integration & Testing)**: Pending
- Connect components to Firebase
- Test all user journeys
- Add final polish

## Notes
- The app uses in-memory storage pattern but actually connects to Firebase
- All authentication is handled by Firebase Auth
- Chat messages use Firestore for real-time capabilities
- Attendance uses Realtime Database for efficient querying by date
- Location services must be enabled in the browser
- HTTPS required for geolocation API in production
