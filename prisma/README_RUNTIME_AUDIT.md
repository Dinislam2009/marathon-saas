# Runtime audit

- `Student.email` is currently required in `prisma/schema.prisma` (`String`).
- `lib/data.js:addStudentToMarathon()` explicitly converts a missing email to `null` before `student.create()`.
- This is a Prisma runtime validation mismatch: missing email can fail before the database write.

Next step: make the application contract consistent (prefer an explicit empty/placeholder email or make the field optional after confirming product requirements), then run Prisma validation/typecheck/build.