# Security Specification — PomboFit (`security_spec.md`)

## 1. Data Invariants
1. **Strict Tenant Isolation**: Every document in `/users/{userId}` and its subcollections (`workouts`, `sessions`, `exerciseLogs`, `measurements`, `photos`, `habits`, `calendar`) belongs exclusively to `userId` (`request.auth.uid == userId`). No user may read, list, create, update, or delete any document belonging to another `userId`.
2. **Master Gate Relational Sync**: No subcollection document under `/users/{userId}/{subcollection}/{docId}` can be created or updated unless the parent `/users/{userId}` profile document exists (`exists(/databases/$(database)/documents/users/$(userId))`).
3. **Identity Immutability**: `userId` and `createdAt` are immutable across all updates (`incoming().userId == existing().userId && incoming().createdAt == existing().createdAt`).
4. **Strict Server Timestamps**: `createdAt` on create and `updatedAt` on update must equal `request.time`.
5. **Bounded Arrays & Strings**: Every string has a strict `.size() <= MAX` bound, and every array has a `.size() <= MAX` bound plus first-element type verification when non-empty.
6. **Query Enforcer on List Operations**: Every `allow list` rule enforces `request.auth.uid == userId && resource.data.userId == request.auth.uid` without `get()`/`exists()` calls.

## 2. The "Dirty Dozen" Payloads

1. **Identity Spoofing on UserProfile**: Authenticated user `user_A` attempts to create `/users/user_A` with `userId: "user_B"`.
2. **Cross-Tenant Read**: Authenticated user `user_A` attempts `get` on `/users/user_B/photos/photo_1`.
3. **Shadow Field Injection on WorkoutPlan**: User sends `{ ...validWorkoutPlan, isAdmin: true }`.
4. **Orphan Subcollection Write**: User `user_A` (without `/users/user_A` created yet) attempts to create `/users/user_A/workouts/w1`.
5. **ID Poisoning Attack**: User attempts to create `/users/user_A/workouts/invalid$id!@#` with non-alphanumeric characters.
6. **Timestamp Forgery**: User sends a past or future client timestamp for `createdAt` instead of `request.time`.
7. **Immutable Field Mutation**: User attempts to update `createdAt` or `userId` on an existing `/users/user_A/measurements/m1` document.
8. **Array Overflow (Denial of Wallet)**: User sends `exercises` array with 100 items (exceeding max 30) in `WorkoutPlan`.
9. **Value Poisoning on Update**: User updates `displayName` on `/users/user_A` with a 5,000-character string or a boolean.
10. **Unscoped List Query**: User `user_A` attempts `list` on `/users/user_B/sessions`.
11. **Oversized ProgressPhoto**: User uploads an `imageDataUrl` exceeding 700,000 characters.
12. **Invalid Enum Value**: User sets `goal: "become_superman"` instead of `['lose_weight', 'gain_muscle', 'get_strong']`.
