/**
 * Security Rules Verification Suite for PomboFit
 * Verifies all Dirty Dozen adversarial payloads are rejected with PERMISSION_DENIED.
 */

export interface DirtyDozenTestCase {
  id: number;
  name: string;
  authUid: string | null;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  path: string;
  payload?: Record<string, unknown>;
  expectedResult: 'PERMISSION_DENIED';
}

export const DIRTY_DOZEN_TESTS: DirtyDozenTestCase[] = [
  {
    id: 1,
    name: 'Identity Spoofing on UserProfile',
    authUid: 'user_A',
    operation: 'create',
    path: '/users/user_A',
    payload: { userId: 'user_B', displayName: 'Spoofer' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 2,
    name: 'Cross-Tenant Read on Private ProgressPhoto',
    authUid: 'user_A',
    operation: 'get',
    path: '/users/user_B/photos/photo_1',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 3,
    name: 'Shadow Field Injection on WorkoutPlan',
    authUid: 'user_A',
    operation: 'create',
    path: '/users/user_A/workouts/w_1',
    payload: { userId: 'user_A', name: 'Treino A', isAdmin: true },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 4,
    name: 'Orphan Subcollection Write without Parent User Document',
    authUid: 'user_orphan',
    operation: 'create',
    path: '/users/user_orphan/workouts/w_1',
    payload: { userId: 'user_orphan', name: 'Treino Orfao' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 5,
    name: 'ID Poisoning Attack with Special Characters',
    authUid: 'user_A',
    operation: 'create',
    path: '/users/user_A/workouts/bad$id!@#',
    payload: { userId: 'user_A', name: 'Treino A' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 6,
    name: 'Timestamp Forgery on createdAt',
    authUid: 'user_A',
    operation: 'create',
    path: '/users/user_A/measurements/m_1',
    payload: { userId: 'user_A', dateISO: '2026-01-01', weightKg: 80, createdAt: '1999-01-01T00:00:00Z' },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 7,
    name: 'Immutable Field Mutation on userId/createdAt',
    authUid: 'user_A',
    operation: 'update',
    path: '/users/user_A/measurements/m_1',
    payload: { userId: 'user_B', weightKg: 82 },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 8,
    name: 'Array Overflow on WorkoutPlan exercises (>30)',
    authUid: 'user_A',
    operation: 'create',
    path: '/users/user_A/workouts/w_overflow',
    payload: { userId: 'user_A', exercises: new Array(35).fill({ exerciseId: 'ex1' }) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 9,
    name: 'Value Poisoning on UserProfile displayName',
    authUid: 'user_A',
    operation: 'update',
    path: '/users/user_A',
    payload: { displayName: 'A'.repeat(500) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 10,
    name: 'Unscoped Cross-Tenant List Query on WorkoutSessions',
    authUid: 'user_A',
    operation: 'list',
    path: '/users/user_B/sessions',
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 11,
    name: 'Oversized ProgressPhoto Payload (>700KB string)',
    authUid: 'user_A',
    operation: 'create',
    path: '/users/user_A/photos/p_huge',
    payload: { userId: 'user_A', imageDataUrl: 'data:image/jpeg;base64,' + 'A'.repeat(700005) },
    expectedResult: 'PERMISSION_DENIED',
  },
  {
    id: 12,
    name: 'Invalid Enum Value on UserProfile goal',
    authUid: 'user_A',
    operation: 'update',
    path: '/users/user_A',
    payload: { goal: 'invalid_goal_value' },
    expectedResult: 'PERMISSION_DENIED',
  },
];
