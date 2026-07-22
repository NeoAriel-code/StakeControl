export async function persistThenRunBestEffort<T>(
  persist: () => Promise<T>,
  runAfterPersistence: () => Promise<void>,
  reportSecondaryError: (error: unknown) => void
) {
  const persisted = await persist();

  try {
    await runAfterPersistence();
  } catch (error) {
    reportSecondaryError(error);
  }

  return persisted;
}
