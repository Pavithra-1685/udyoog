# Career Pathway Platform Documentation

## 🚀 Project Overview
**Career Pathway** is a high-performance, role-based career management and placement platform designed for educational institutions. It facilitates seamless interaction between students, faculty members, and administrators to streamline the placement process, portfolio building, and talent discovery.

The platform is localized for the Indian market, featuring **INR (₹) currency support** and standardized date formats.

---

## 🛠 Technology Stack
- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS, Lucide React (Icons), Framer Motion (Animations)
- **Backend & Database**: Supabase (PostgreSQL, Auth, Real-time)
- **Routing**: React Router 7
- **UI Components**: Custom Design System with "Premium Glassmorphism" aesthetics

---

## 🔐 Role-Based Access Control (RBAC)
The platform enforces strict data isolation and navigation control through a dual-layer security system.

### 1. User Roles
| Role | Primary Responsibility |
| :--- | :--- |
| **Admin** | Manages company relations, job openings, and overall platform analytics. |
| **Faculty** | Monitors student progress, verifies skills, and manages the Talent Pool. |
| **Student** | Builds professional portfolios, tracks placement progress, and uses AI coaching. |

### 2. RoleGuard (Frontend)
A centralized `RoleGuard` component protects all routes. If a user attempts to access a page outside their role's permissions, they are automatically redirected to their appropriate dashboard.

### 3. Row Level Security (RLS) (Backend)
Database security is enforced via PostgreSQL RLS policies:
- **Profiles**: Admins/Faculty can view all; Students can only view/edit their own.
- **Companies/Activities**: Admin/Faculty view only; strictly hidden from students.
- **Recursive Protection**: Uses a `check_is_admin_or_faculty()` helper function with `SECURITY DEFINER` to prevent infinite recursion during role checks.

---

## 📂 Key Features

### 🏢 Admin Dashboard (Company CRM)
- **Company Tracking**: Manage the pipeline of visiting companies (Applied, Interviewing, Selected).
- **Activity Logs**: Record real-time interactions with placement partners.
- **Archive System**: Store historical data of past recruitment drives.

### 🎓 Faculty Control Center
- **Student Directory**: A complete searchable list of the student body.
- **Competency Matrix**: Real-time analytics on student skill levels and portfolio completion.
- **Student Detail View**: Deep dive into individual student performance and projects.

### 💼 Student Portal
- **Portfolio Builder**: Dynamic form to capture skills, projects, and academic records.
- **AI Interview Coach**: AI-powered prep tool to help students practice for specific roles.
- **Placement Roadmap**: Visual tracker for current placement milestones.

### 🔍 Smart Talent Pool
- **Cross-Role Search**: Accessible to both Admins and Faculty.
- **Smart Matching**: Automatically calculates a "Match Percentage" between student skills and active job requirements.
- **Branch/Location Filtering**: Precision filtering for targeted recruitment.

---

## 📁 Project Structure
```text
src/
├── app/
│   ├── components/
│   │   ├── admin/       # Company & CRM components
│   │   ├── shared/      # Navigation, RoleGuard, Auth
│   │   └── student/     # Portfolio & Analytics components
│   ├── pages/
│   │   ├── admin/       # Dashboard, Talent Pool, Archive
│   │   ├── faculty/     # Control Center, Student Details
│   │   └── student/     # Student Dashboard, AI Coach
│   └── routes.tsx       # Centralized Role-Based Routing
├── lib/
│   └── supabase.ts      # Supabase Client Configuration
└── supabase/
    └── migrations/      # SQL Schema & Security Policies
```

---

## 🚦 Development & Setup

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Installation
```bash
npm install
npm run dev
```

### Database Setup
Apply all migrations in the `supabase/migrations/` folder to your Supabase project in order, finishing with `20240518_security_and_faculty_login.sql` to ensure role-based permissions are correctly initialized.

---

## 🇮🇳 Localization Note
- **Currency**: All salary and financial figures are displayed in **Indian Rupee (₹)**.
- **Timezone**: Logging and activity dates are locked to the user's local system date to ensure accurate real-time tracking.
