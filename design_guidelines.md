# TeamConnect Design Guidelines

## Design Approach

**Selected Approach**: Design System - Modern Productivity Application  
**Primary References**: Linear (clean, efficient UI), Slack (chat interface), Material Design (data visualization)  
**Rationale**: TeamConnect is a utility-focused business application requiring clear information hierarchy, efficient workflows, and reliable patterns for role-based management, attendance tracking, and team communication.

## Typography

**Font Families**:
- Primary: Inter (via Google Fonts CDN) - headings, navigation, UI elements
- Secondary: system-ui fallback for optimal performance

**Hierarchy**:
- Page Headers: text-3xl font-semibold
- Section Headers: text-xl font-semibold  
- Card Titles: text-lg font-medium
- Body Text: text-base font-normal
- Metadata/Timestamps: text-sm text-gray-600
- Buttons/CTAs: text-sm font-medium

## Layout System

**Spacing Primitives**: Tailwind units of 2, 4, 6, 8, 12, 16, 20, 24
- Component padding: p-4, p-6, p-8
- Section gaps: gap-4, gap-6, gap-8
- Margins: mt-8, mb-6, mx-4

**Grid Structure**:
- Dashboard: Sidebar (w-64) + Main content (flex-1)
- Content max-width: max-w-7xl mx-auto
- Card grids: grid-cols-1 md:grid-cols-2 lg:grid-cols-3
- Forms: max-w-md for focused input

## Component Library

### Navigation
- **Sidebar**: Fixed left navigation (w-64), full height, sections for Home/Attendance/Chat/Reports/Settings
- **Top Navbar**: User profile dropdown (right-aligned), app logo (left), role badge
- **Mobile**: Collapsible hamburger menu, bottom navigation bar

### Dashboard Cards
- **Stat Cards**: Attendance count, team size, pending approvals - rounded-lg border shadow-sm with p-6
- **Chart Container**: Monthly attendance visualization using Recharts, min-height h-80, rounded-lg border
- **Recent Activity**: List with avatar + timestamp + action description

### Attendance Interface
- **Location Status Banner**: Top-of-page alert showing distance from office (green if within 1km, red if outside)
- **Mark Attendance Button**: Large, prominent CTA (w-full md:w-auto px-8 py-3) - disabled state when out of range
- **Attendance History Table**: Striped rows, sortable headers, year filter dropdown (top-right)
- **Calendar View**: Month grid showing present/absent days with visual indicators

### Chat Interface
- **Group List Sidebar**: Left panel (w-80) with scrollable group cards, unread count badges
- **Message Area**: Center panel with bubbles (sent messages align right with distinct styling, received align left)
- **Message Bubble**: rounded-2xl px-4 py-2, sender name + timestamp below, max-w-md
- **Input Box**: Fixed bottom, border-t, with send icon button (Lucide Send)

### Forms
- **Input Fields**: border rounded-md px-4 py-2.5, focus:ring-2 focus:ring-offset-1
- **Labels**: text-sm font-medium mb-1.5, above inputs
- **Error States**: text-red-600 text-sm mt-1, red border on input
- **Role Selection**: Radio button group or dropdown with clear visual distinction

### Role Management
- **User Cards**: Avatar + name + role badge + action buttons (horizontal layout)
- **Role Badges**: Rounded pills with distinct styling per role (Admin/Manager/HR/Employee/Client)
- **Permission Matrix**: Table showing capabilities per role

## Icons

**Library**: Lucide React (via CDN)  
**Usage**:
- Navigation items (Home, Calendar, MessageSquare, BarChart, Settings)
- Attendance (MapPin, CheckCircle, XCircle, Clock)
- Chat (Send, Users, Hash, Plus)
- Dashboard (TrendingUp, Users, Activity)
- Size: w-5 h-5 standard, w-6 h-6 for prominent actions

## Images

**No hero images required** - this is a functional business application, not a marketing site.

**Profile Avatars**: 
- User avatars throughout (w-8 h-8 to w-12 h-12 rounded-full)
- Placeholder initials for users without photos
- Team/group avatars in chat interface

**Empty States**: 
- Illustration placeholders for "No attendance records", "No messages yet", "No groups assigned"
- Descriptive text with CTA button to take action

## Responsive Breakpoints

- **Mobile** (< 768px): Single column, bottom nav, collapsible sidebar
- **Tablet** (768px - 1024px): Two-column grids, persistent sidebar with icons only
- **Desktop** (> 1024px): Full sidebar with labels, three-column grids, expanded chat layout

## Animations

**Minimal & Purposeful**:
- Sidebar expand/collapse: transition-all duration-200
- Toast notifications: Slide in from top-right (attendance marked, message sent)
- Loading states: Spinner for data fetching, skeleton screens for tables
- **No scroll animations, parallax, or decorative motion**

## Key Screens Layout

**Login/Register**: Centered card (max-w-md), logo above, form fields, submit button, link to alternate page

**Dashboard**: Sidebar + 3-column stat cards + attendance chart + recent activity list

**Attendance Page**: Location banner (top) + Mark Attendance card + Year filter + History table (striped rows)

**Chat Page**: Three-panel layout (Groups list | Messages | Group info/members)

**Reports Page**: Filter controls (top) + Chart visualization + Export button + Data table

This design prioritizes clarity, efficiency, and professional polish appropriate for a business productivity tool serving multiple organizational roles.