const CURRENT_USER_ID_STORAGE_KEY = 'manywatch.currentUserId';

export function getCurrentUserId(): string {
  const savedUserId = localStorage.getItem(CURRENT_USER_ID_STORAGE_KEY);

  if (savedUserId) {
    return savedUserId;
  }

  const userId = crypto.randomUUID();
  localStorage.setItem(CURRENT_USER_ID_STORAGE_KEY, userId);

  return userId;
}
