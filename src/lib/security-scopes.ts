export function buildUserScopedWhere(userId: string, id: string) {
  if (!userId || !id) {
    throw new Error("Missing user scope.");
  }

  return { id, userId };
}

export function assertSameUser(resourceUserId: string, currentUserId: string) {
  if (!resourceUserId || resourceUserId !== currentUserId) {
    throw new Error("Resource does not belong to the current user.");
  }
}
