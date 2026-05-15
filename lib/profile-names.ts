/**
 * Single source of truth for display-name logic.
 *
 * The app is patient-centric: every name shown in the UI refers to the patient.
 *
 * For patients (is_custodian = false):  patient name = their own name (profile.name or profile.patient_name)
 * For carers  (is_custodian = true):    patient name = profile.patient_name
 *
 * Exception: personal greetings ("Good morning") use getGreetingName() which always returns
 * the logged-in user's own name from the Name field on their profile page.
 */

export type ProfileNameFields = {
  name?: string | null;
  patient_name?: string | null;
  is_custodian?: boolean | null;
};

/** Returns the first word of a full name, or null if the name is empty. */
export function firstNameOf(fullName: string | null | undefined): string | null {
  const trimmed = fullName?.trim();
  if (!trimmed) return null;
  return trimmed.split(/\s+/)[0];
}

/**
 * The logged-in user's own name from their profile "Name" field.
 * Used only for personal greetings: "Good morning, [name]".
 */
export function getGreetingName(profile: ProfileNameFields | null | undefined): string | null {
  if (!profile) return null;
  return profile.name?.trim() ?? null;
}

/**
 * The patient's name — used everywhere else in the UI.
 *
 * For carers:   returns patient_name (the person being cared for).
 * For patients: returns patient_name if set, falling back to name.
 */
export function getDisplayName(profile: ProfileNameFields | null | undefined): string | null {
  if (!profile) return null;
  // patient_name is the canonical field for the person the app is about
  if (profile.patient_name?.trim()) return profile.patient_name.trim();
  // fallback: own name (for patients who haven't gone through the new onboarding)
  return profile.name?.trim() ?? null;
}
