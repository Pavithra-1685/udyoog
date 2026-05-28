# Technical Implementation Plan: Career Pathway Enhancements

This document details the proposed changes to implement the requested features and modifications. The existing high-fidelity SREE UI aesthetics, responsive designs, and animations will be strictly preserved, and all operations are optimized to prevent page speed drops.

---

## User Review Required

> [!IMPORTANT]
> **Database Function Updates (Supabase)**
> To support the feature where **Faculty can also create candidates**, we must modify the database security definer functions: `admin_create_user`, `admin_update_user`, and `admin_delete_user` inside your Supabase Postgres Database. 
> I have provided a SQL migration script `supabase/migrations/20260528_faculty_candidate_privileges.sql` which can be executed directly in your Supabase SQL Editor.

---

## Proposed Changes

### 1. Database Migrations

#### [NEW] [20260528_faculty_candidate_privileges.sql](file:///Users/yuvashankarnarayana/Desktop/SREE/supabase/migrations/20260528_faculty_candidate_privileges.sql)
- SQL statements to add `resume_url` column to the `profiles` table.
- Updated security definer RPC functions `admin_create_user`, `admin_update_user`, and `admin_delete_user` to allow **Faculty** to manage student profiles, with safety constraints to prevent them from modifying faculty or admin accounts.

---

### 2. Authentication & Signup Enhancements

#### [MODIFY] [Auth.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/components/shared/Auth.tsx)
- **SIF No Rename**: Rename all Student "Reg No / Registration Number" placeholder labels to "SIF No".
- **Enforce Email + ID + Password Multi-Factor Authentication**:
  - When loging in as a student or faculty: both `email` and `sif_no / employee_id` are now strictly required.
  - Prior to signing in with Supabase auth: perform a fast check against the `profiles` table to verify that the entered `email` matches the `registration_no` and `role`. If it does not, throw a clear warning toast immediately.
- **Multiple Admins Support**:
  - Add hardcoded support for both `yuvashankar2211@gmail.com` and `Rajarajan2994@gmail.com` (password `rajarajan@pc@takshashila@1`).
  - Auto-provision the new admin profile in the database on first login.

---

### 3. Student Portfolio (Resume Link Upload)

#### [MODIFY] [StudentProfileForm.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/components/student/StudentProfileForm.tsx)
- Replaced "Registration No" field label with "SIF No".
- Add a new input field under the "Links" section: **Google Drive Resume Link (DOCX Format only)**.
- Include elegant validation and guidance text instructing the student to host their `.docx` resume on Drive and make the share link public.

#### [MODIFY] [Profile.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/pages/Profile.tsx)
- Update profile view form labels to reflect "SIF No".

---

### 4. Placements & Job Mappings

#### [MODIFY] [MappedCandidates.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/pages/admin/MappedCandidates.tsx)
- Add a **View Mode Toggle** at the top:
  - **Individual View** (current table list)
  - **Job Wise View** (new feature)
- **Job Wise View**:
  - Renders a clean grid layout of all active positions.
  - Each card displays company name, role title, package, location, and a badge with the count of mapped candidates.
  - Includes a clickable `<Users className="w-5 h-5" />` icon that triggers an overlay modal.
  - **Mappings Details Modal**: Displays a list of all students mapped to that job, showing their names, SIF No, CGPA, Branch, and pipeline status with link to view profile.

---

### 5. Talent Pool Deletions

#### [MODIFY] [TalentPool.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/pages/admin/TalentPool.tsx)
- Renamed "registration number" search text and UI descriptions to "SIF No".
- Display student's DOCX Resume Link next to GitHub/LinkedIn (if available).
- **Admin Delete Student**: If logged-in user is `admin`, display a trash button on student cards and a "Delete Student" button in the comparison drawer. Prompt double confirmation and call the `admin_delete_user` RPC.

---

### 6. Job Applications & Limit Checks

#### [MODIFY] [StudentDashboard.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/pages/student/StudentDashboard.tsx)
- **Limit Applied Jobs to 3**: Prior to calling candidate apply logic, count active applications (`status = 'applied'`). If $\ge 3$, display a warning toast asking them to withdraw an application first.
- **Remove Confetti**: Disable the `canvas-confetti` animation blocks when applying.
- Update profile card header descriptions to say "SIF No" rather than "Reg No".

#### [MODIFY] [Jobs.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/pages/admin/Jobs.tsx)
- **Limit Applied Jobs to 3**: Add the same $\le 3$ check here.
- **Remove Confetti**: Disable the `canvas-confetti` application animation block.
- **Read-More description toggle**:
  - Add expanded state tracker for job descriptions.
  - Display first 120 characters of the job description with a sleek "Click to Read More" toggle button.

---

### 7. Dashboard Reorganization

#### [MODIFY] [routes.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/routes.tsx)
- Swap `/dashboard` landing path to map to `Jobs` page (Open Positions).
- Map `/companies` path to the original company engagement dashboard (`Dashboard` page).
- Update `RoleGuard` rules to allow faculty members to access `users-management`.

#### [MODIFY] [Navigation.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/components/shared/Navigation.tsx)
- Reorganize admin dashboard items to place **Open Positions** on `/dashboard` and **Companies** on `/companies`.
- Add `Candidates` link (`/users-management`) to `facultyNavItems` to let them create and manage student accounts.

---

### 8. Faculty Portal Refinements

#### [MODIFY] [FacultyDashboard.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/pages/faculty/FacultyDashboard.tsx)
- **Competency Matrix removal**: Completely remove the Competency Matrix sidebar component.
- Expand student lookup and list directory views to fill the screen layout.

#### [MODIFY] [FacultyStudentDetail.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/pages/faculty/FacultyStudentDetail.tsx)
- Display the student's **Google Drive DOCX Resume Link** next to LinkedIn & GitHub.

#### [MODIFY] [UserManagement.tsx](file:///Users/yuvashankarnarayana/Desktop/SREE/src/app/pages/admin/UserManagement.tsx)
- **Faculty Access**: Allow faculty members to access user management.
- **Constraints for Faculty**:
  - Force active directory tab to `student` (hide Faculty directory tab entirely).
  - Hide role selection in provision modal (default to student).
  - Hide secondary non-student fields.

---

## Verification Plan

### Automated Checks
1. Run local build checks to verify type safety and compiler success:
   ```bash
   npm run build
   ```

### Manual Verification
1. Login with student account, verify placeholder renames, Drive resume upload, 3-job apply limits, and missing confetti.
2. Login with new admin `Rajarajan2994@gmail.com` and verify first landing page (Open Positions), Talent Pool student deletions, and placements job wise viewer.
3. Login with faculty account, verify matrix removal, candidate creation, and placement views.
