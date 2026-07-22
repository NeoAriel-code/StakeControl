"use client";

import { useActionState } from "react";
import { ALERT_EMAIL_PREFERENCES } from "@/lib/notification-preferences";
import { updateEmailNotificationPreferencesAction, type SettingsActionState } from "@/lib/settings-actions";

const initialState: SettingsActionState = {};

export function EmailNotificationPreferencesForm({ preferences }: { preferences: Record<string, boolean> }) {
  const [state, action] = useActionState(updateEmailNotificationPreferencesAction, initialState);
  return <form action={action} className="space-y-3">
    <label className="flex gap-3 text-sm font-semibold text-foreground"><input name="emailAlertsEnabled" type="checkbox" defaultChecked={preferences.emailAlertsEnabled} /> Recibir alertas preventivas por email</label>
    {ALERT_EMAIL_PREFERENCES.map(({ field, label }) => <label key={field} className="flex gap-3 text-sm text-muted-foreground"><input name={field} type="checkbox" defaultChecked={preferences[field]} /> {label}</label>)}
    {state.success && <p className="text-sm text-success">{state.success}</p>}
    {state.error && <p className="text-sm text-danger">{state.error}</p>}
    <button type="submit" className="rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">Guardar alertas</button>
  </form>;
}
