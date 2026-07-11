const USER_ID_STORAGE_KEY = 'manywatch_user_id';

export function getCurrentUserId(): string {
  const existingUserId = localStorage.getItem(USER_ID_STORAGE_KEY);

  if (existingUserId) {
    return existingUserId;
  }

  const userId = crypto.randomUUID();
  localStorage.setItem(USER_ID_STORAGE_KEY, userId);

  return userId;
}
