# Student Core

Loopit 2.0 Student Core owns organization-scoped student profiles.

Current scope:
- create student
- read student
- list students by organization
- update student
- enforce organization isolation
- normalize basic profile fields

The current V2 schema models `Student` directly under `Organization`; this implementation follows that existing schema.