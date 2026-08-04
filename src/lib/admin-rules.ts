export function canRemoveAdministrator(targetIsAdmin: boolean, administratorCount: number) {
  return !targetIsAdmin || administratorCount > 1;
}
