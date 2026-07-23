import type { Event } from "@sentry/core";

export function scrubSentryEvent<T extends Event>(event: T): T {
  const category = event.tags?.category;
  const exceptionValues = event.exception?.values?.map((value) => ({
    type: value.type ?? "Error",
    value: "Operational error",
  }));

  return {
    ...event,
    message: undefined,
    request: undefined,
    extra: undefined,
    contexts: undefined,
    attachments: undefined,
    breadcrumbs: undefined,
    user: event.user?.id !== undefined ? { id: String(event.user.id) } : undefined,
    exception: exceptionValues ? { values: exceptionValues } : undefined,
    tags: category ? { category } : undefined,
  } as T;
}
