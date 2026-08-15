# Loopit 2.0 Migration Map

## Purpose

This document defines the migration direction from the current Marathon-centric Loopit data model to the Loopit 2.0 Education Business OS model.

**Status:** Architecture planning only. No production migration is authorized by this document.

## 1. Core model mapping

| Current model | Loopit 2.0 target | Strategy | Risk |
|---|---|---|---|
| `Organizer` | `Organization` | Rename/map organization identity and settings | Medium |
| `User` | `User` | Keep identity; expand organization membership/roles | Medium |
| `Student` | `Student` | Keep identity; remove hard dependency on one marathon | High |
| `Marathon` | `Program` | Map marathon as one program type/use case | High |
| `Group` | `Group` | Keep concept; attach to course/program structure | Medium |
| `Curator` | `OrganizationMembership` + user role | Replace standalone staff entity | High |
| `Task` | `Lesson` / `Homework` | Split content and assignment concerns | High |
| `Submission` | `HomeworkSubmission` | Preserve student work/history | Medium |
| `Invitation` | Membership/invitation flow | Redesign around organization membership | Medium |
| `ChatMessage` | `Message` | Generalize communication | Medium |
| `Announcement` | `Announcement` | Generalize beyond marathon | Low |
| `Broadcast` | `Notification` / campaign | Move into communication layer | Medium |
| `PendingOtp` | Auth subsystem | Keep separate from education domain | Low |
| `Habit` | Student engagement/productivity module | Defer from core migration | Low |
| `MatrixTask` | Student productivity module | Defer from core migration | Low |

## 2. Critical transformations

### Organization

Current `Organizer` contains company identity, subscription information, users, curators and marathons. It becomes the tenant boundary in Loopit 2.0.

Target direction:

```text
Organization
├── memberships
├── students
├── programs
├── courses
├── groups
├── CRM
├── billing
├── communication
└── audit/activity
```

### Users and staff

Do not create a separate table for every staff type. A user should be able to belong to one or more organizations through membership records.

```text
User
└── OrganizationMembership
    ├── OWNER
    ├── ADMIN / ORGANIZER
    ├── MANAGER
    ├── TEACHER
    └── CURATOR
```

This allows the same person to have different roles in different organizations.

### Students

The current `Student.marathonId` is a structural limitation. A student should belong to an organization and participate in programs/courses/groups through enrollment records.

```text
Student
└── Enrollment
    ├── Program
    ├── Course
    └── Group
```

Existing marathon membership must be converted into an enrollment during migration.

### Marathon → Program

A marathon is not the core business entity in Loopit 2.0. It becomes a program/use case.

```text
Program
├── type = COURSE
├── type = MARATHON
├── type = BOOTCAMP
└── type = OTHER
```

Existing marathon title, description, dates and organization ownership should be preserved when creating the corresponding program.

### Curator → Membership

Current curator records combine a person, staff role and organization relationship. In V2, the person remains a `User`; organization-specific permissions belong to membership/role data.

Existing curator-to-group/student relationships must be mapped carefully before the old table is removed.

### Task / Submission

Do not blindly rename `Task` to `Homework`.

Separate:

```text
Lesson / Content
        ↓
Homework / Assignment
        ↓
HomeworkSubmission
        ↓
Grade / Feedback / Status
```

The existing submission history must remain recoverable.

## 3. Data that should be preserved

- User identity and verification state
- Organization identity
- Student identity and contact information
- Existing marathon/program names and dates
- Group membership
- Curator/staff relationships
- Tasks and submission history
- Announcements
- Chat history where supported by the V2 model
- Invitation state where still relevant
- Subscription state and billing metadata where compatible

## 4. Data requiring transformation

- `Organizer` → `Organization`
- `organizerId` references → `organizationId` references
- `Marathon` → `Program`
- `marathonId` → enrollment/program relationships
- `Curator` → user + organization membership
- `Task` → lesson/homework structures
- `Submission` → homework submission
- `Broadcast` → notification/campaign model

## 5. Data not migrated into the initial core

`Habit` and `MatrixTask` should not block the Education Business OS foundation. Their data can be retained or migrated later into a student engagement module.

## 6. Safe migration order

```text
1. Backup current database
2. Freeze target V2 schema
3. Add new target tables/columns without deleting old data
4. Create Organizations from Organizers
5. Create/validate User memberships
6. Create Programs from Marathons
7. Create Courses/Groups/enrollments
8. Migrate Students
9. Migrate staff relationships
10. Migrate lessons/homework/submissions
11. Migrate communication data
12. Run row-count and referential-integrity checks
13. Switch application reads/writes to V2 domain layer
14. Monitor
15. Only later remove deprecated structures
```

## 7. Rollback principle

No destructive migration should be part of the first deployment. The first migration stage must be additive and reversible. Old tables should remain until V2 data integrity and application behavior have been verified.

## 8. Phase 1 implementation target

The first vertical slice should be:

```text
Organization
  ↓
Student
  ↓
Program
  ↓
Course
  ↓
Group
  ↓
Enrollment
  ↓
Lesson
  ↓
Attendance
```

After this flow is stable, build CRM, billing, notifications, analytics and audit functionality around the same organization boundary.

## 9. Explicit non-goals for this phase

- No production database migration yet
- No destructive table drops
- No removal of current Marathon functionality
- No large UI rewrite before the core domain layer is stable
- No speculative AI features before core education operations work reliably
