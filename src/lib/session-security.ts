export function isSessionVersionCurrent(tokenVersion: number, storedVersion: number) {
  return Number.isInteger(tokenVersion) && tokenVersion >= 0 && tokenVersion === storedVersion;
}
