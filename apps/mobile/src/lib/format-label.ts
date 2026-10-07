/** "event_spaces" -> "Event spaces". Shared by category and vibe-type display. */
export function formatLabel(value: string): string {
  const spaced = value.replace(/_/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
