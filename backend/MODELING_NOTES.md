# MongoDB Modeling Decisions

- `Institute` -> **Reference root collection**. Shared by users/courses/batches; high fan-out, so referencing avoids document bloat.
- `User` -> **Reference root collection** with embedded `roles[]` strings. Roles are small and user-scoped; embedding removes extra join collection.
- `Course`, `Subcourse`, `Module` -> **Referenced hierarchy**. These entities are reused across enrollments/content/progress and need independent querying and indexing.
- `Content` + `profile` -> **Embed profile in content**. `category/instructions/downloadable/responseType` are 1:1 with content and always fetched together.
- `Batch` + `detail` -> **Embed detail in batch**. Batch detail is a strict one-to-one extension, optimized for single-read operations.
- `UserCourse`, `UserBatch`, `BatchTeacher` -> **Referenced mapping collections**. Many-to-many relationships need separate lifecycle and unique constraints.
- `UserProgress` -> **Referenced collection** with unique index `(userId,moduleId)`. Supports frequent updates and independent analytics.
- `StudentSubmission` -> **Referenced collection**. High-write workload and potentially unbounded growth, best kept separate.
- `SystemSetting` -> **Singleton reference document** holding tenant mode and `defaultInstituteId`, used for startup bootstrap and tenancy decisions.

This design keeps write-heavy and relationship-heavy data in separate collections while embedding only small, tightly coupled 1:1 attributes.
